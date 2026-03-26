# CONTRACTS.md — Agent Integration Guide

opensessions detects agent status automatically using built-in **AgentWatcher** providers that watch each agent's data files directly. No configuration or hooks are needed for supported agents.

## Built-in Agent Watchers

opensessions ships with watchers for three agents. Each watcher monitors the agent's native data files, detects status changes, and maps them to mux sessions via the project directory.

### Amp (`AmpAgentWatcher`)

- **Watches:** `~/.local/share/amp/threads/T-*.json` for thread state changes
- **Also watches:** `~/.local/share/amp/session.json` for thread-level "seen" state (clears `unseen` when the user focuses a terminal thread)
- **Detection:** Uses `fs.watch` + polling (2s). Skips threads not modified in the last 5 minutes.
- **Status mapping:** Derived from the last message's `role` and `state` (streaming → `running`, cancelled → `interrupted`, end_turn → `done`, tool_use → `running`)
- **Session resolution:** Reads `env.initial.trees[0].uri` from the thread file to get the project directory

### Claude Code (`ClaudeCodeAgentWatcher`)

- **Watches:** `~/.claude/projects/<encoded-path>/*.jsonl` for JSONL journal changes
- **Encoded path format:** `/Users/foo/myproject` → `-Users-foo-myproject`
- **Detection:** Uses `fs.watch` on each project directory + polling (2s). Reads only new bytes appended since last check.
- **Status mapping:** Derived from the last journal entry's `message.role` and content (assistant with `tool_use` → `running`, assistant without → `waiting`, user → `running`)
- **Session resolution:** Decoded from the directory name

### OpenCode (`OpenCodeAgentWatcher`)

- **Watches:** `~/.local/share/opencode/opencode.db` SQLite database (or `$OPENCODE_DB_PATH`)
- **Detection:** Polls every 3s using `bun:sqlite` in read-only mode. Queries `session` and `message` tables.
- **Status mapping:** Derived from the last message's `role` and `finish` field (assistant with `tool-calls` → `running`, assistant without → `waiting`, user → `running`)
- **Session resolution:** Reads `directory` field from the session row

---

## Agent Event Contract

All watchers emit `AgentEvent` objects through the `AgentWatcherContext`:

```typescript
interface AgentEvent {
  agent: string;
  session: string;
  status: AgentStatus;
  ts: number;
  threadId?: string;
  threadName?: string;
  unseen?: boolean;
}

type AgentStatus = "idle" | "running" | "done" | "error" | "waiting" | "interrupted";
```

**Fields:**

| Field        | Type    | Required | Description                              |
|--------------|---------|----------|------------------------------------------|
| `agent`      | string  | yes      | Agent identifier (e.g. `"amp"`, `"claude-code"`, `"opencode"`) |
| `session`    | string  | yes      | Terminal multiplexer session name         |
| `status`     | string  | yes      | One of: `running`, `idle`, `done`, `error`, `waiting`, `interrupted` |
| `ts`         | number  | yes      | Unix timestamp in milliseconds           |
| `threadId`   | string  | no       | Agent-specific thread/session identifier  |
| `threadName` | string  | no       | Human-readable thread name or first prompt |
| `unseen`     | boolean | no       | Set by tracker when serializing for the TUI — `true` if user hasn't seen this terminal state |

**Status meanings:**

| Status        | Meaning                                |
|---------------|----------------------------------------|
| `running`     | Agent is actively working              |
| `idle`        | Agent is ready, not processing         |
| `done`        | Agent completed successfully           |
| `error`       | Agent encountered an error             |
| `waiting`     | Agent is waiting for user input        |
| `interrupted` | Agent was manually interrupted         |

---

## AgentWatcher Interface

To add support for a new agent, implement the `AgentWatcher` interface and register it via `PluginAPI.registerWatcher()`:

```typescript
import type { AgentWatcher, AgentWatcherContext } from "@opensessions/core";

export class MyAgentWatcher implements AgentWatcher {
  readonly name = "my-agent";

  start(ctx: AgentWatcherContext): void {
    // Start watching data files, polling databases, etc.
    // Use ctx.resolveSession(projectDir) to map a project directory to a mux session name.
    // Use ctx.emit(event) to emit AgentEvent objects when status changes.
  }

  stop(): void {
    // Clean up watchers, timers, and other resources.
  }
}
```

**`AgentWatcherContext`** provided to `start()`:

```typescript
interface AgentWatcherContext {
  /** Resolve a project directory path to a mux session name, or null if unmatched */
  resolveSession(projectDir: string): string | null;
  /** Emit an agent event (applied to tracker + broadcast automatically) */
  emit(event: AgentEvent): void;
}
```

**Registration:**

```typescript
import { PluginAPI } from "@opensessions/core";

// In a plugin:
pluginAPI.registerWatcher(new MyAgentWatcher());
```

The built-in watchers (Amp, Claude Code, OpenCode) are registered automatically in `start.ts`. Custom watchers should be registered via the plugin API.

---

## MuxProvider Interface

To add support for a new terminal multiplexer, implement the `MuxProvider` interface from `@opensessions/core`:

```typescript
import type { MuxProvider, MuxSessionInfo } from "@opensessions/core";

export class ZellijProvider implements MuxProvider {
  readonly name = "zellij";

  listSessions(): MuxSessionInfo[] {
    // Return array of { name, createdAt, dir, windows }
  }

  switchSession(name: string, clientTty?: string): void {
    // Switch to the named session
  }

  getCurrentSession(): string | null {
    // Return the currently focused session name
  }

  getSessionDir(name: string): string {
    // Return the working directory of the session
  }

  getPaneCount(name: string): number {
    // Return number of panes in the session
  }

  getClientTty(): string {
    // Return the client's TTY path
  }

  setupHooks(serverHost: string, serverPort: number): void {
    // Set up hooks that POST to the server on session changes
  }

  cleanupHooks(): void {
    // Remove hooks set up by setupHooks
  }
}
```

Then pass it to the server at startup, or contribute it to the `@opensessions/core` package.
