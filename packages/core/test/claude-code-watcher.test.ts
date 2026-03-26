import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, appendFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { ClaudeCodeAgentWatcher, determineStatus } from "../src/agents/watchers/claude-code";
import type { AgentEvent } from "../src/contracts/agent";
import type { AgentWatcherContext } from "../src/contracts/agent-watcher";

// --- determineStatus ---

describe("Claude Code determineStatus", () => {
  test("returns idle for entry with no message", () => {
    expect(determineStatus({})).toBe("idle");
  });

  test("returns running for assistant with tool_use", () => {
    expect(determineStatus({
      message: { role: "assistant", content: [{ type: "tool_use" }] },
    })).toBe("running");
  });

  test("returns waiting for assistant with text only", () => {
    expect(determineStatus({
      message: { role: "assistant", content: [{ type: "text", text: "hello" }] },
    })).toBe("waiting");
  });

  test("returns running for user message", () => {
    expect(determineStatus({
      message: { role: "user", content: "hello" },
    })).toBe("running");
  });

  test("returns waiting for assistant with string content", () => {
    expect(determineStatus({
      message: { role: "assistant", content: "thinking..." },
    })).toBe("waiting");
  });
});

// --- ClaudeCodeAgentWatcher integration ---

describe("ClaudeCodeAgentWatcher", () => {
  let tmpDir: string;
  let watcher: ClaudeCodeAgentWatcher;
  let events: AgentEvent[];
  let ctx: AgentWatcherContext;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `claude-watcher-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    events = [];
    ctx = {
      resolveSession: (dir) => dir === "/projects/myapp" ? "myapp-session" : null,
      emit: (event) => events.push(event),
    };
    watcher = new ClaudeCodeAgentWatcher();
    (watcher as any).projectsDir = tmpDir;
  });

  afterEach(() => {
    watcher.stop();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("emits event on file change after seed scan", async () => {
    const projDir = join(tmpDir, "-projects-myapp");
    mkdirSync(projDir, { recursive: true });

    // Create file before watcher starts — seed scan records size
    const filePath = join(projDir, "session-001.jsonl");
    writeFileSync(filePath, JSON.stringify({ message: { role: "user", content: "initial" } }) + "\n");

    watcher.start(ctx);
    // Wait for seed scan
    await new Promise((r) => setTimeout(r, 200));
    expect(events.length).toBe(0); // Seed scan doesn't emit

    // Now append — this triggers a real event
    appendFileSync(filePath, JSON.stringify({ message: { role: "user", content: "fix the bug" } }) + "\n");
    await new Promise((r) => setTimeout(r, 2500));

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]!.agent).toBe("claude-code");
    expect(events[0]!.session).toBe("myapp-session");
    expect(events[0]!.status).toBe("running");
  });

  test("skips when session cannot be resolved", async () => {
    const projDir = join(tmpDir, "-unknown-project");
    mkdirSync(projDir, { recursive: true });

    writeFileSync(join(projDir, "session-002.jsonl"), "");

    watcher.start(ctx);
    await new Promise((r) => setTimeout(r, 200));

    appendFileSync(join(projDir, "session-002.jsonl"),
      JSON.stringify({ message: { role: "user", content: "hello" } }) + "\n");
    await new Promise((r) => setTimeout(r, 2500));

    expect(events.length).toBe(0);
  });

  test("detects status transition after seed", async () => {
    const projDir = join(tmpDir, "-projects-myapp");
    mkdirSync(projDir, { recursive: true });

    const filePath = join(projDir, "session-003.jsonl");
    // Seed with a user message
    writeFileSync(filePath, JSON.stringify({ message: { role: "user", content: "start" } }) + "\n");

    watcher.start(ctx);
    await new Promise((r) => setTimeout(r, 200));
    expect(events.length).toBe(0); // Seed

    // Append assistant → triggers waiting
    appendFileSync(filePath, JSON.stringify({
      message: { role: "assistant", content: [{ type: "text", text: "done" }] },
    }) + "\n");
    await new Promise((r) => setTimeout(r, 2500));

    const lastEvent = events[events.length - 1]!;
    expect(lastEvent.status).toBe("waiting");
  });
});
