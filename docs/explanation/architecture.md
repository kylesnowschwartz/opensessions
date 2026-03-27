# How opensessions Works

opensessions is a local coordination layer between your multiplexer, your agent tools, and a terminal sidebar UI.

It is easiest to think about it as four pieces:

1. mux providers that know how to inspect and control tmux or zellij
2. agent watchers that translate external agent data into `AgentEvent`s
3. a Bun server that merges state and broadcasts it
4. an OpenTUI client that renders the sidebar and sends user commands back

## Startup Flow

When the TUI starts, it first calls `ensureServer()` from `@opensessions/core`.

If no healthy server is listening on `127.0.0.1:7391`, `ensureServer()` launches `packages/core/src/server/start.ts` in the background. The server then:

1. loads config from `~/.config/opensessions/config.json`
2. registers the built-in tmux and zellij providers
3. loads local plugins and configured package plugins
4. resolves the primary mux provider
5. registers the built-in Amp, Claude Code, and OpenCode watchers
6. starts the WebSocket and HTTP control server

## State Assembly

The server computes a single `ServerState` payload for every connected sidebar client.

That state is assembled from several sources:

- session lists from every registered mux provider
- custom session order stored on disk
- Git branch and dirty information from each session directory
- pane counts and window counts from providers
- detected listening ports from descendant processes in tmux sessions
- tracked agent instances and unseen state from `AgentTracker`

The result is one merged view even when multiple mux providers are active.

## Agent Tracking Model

Watchers do not know about the TUI. They only know how to emit `AgentEvent`s through the watcher context.

The `AgentTracker` is where those raw events become UI-friendly state:

- it keeps instances separate with `threadId` when available
- it derives the most important session-level state from all instances
- it tracks unseen status per instance for terminal states
- it prunes stale or no-longer-relevant state over time

This separation is why the built-in watchers can be simple and agent-specific while the unseen logic stays consistent across agents.

## Why The Mux Interface Is Capability-Based

The provider model is split into required core operations and optional capabilities instead of one large interface.

That matters because tmux and zellij do not expose the same control surface:

- both can list and switch sessions
- both can create and kill sessions
- both can manage sidebars, but in different ways
- tmux has hook support and more direct client targeting
- zellij relies more on CLI actions and polling

The capability model lets the server ask for only what a feature needs. For example, sidebar spawning requires both window awareness and sidebar management, so the server narrows providers with `isFullSidebarCapable()`.

## tmux Design

The tmux provider is the more feature-complete reference implementation.

Notable design choices:

- tmux global hooks notify the server about focus changes, session creation, window changes, and resize events
- hidden sidebars are moved into a dedicated stash session named `_os_stash` instead of being destroyed
- the TUI refocuses the main pane after capability detection to avoid escape-sequence leakage into the main pane
- a small typed tmux SDK exists under `packages/tmux-sdk` for lower-level command work

## zellij Design

The zellij provider fits the same contract but with different tradeoffs.

Notable design choices:

- zellij sessions and tabs are mapped onto the provider contract's session and window concepts
- tab and pane data comes from zellij JSON actions
- there is no hook API equivalent to tmux's `set-hook`, so some behavior relies on polling and explicit toggle or switch flows
- sidebar panes are managed as normal zellij panes rather than stashed and restored the way tmux does it

## Why The Server Owns Session Switching

The TUI does not switch sessions directly. It always sends a command to the server.

That centralization matters for three reasons:

1. the server knows which provider owns each session
2. the server can use authoritative client TTY information gathered from hooks or identify messages
3. cross-mux switching logic belongs in one place rather than being duplicated in every client

## Files The Runtime Writes

The runtime keeps a small set of operational files:

- `/tmp/opensessions.pid` for server bootstrap health checks
- `/tmp/opensessions-debug.log` for best-effort debug logging
- `~/.config/opensessions/session-order.json` for user-controlled session ordering
- `~/.config/opensessions/config.json` for user configuration

## Current Constraints

Some pieces are intentionally still narrow in scope:

- the server and TUI are effectively pinned to `127.0.0.1:7391`
- parsed config fields `port` and `keybinding` are not yet wired through the runtime
- inline theme objects exist in the core API surface, but the running server currently uses theme names
- zellij integration is functional but less event-driven than tmux because of the missing hook layer

## Why The Codebase Is Split This Way

The package split is mostly about keeping the core extension contracts reusable:

- `@opensessions/core` defines the runtime model
- `@opensessions/mux` defines mux contracts without forcing a concrete implementation
- `@opensessions/mux-tmux` and `@opensessions/mux-zellij` provide concrete providers
- `@opensessions/tui` stays focused on rendering and input

That makes it possible to extend opensessions without forking the server or TUI.
