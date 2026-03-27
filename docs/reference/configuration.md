# Configuration Reference

This page documents the configuration inputs that opensessions reads today.

## Config File Location

User config is loaded from:

```text
~/.config/opensessions/config.json
```

If the file does not exist, opensessions falls back to defaults.

## Recommended Config Shape

```json
{
  "mux": "tmux",
  "plugins": [],
  "theme": "tokyo-night",
  "sidebarWidth": 30,
  "sidebarPosition": "right"
}
```

## Config Fields

| Field | Type | Default | Runtime status | Description |
| --- | --- | --- | --- | --- |
| `mux` | `string` | auto-detect | active | Selects the preferred registered mux provider by name |
| `plugins` | `string[]` | `[]` | active | Package names to load through the plugin loader |
| `theme` | `string` | `catppuccin-mocha` | active | Built-in theme name persisted by the TUI |
| `sidebarWidth` | `number` | `26` | active | Sidebar width in columns |
| `sidebarPosition` | `"left" | "right"` | `"left"` | active | Sidebar placement |
| `port` | `number` | none | parsed only | Present in the config type, but the current server and TUI still use the fixed `7391` constant |
| `keybinding` | `string` | none | parsed only | Present in the config type, but tmux and zellij keybindings are configured outside this file today |

## Built-In Themes

These theme names resolve in the running app today:

- `catppuccin-mocha`
- `catppuccin-latte`
- `catppuccin-frappe`
- `catppuccin-macchiato`
- `tokyo-night`
- `gruvbox-dark`
- `nord`
- `dracula`
- `github-dark`
- `one-dark`
- `kanagawa`
- `everforest`
- `material`
- `cobalt2`
- `flexoki`
- `ayu`
- `aura`
- `matrix`

## Inline Theme Objects

The core config type and theme resolver also support partial inline theme objects such as:

```json
{
  "theme": {
    "palette": {
      "base": "#000000",
      "text": "#ffffff"
    }
  }
}
```

That shape is valid for the core APIs, but the current server startup path only applies string theme names end-to-end.

## tmux Plugin Options

The tmux integration reads these tmux options instead of `config.json`:

| tmux option | Default | Used by |
| --- | --- | --- |
| `@opensessions-key` | `s` | tmux keybinding in `opensessions.tmux` |
| `@opensessions-width` | `26` | exported as `OPENSESSIONS_WIDTH` by the tmux bootstrap script |

Example:

```tmux
set -g @opensessions-key "s"
set -g @opensessions-width "30"
source-file /absolute/path/to/opensessions/opensessions.tmux
```

## Environment Variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `OPENCODE_DB_PATH` | OpenCode watcher | Overrides the default SQLite path |
| `OPENSESSIONS_DIR` | tmux/zellij scripts and server | Helps helper scripts find the repo checkout |
| `OPENSESSIONS_HOST` | helper shell scripts | Script-level override only; the app runtime still uses `127.0.0.1` |
| `OPENSESSIONS_PORT` | helper shell scripts | Script-level override only; the app runtime still uses `7391` |
| `SESSIONIZER_DIR` | tmux sessionizer popup | Root directory searched for new-session candidates |
| `BUN_PATH` | tmux/zellij scripts | Explicit Bun binary path for helper scripts |

## Related Files Written By The Runtime

| Path | Purpose |
| --- | --- |
| `~/.config/opensessions/session-order.json` | Persisted custom session ordering |
| `/tmp/opensessions.pid` | PID file used by server bootstrap logic |
| `/tmp/opensessions-debug.log` | Best-effort debug log written by the server and providers |

## Mux Detection Rules

If `mux` is unset, the registry resolves providers in this order:

1. `$TMUX` -> provider named `tmux`
2. `$ZELLIJ_SESSION_NAME` -> provider named `zellij`
3. no match -> `null`
