# Get Started In tmux

This tutorial gets opensessions running as a real tmux sidebar from a local clone. By the end, you will be able to press `prefix s` to open the sidebar, switch sessions from it, and see agent and Git state update live.

## Prerequisites

- Bun installed and available on `PATH`
- tmux installed
- A local checkout of this repository

## 1. Install workspace dependencies

From the repository root:

```bash
bun install
```

Result: the workspace packages are installed and the TUI can run.

## 2. Add opensessions to your tmux config

Open `~/.tmux.conf` and add these lines, replacing the path with your clone location:

```tmux
set -g @opensessions-key "s"
set -g @opensessions-width "26"
source-file /absolute/path/to/opensessions/opensessions.tmux
```

Result: tmux knows which key should toggle the sidebar and where to load the opensessions script from.

## 3. Reload tmux configuration

Run:

```bash
tmux source-file ~/.tmux.conf
```

Result: the new keybinding is active in your current tmux server.

## 4. Open the sidebar

Inside tmux, press:

```text
prefix s
```

Result: tmux asks the opensessions server to toggle the sidebar. If the server is not running yet, the helper script starts it first.

## 5. Verify the sidebar is live

Use the sidebar to:

1. Move selection with `j` and `k` or the arrow keys.
2. Press `Enter` to switch sessions.
3. Press `n` or `c` to create a new tmux session.
4. Press `t` to open the theme picker.

Result: you should see the session list update and tmux switch the attached client to the selected session.

## 6. Verify agent detection

In any tmux session whose working directory matches a repo you use with a supported agent, start one of these tools:

- Amp
- Claude Code
- OpenCode

Result: the session row should show a live status marker, and the detail panel should show thread-level information when available.

## Expected Outcome

You now have opensessions wired into tmux as a toggleable sidebar. From here you can move on to:

- [Configuration reference](../reference/configuration.md)
- [Features and keybindings reference](../reference/features-and-keybindings.md)
- [How to use opensessions with zellij](../how-to/use-opensessions-with-zellij.md)
