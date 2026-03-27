# How To Use opensessions With zellij

This guide shows how to wire the existing opensessions scripts into zellij so you can toggle the sidebar from a keybinding.

It assumes you already cloned the repository and ran `bun install`.

## 1. Pick the repository path

Note the absolute path to your local clone, for example:

```text
/Users/alice/src/opensessions
```

You will use that path in the zellij config snippet below.

## 2. Add a zellij keybinding

Open `~/.config/zellij/config.kdl` and add a binding that runs the shipped toggle script:

```kdl
bind "s" {
  Run "bash" "/absolute/path/to/opensessions/tmux-plugin/scripts/zellij-toggle.sh" {
    close_on_exit true
  };
  SwitchToMode "Normal";
}
```

If you prefer a different key, change `"s"` to whatever fits your setup.

## 3. Reload zellij or start a new session

Restart zellij or reload your config so the new binding takes effect.

## 4. Toggle the sidebar

Inside zellij, press the key you bound in the previous step.

The toggle script will:

1. Ensure the opensessions server is running.
2. Discover the current zellij session and active tab.
3. Send a toggle request to the local server.

## 5. Verify the sidebar behavior

When the sidebar opens, test these flows:

1. Move through the list with `j` and `k`.
2. Press `Enter` to switch zellij sessions.
3. Press `t` to change themes.
4. Start Amp, Claude Code, or OpenCode in a matching project and watch status update.

## Notes

- zellij does not expose tmux-style hooks, so opensessions uses explicit toggle calls, provider queries, and periodic polling instead.
- The zellij provider can still participate in the shared server state alongside the tmux provider.
- Cross-mux switching is supported when both providers are registered.

## Expected Result

You can now open opensessions from zellij and use the same sidebar UI, agent tracking, and session-switching flows that tmux users get.
