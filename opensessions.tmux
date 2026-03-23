#!/usr/bin/env bash
# opensessions.tmux — TPM entry point (must be at repo root for TPM to find it)
#
# Install:
#   1. Requires: bun (https://bun.sh)
#   2. Add to .tmux.conf:  set -g @plugin 'palanikannan1437/opensessions'
#   3. Press prefix + I to install
#
# Options (set in .tmux.conf before TPM init):
#   @opensessions-key       "s"    — prefix + key to toggle sidebar
#   @opensessions-width     "26"   — sidebar width in columns

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$CURRENT_DIR/tmux-plugin/scripts"

# --- Helpers ---

get_option() {
  local option="$1"
  local default="$2"
  local value
  value=$(tmux show-option -gqv "$option" 2>/dev/null)
  echo "${value:-$default}"
}

KEY=$(get_option "@opensessions-key" "s")
WIDTH=$(get_option "@opensessions-width" "26")

# Export so scripts can read them
tmux set-environment -g OPENSESSIONS_DIR "$CURRENT_DIR"
tmux set-environment -g OPENSESSIONS_WIDTH "$WIDTH"

# --- Bootstrap: install deps on first run ---

BUN_PATH="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"

if [ ! -d "$CURRENT_DIR/node_modules" ]; then
  if [ -x "$BUN_PATH" ]; then
    tmux display-message "opensessions: installing dependencies..."
    (cd "$CURRENT_DIR" && "$BUN_PATH" install --frozen-lockfile 2>/tmp/opensessions-install.log && \
     tmux display-message "opensessions: ready!") &
  else
    tmux display-message "opensessions: bun not found — install from https://bun.sh"
  fi
fi

# --- Bind prefix + KEY to toggle ---

tmux bind-key "$KEY" run-shell "$SCRIPTS_DIR/toggle.sh"
