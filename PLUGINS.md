# PLUGINS.md — Creating & Publishing Plugins

opensessions uses a factory-based plugin system inspired by [pi-mono](https://github.com/badlogic/pi-mono). A plugin is a TypeScript file that exports a single default function.

## Plugin Contract

Every plugin exports one function:

```typescript
import type { PluginAPI } from "@opensessions/core";

export default function (api: PluginAPI) {
  // Register a mux provider, agent watcher, or do other setup
}
```

The `PluginAPI` gives you:

| Method / Property | Description |
|---|---|
| `api.registerMux(provider)` | Register a `MuxProvider` implementation |
| `api.registerWatcher(watcher)` | Register an `AgentWatcher` implementation |
| `api.serverPort` | The server port (default: `7391`) |
| `api.serverHost` | The server host (default: `127.0.0.1`) |

---

## How Plugins Are Discovered

opensessions loads plugins in order:

1. **Builtins** — `TmuxProvider` is always registered. Built-in agent watchers for Amp, Claude Code, and OpenCode are registered automatically.
2. **Local plugins** — `~/.config/opensessions/plugins/*.ts` (scanned one level deep)
3. **npm packages** — listed in `~/.config/opensessions/config.json` under `"plugins"`

### Local Plugin Directory

Drop a `.ts` or `.js` file into `~/.config/opensessions/plugins/`:

```
~/.config/opensessions/
├── config.json
└── plugins/
    ├── my-zellij.ts          ← loaded directly
    └── my-custom-mux/
        └── index.ts          ← loaded as entry point
```

### npm Packages

Add package names to your config:

```json
{
  "plugins": ["opensessions-mux-zellij", "opensessions-agent-aider"]
}
```

These are loaded via `require()` — install them first with `bun add -g <package>`.

---

## Config File

`~/.config/opensessions/config.json`

```json
{
  "mux": "tmux",
  "plugins": [],
  "port": 7391
}
```

| Field | Type | Description |
|---|---|---|
| `mux` | `string?` | Override auto-detect. Use a registered provider name. |
| `plugins` | `string[]` | npm package names to load |
| `port` | `number?` | Custom server port (default: `7391`) |

If `mux` is omitted, opensessions auto-detects from environment:
- `$TMUX` → tmux
- `$ZELLIJ_SESSION_NAME` → zellij (if a provider is registered)

---

## Creating a Mux Provider Plugin

### 1. Scaffold

```bash
mkdir opensessions-mux-zellij && cd opensessions-mux-zellij
bun init
bun add @opensessions/core
```

### 2. Implement

```typescript
// index.ts
import type { PluginAPI, MuxProvider, MuxSessionInfo } from "@opensessions/core";

class ZellijProvider implements MuxProvider {
  readonly name = "zellij";

  listSessions(): MuxSessionInfo[] {
    const result = Bun.spawnSync(["zellij", "list-sessions", "-s"], {
      stdout: "pipe", stderr: "pipe",
    });
    const raw = result.stdout.toString().trim();
    if (!raw) return [];
    return raw.split("\n").map((name) => ({
      name: name.trim(),
      createdAt: 0,
      dir: "",
      windows: 1,
    }));
  }

  switchSession(name: string): void {
    Bun.spawnSync(["zellij", "attach", name]);
  }

  getCurrentSession(): string | null {
    return process.env.ZELLIJ_SESSION_NAME ?? null;
  }

  getSessionDir(_name: string): string {
    return process.cwd();
  }

  getPaneCount(_name: string): number {
    return 1;
  }

  getClientTty(): string {
    return "";
  }

  setupHooks(serverHost: string, serverPort: number): void {
    // Set up zellij event hooks that POST to the server
  }

  cleanupHooks(): void {
    // Remove hooks
  }
}

export default function (api: PluginAPI) {
  api.registerMux(new ZellijProvider());
}
```

### 3. Configure `package.json`

```json
{
  "name": "opensessions-mux-zellij",
  "version": "1.0.0",
  "type": "module",
  "main": "index.ts",
  "opensessions": {
    "type": "mux-provider"
  },
  "peerDependencies": {
    "@opensessions/core": ">=0.1.0"
  }
}
```

### 4. Test locally

Drop it in your plugins directory:

```bash
# Symlink for development
ln -s $(pwd) ~/.config/opensessions/plugins/opensessions-mux-zellij
```

Or add to config:

```json
{
  "plugins": ["./path/to/opensessions-mux-zellij"]
}
```

### 5. Publish

```bash
npm publish
# Users install with:
bun add -g opensessions-mux-zellij
```

Then add to their config:

```json
{
  "mux": "zellij",
  "plugins": ["opensessions-mux-zellij"]
}
```

---

## Creating an Agent Watcher Plugin

Built-in watchers handle Amp, Claude Code, and OpenCode automatically. For other agents (e.g. Aider, Goose, custom agents), create a watcher plugin.

### AgentWatcher Interface

```typescript
interface AgentWatcher {
  /** Unique name for this watcher (e.g. "aider") */
  readonly name: string;

  /** Start watching. Called once by the server with the watcher context. */
  start(ctx: AgentWatcherContext): void;

  /** Stop watching and clean up resources. */
  stop(): void;
}
```

### AgentWatcherContext

The server provides a context object so watchers can resolve sessions and emit events without knowing about server internals:

```typescript
interface AgentWatcherContext {
  /** Resolve a project directory path to a mux session name, or null if unmatched */
  resolveSession(projectDir: string): string | null;

  /** Emit an agent event (applied to tracker + broadcast automatically) */
  emit(event: AgentEvent): void;
}
```

### Example: Aider Watcher

```typescript
// index.ts
import type { PluginAPI, AgentWatcher, AgentWatcherContext, AgentEvent } from "@opensessions/core";
import { watch } from "fs";

class AiderAgentWatcher implements AgentWatcher {
  readonly name = "aider";
  private watcher: ReturnType<typeof watch> | null = null;

  start(ctx: AgentWatcherContext): void {
    // Watch aider's log/state files for activity
    const logDir = `${process.env.HOME}/.aider/logs`;

    this.watcher = watch(logDir, { recursive: true }, (_eventType, filename) => {
      if (!filename) return;

      // Extract project directory from the log path
      const projectDir = this.extractProjectDir(filename);
      const session = ctx.resolveSession(projectDir);
      if (!session) return;

      ctx.emit({
        agent: "aider",
        session,
        status: "running",
        ts: Date.now(),
      });
    });
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  private extractProjectDir(filename: string): string {
    // Parse aider's log filename to determine project directory
    return filename.replace(/\.log$/, "");
  }
}

export default function (api: PluginAPI) {
  api.registerWatcher(new AiderAgentWatcher());
}
```

### Watcher Lifecycle

1. The plugin factory registers the watcher via `api.registerWatcher()`
2. The server calls `watcher.start(ctx)` after all plugins are loaded
3. The watcher uses `ctx.resolveSession(projectDir)` to map project directories to mux session names
4. The watcher uses `ctx.emit(event)` to report agent status changes
5. On shutdown, the server calls `watcher.stop()` for cleanup

---

## Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Mux provider | `opensessions-mux-<name>` | `opensessions-mux-zellij` |
| Agent watcher | `opensessions-agent-<name>` | `opensessions-agent-aider` |
| Theme | `opensessions-theme-<name>` | `opensessions-theme-nord` |

---

## Setup Guide

### tmux + opensessions

opensessions works with tmux out of the box — no plugin needed:

```bash
# Inside a tmux session:
cd opensessions && bun install
cd packages/tui && bun run start
```

The server auto-detects tmux from the `$TMUX` environment variable, registers session hooks via `tmux set-hook`, and starts broadcasting state over WebSocket.

### Connecting an AI Agent

**Amp, Claude Code, and OpenCode** work out of the box — built-in watchers detect their activity automatically. No plugins or configuration needed.

For **other agents** (Aider, Goose, custom agents, etc.), create an agent watcher plugin and register it via `api.registerWatcher()`. See [Creating an Agent Watcher Plugin](#creating-an-agent-watcher-plugin) above.

See [CONTRACTS.md](./CONTRACTS.md) for the `AgentEvent` schema and `AgentStatus` values.
