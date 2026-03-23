#!/usr/bin/env bash
# Toggle the opensessions sidebar for the current session.
# ON:  Restores hidden sidebar or creates new one + hooks for lazy spawning.
# OFF: Hides all sidebar panes (break-pane, TUI stays alive) + removes hooks.

PLUGIN_DIR="$(tmux show-environment -g OPENSESSIONS_DIR 2>/dev/null | cut -d= -f2)"
PLUGIN_DIR="${PLUGIN_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SCRIPTS_DIR="$PLUGIN_DIR/tmux-plugin/scripts"

SIDEBAR_TITLE="opensessions"
SIDEBAR_WIDTH="$(tmux show-environment -g OPENSESSIONS_WIDTH 2>/dev/null | cut -d= -f2)"
SIDEBAR_WIDTH="${SIDEBAR_WIDTH:-26}"

sidebar_active=$(tmux show-environment SIDEBAR_ACTIVE 2>/dev/null | grep -v '^-' | cut -d= -f2)

if [ "$sidebar_active" = "1" ]; then
    # --- Toggle OFF: hide all visible sidebars, unset flag, remove hooks ---
    tmux set-environment -u SIDEBAR_ACTIVE
    tmux list-panes -s -F '#{pane_id} #{pane_title}' 2>/dev/null \
        | awk -v t="$SIDEBAR_TITLE" '$2 == t {print $1}' \
        | while read -r pane_id; do
            tmux break-pane -d -s "$pane_id" -n "$SIDEBAR_TITLE" 2>/dev/null || true
        done
    tmux set-hook -u after-select-window 2>/dev/null || true
    tmux set-hook -u after-new-window 2>/dev/null || true
else
    # --- Toggle ON: set flag, restore or create sidebar, set hooks ---
    tmux set-environment SIDEBAR_ACTIVE 1

    LEFTMOST=$(tmux list-panes -F '#{pane_left} #{pane_id}' | sort -n | head -1 | awk '{print $2}')

    # Try to restore a hidden sidebar first
    HIDDEN_PANE=$(tmux list-windows -F '#{window_name} #{pane_id}' | awk -v t="$SIDEBAR_TITLE" '$1 == t {print $2; exit}')

    if [ -n "$HIDDEN_PANE" ]; then
        tmux join-pane -hb -l "$SIDEBAR_WIDTH" -s "$HIDDEN_PANE" -t "$LEFTMOST"
        tmux select-pane -t "$HIDDEN_PANE"
    else
        CURRENT_WINDOW=$(tmux display-message -p '#{window_id}')
        tmux split-window -hb -l "$SIDEBAR_WIDTH" -t "$LEFTMOST" \
            "printf '\\033]2;${SIDEBAR_TITLE}\\033\\\\'; REFOCUS_WINDOW='${CURRENT_WINDOW}' exec ${SCRIPTS_DIR}/start.sh"
    fi

    tmux set-hook after-select-window "run-shell '${SCRIPTS_DIR}/ensure-sidebar.sh'"
    tmux set-hook after-new-window "run-shell '${SCRIPTS_DIR}/ensure-sidebar.sh'"
fi
