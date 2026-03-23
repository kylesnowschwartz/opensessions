#!/usr/bin/env bash
# Ensure the current window has a sidebar pane. If not, spawn one.
# Called lazily by tmux hooks (after-select-window, after-new-window).

SIDEBAR_TITLE="opensessions"
PLUGIN_DIR="$(tmux show-environment -g OPENSESSIONS_DIR 2>/dev/null | cut -d= -f2)"
PLUGIN_DIR="${PLUGIN_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SCRIPTS_DIR="$PLUGIN_DIR/tmux-plugin/scripts"
SIDEBAR_WIDTH="$(tmux show-environment -g OPENSESSIONS_WIDTH 2>/dev/null | cut -d= -f2)"
SIDEBAR_WIDTH="${SIDEBAR_WIDTH:-26}"

# Only spawn if sidebar is toggled ON for this session
sidebar_active=$(tmux show-environment SIDEBAR_ACTIVE 2>/dev/null | grep -v '^-' | cut -d= -f2)
if [ "$sidebar_active" != "1" ]; then
    exit 0
fi

# Already has a sidebar? Do nothing.
current_has=$(tmux list-panes -F '#{pane_title}' 2>/dev/null | grep -c "^${SIDEBAR_TITLE}$" || echo 0)
if [ "$current_has" -gt 0 ]; then
    exit 0
fi

# Spawn sidebar in the current window
LEFTMOST=$(tmux list-panes -F '#{pane_left} #{pane_id}' | sort -n | head -1 | awk '{print $2}')
CURRENT_WINDOW=$(tmux display-message -p '#{window_id}')

tmux split-window -hb -l "$SIDEBAR_WIDTH" -t "$LEFTMOST" \
    "printf '\\033]2;${SIDEBAR_TITLE}\\033\\\\'; REFOCUS_WINDOW='${CURRENT_WINDOW}' exec ${SCRIPTS_DIR}/start.sh" 2>/dev/null || exit 0
