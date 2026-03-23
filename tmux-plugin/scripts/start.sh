#!/usr/bin/env bash
# Start the opensessions TUI, then refocus the main pane.
# The TUI needs focus briefly for terminal capability queries,
# then we hand focus back to the main pane.

SIDEBAR_TITLE="opensessions"
PLUGIN_DIR="$(tmux show-environment -g OPENSESSIONS_DIR 2>/dev/null | cut -d= -f2)"
PLUGIN_DIR="${PLUGIN_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
TUI_DIR="$PLUGIN_DIR/packages/tui"
WINDOW="${REFOCUS_WINDOW}"

# Schedule refocus after TUI initializes
(
    sleep 0.3
    MAIN_PANE=$(tmux list-panes -t "$WINDOW" -F '#{pane_id} #{pane_title}' 2>/dev/null | grep -v "$SIDEBAR_TITLE" | head -1 | cut -d' ' -f1)
    if [ -n "$MAIN_PANE" ]; then
        tmux select-pane -t "$MAIN_PANE" 2>/dev/null || true
    fi
) &

# Find bun
BUN_PATH="${BUN_PATH:-$(command -v bun 2>/dev/null || echo "/Users/palanikannanm/.bun/bin/bun")}"

# Run from source — bunfig.toml preload handles the Solid JSX transform,
# and native modules resolve correctly from node_modules
cd "$TUI_DIR"
exec "$BUN_PATH" run src/index.tsx 2>/tmp/opensessions-err.log
