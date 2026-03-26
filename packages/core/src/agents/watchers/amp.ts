/**
 * Amp agent watcher
 *
 * Watches ~/.local/share/amp/threads/ for JSON file changes,
 * determines agent status from the last message, and emits events
 * mapped to mux sessions via the project directory in each thread.
 *
 * All file I/O is async to avoid blocking the server event loop.
 */

import { watch, type FSWatcher } from "fs";
import { readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";
import type { AgentStatus } from "../../contracts/agent";
import type { AgentWatcher, AgentWatcherContext } from "../../contracts/agent-watcher";

// --- Thread file types ---

interface MessageState {
  type?: "complete" | "cancelled" | "streaming";
  stopReason?: "end_turn" | "tool_use";
}

interface Message {
  role?: string;
  state?: MessageState;
}

interface ThreadSnapshot {
  status: AgentStatus;
  version: number;
  title?: string;
  projectDir?: string;
}

const STALE_MS = 5 * 60 * 1000;
const POLL_MS = 2000;

// --- Status detection ---

export function determineStatus(lastMsg: { role?: string; state?: MessageState } | null): AgentStatus {
  if (!lastMsg?.role) return "idle";

  if (lastMsg.role === "user") return "running";

  if (lastMsg.role === "assistant") {
    if (!lastMsg.state) return "running";
    if (lastMsg.state.type === "streaming") return "running";
    if (lastMsg.state.type === "cancelled") return "interrupted";
    if (lastMsg.state.type === "complete") {
      if (lastMsg.state.stopReason === "tool_use") return "running";
      if (lastMsg.state.stopReason === "end_turn") return "done";
    }
    return "waiting";
  }

  return "idle";
}

// --- Async thread file parsing ---

async function parseThreadFile(filePath: string): Promise<{ version: number; title?: string; projectDir?: string; lastMessage: Message | null } | null> {
  try {
    const raw = await Bun.file(filePath).text();
    const thread = JSON.parse(raw);
    const messages = thread.messages ?? [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const uri: string = thread.env?.initial?.trees?.[0]?.uri ?? "";
    const projectDir = uri.startsWith("file://") ? uri.slice(7) : undefined;

    return {
      version: thread.v ?? 0,
      title: thread.title || undefined,
      projectDir,
      lastMessage: lastMsg ? { role: lastMsg.role, state: lastMsg.state } : null,
    };
  } catch {
    return null;
  }
}

// --- Watcher implementation ---

export class AmpAgentWatcher implements AgentWatcher {
  readonly name = "amp";

  private threads = new Map<string, ThreadSnapshot>();
  private fsWatcher: FSWatcher | null = null;
  private sessionWatcher: FSWatcher | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private ctx: AgentWatcherContext | null = null;
  private threadsDir: string;
  private sessionFile: string;
  private scanning = false;
  private seeded = false;
  private lastFocusedThread: string | null = null;

  constructor() {
    const dataDir = join(homedir(), ".local", "share", "amp");
    this.threadsDir = join(dataDir, "threads");
    this.sessionFile = join(dataDir, "session.json");
  }

  start(ctx: AgentWatcherContext): void {
    this.ctx = ctx;
    this.setupWatch();
    this.setupSessionWatch();
    setTimeout(() => this.scan(), 50);
    this.pollTimer = setInterval(() => this.scan(), POLL_MS);
  }

  stop(): void {
    if (this.fsWatcher) { try { this.fsWatcher.close(); } catch {} this.fsWatcher = null; }
    if (this.sessionWatcher) { try { this.sessionWatcher.close(); } catch {} this.sessionWatcher = null; }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.ctx = null;
  }

  private async processThread(filePath: string): Promise<boolean> {
    if (!this.ctx) return false;

    let fileStat;
    try { fileStat = await stat(filePath); } catch { return false; }

    const threadId = basename(filePath, ".json");
    const prev = this.threads.get(threadId);

    // Quick mtime check — skip if file hasn't changed since we last saw this version
    if (prev && fileStat.mtimeMs <= (prev as any)._mtime) return false;

    const parsed = await parseThreadFile(filePath);
    if (!parsed) return false;

    if (prev && parsed.version === prev.version) {
      // Update mtime even if version unchanged to avoid re-reading
      (prev as any)._mtime = fileStat.mtimeMs;
      return false;
    }

    const status = determineStatus(parsed.lastMessage);
    const session = parsed.projectDir
      ? this.ctx.resolveSession(parsed.projectDir) ?? "unknown"
      : "unknown";

    const prevStatus = prev?.status;
    const snapshot: ThreadSnapshot & { _mtime: number } = {
      status,
      version: parsed.version,
      title: parsed.title,
      projectDir: parsed.projectDir,
      _mtime: fileStat.mtimeMs,
    };
    this.threads.set(threadId, snapshot);

    // Seed mode: record state without emitting
    if (!this.seeded) return false;

    if (status !== prevStatus && session !== "unknown") {
      this.ctx.emit({
        agent: "amp",
        session,
        status,
        ts: Date.now(),
        threadId,
        threadName: parsed.title,
      });
      return true;
    }
    return false;
  }

  private async scan(): Promise<void> {
    if (this.scanning || !this.ctx) return;
    this.scanning = true;

    try {
      let files: string[];
      try { files = await readdir(this.threadsDir); } catch { return; }

      const now = Date.now();
      for (const file of files) {
        if (!file.startsWith("T-") || !file.endsWith(".json")) continue;
        const filePath = join(this.threadsDir, file);
        let fileStat;
        try { fileStat = await stat(filePath); } catch { continue; }
        if (now - fileStat.mtimeMs > STALE_MS) continue;
        await this.processThread(filePath);
      }
    } finally {
      if (!this.seeded) this.seeded = true;
      this.scanning = false;
    }
  }

  private setupWatch(): void {
    try {
      this.fsWatcher = watch(this.threadsDir, (_eventType, filename) => {
        if (!filename?.startsWith("T-") || !filename.endsWith(".json")) return;
        this.processThread(join(this.threadsDir, filename));
      });
    } catch {
      // fs.watch failed; polling handles it
    }
  }

  /** Watch Amp's session.json for lastThreadId changes — thread-level "seen" signal */
  private setupSessionWatch(): void {
    // Seed the initial focused thread
    this.checkSessionFocus();

    try {
      this.sessionWatcher = watch(this.sessionFile, () => {
        this.checkSessionFocus();
      });
    } catch {
      // session.json doesn't exist yet or can't be watched; ignore
    }
  }

  /** Read session.json and emit "idle" for a terminal thread the user has focused in Amp */
  private async checkSessionFocus(): Promise<void> {
    if (!this.ctx || !this.seeded) return;

    try {
      const raw = await Bun.file(this.sessionFile).text();
      const session = JSON.parse(raw);
      const threadId: string | undefined = session.lastThreadId;
      if (!threadId || threadId === this.lastFocusedThread) return;

      this.lastFocusedThread = threadId;

      // If this thread is tracked and in a terminal state, the user just "saw" it
      const snapshot = this.threads.get(threadId);
      if (!snapshot || !snapshot.projectDir) return;
      if (snapshot.status !== "done" && snapshot.status !== "error" && snapshot.status !== "interrupted") return;

      const muxSession = this.ctx.resolveSession(snapshot.projectDir);
      if (!muxSession || muxSession === "unknown") return;

      // Emit "idle" to clear the unseen flag for this specific thread
      this.ctx.emit({
        agent: "amp",
        session: muxSession,
        status: "idle",
        ts: Date.now(),
        threadId,
        threadName: snapshot.title,
      });
    } catch {
      // session.json unreadable; ignore
    }
  }
}
