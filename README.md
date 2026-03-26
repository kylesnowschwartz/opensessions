# opensessions

**bring your own multiplexer**

Terminal session manager with live agent status, git branches, unseen notifications, and instant switching.

Runs inside your terminal. Works with your existing shortcuts. No new app to learn.

> 🚧 **Alpha** — the core contracts and TUI are functional. Star to follow progress.

## What it does

- **Agent status** — see which AI agents are running, done, or need input across sessions
- **Git branches** — current branch for every session at a glance
- **Unseen badges** — know when an agent finishes in another session without checking
- **Instant switching** — jump to any session by index, no fuzzy finder needed
- **Zero config** — works out of the box with tmux + any terminal
- **Agent-agnostic** — built-in watchers for Amp, Claude Code, and OpenCode; plugin system for others
- **Mux-agnostic** — tmux today, zellij and others via the `MuxProvider` interface

## Quick Start

```bash
# Clone and install
git clone https://github.com/Ataraxy-Labs/opensessions.git
cd opensessions
bun install

# Run tests
bun run test

# Start the TUI (requires tmux)
cd packages/tui && bun run start
```

## Packages

| Package | Description |
|---------|-------------|
| [`@opensessions/core`](./packages/core) | Server, contracts, agent watchers, agent tracker |
| [`@opensessions/tui`](./packages/tui) | OpenTUI terminal sidebar (Solid) |
| [`@opensessions/mux`](./packages/mux) | MuxProvider interface and detection |
| [`@opensessions/mux-tmux`](./packages/mux-tmux) | tmux MuxProvider implementation |
| [`@opensessions/mux-zellij`](./packages/mux-zellij) | Zellij MuxProvider implementation |
| [`@opensessions/tmux-sdk`](./packages/tmux-sdk) | Low-level tmux command bindings |

## Architecture

```
┌─────────────────┐                      ┌─────────────────┐
│  Agent Data     │     file watchers    │   Server        │
│                 │ ──────────────────→  │  (WebSocket)    │
│  ~/.amp/threads │   AgentWatchers      │                 │
│  ~/.claude/     │                      │  AgentTracker   │
│  ~/.opencode/   │                      │  GitCache       │
└─────────────────┘                      │                 │
                                         │                 │
┌─────────────────┐     WebSocket        │                 │
│  TUI Client     │ ←──────────────────  │                 │
│  (OpenTUI)      │                      └─────────────────┘
└─────────────────┘           ↕
                         ┌─────────────────┐
                         │  Mux Provider   │
                         │  (tmux/zellij)  │
                         └─────────────────┘
```

## Agent Integration

Built-in watchers automatically detect **Amp**, **Claude Code**, and **OpenCode** — zero config. Just start the TUI and agent activity is tracked by watching their data files (Amp threads, Claude JSONL, OpenCode SQLite).

For other agents, implement the `AgentWatcher` interface. See [CONTRACTS.md](./CONTRACTS.md) for details.

## Plugins & Extending

opensessions has a factory-based plugin system. Drop a `.ts` file in `~/.config/opensessions/plugins/` or publish to npm as `opensessions-mux-*`:

```typescript
// ~/.config/opensessions/plugins/my-mux.ts
import type { PluginAPI } from "@opensessions/core";

export default function (api: PluginAPI) {
  api.registerMux({ name: "my-mux", /* ... implement MuxProvider */ });
}
```

npm plugins go in `~/.config/opensessions/config.json`:

```json
{
  "plugins": ["opensessions-mux-zellij"],
  "mux": "zellij"
}
```

Full walkthrough: scaffold → test → publish in [PLUGINS.md](./PLUGINS.md).

## Built with

[Solid-js TUI](https://github.com/anomalyco/opentui) · [Bun](https://bun.sh) · WebSockets · [Catppuccin](https://catppuccin.com)

## License

MIT · [Ataraxy Labs](https://github.com/Ataraxy-Labs)
