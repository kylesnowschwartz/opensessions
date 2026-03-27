#!/usr/bin/env bash
# Start the opensessions TUI.
# Works in both tmux and zellij — detects the mux from environment.

if [ -n "${TMUX:-}" ]; then
    OPENSESSIONS_DIR="$(tmux show-environment -g OPENSESSIONS_DIR 2>/dev/null | cut -d= -f2)"
fi
OPENSESSIONS_DIR="${OPENSESSIONS_DIR:-$(cd "$(dirname "$0")/../../.." && pwd)}"
TUI_DIR="$OPENSESSIONS_DIR/apps/tui"

BUN_PATH="${BUN_PATH:-$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")}"

cd "$TUI_DIR"
export REFOCUS_WINDOW
export OPENSESSIONS_DIR
exec "$BUN_PATH" run src/index.tsx 2>/tmp/opensessions-err.log
