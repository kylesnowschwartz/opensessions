#!/usr/bin/env bash
# Switch to the Nth session (sorted by creation time, 1-indexed).
# Pure tmux — no WebSocket, no bun. Instant.

INDEX="${1:?Usage: switch-index.sh <index>}"

TARGET=$(tmux list-sessions -F '#{session_created} #{session_name}' | sort -n | awk "NR==$INDEX {print \$2}")

[ -n "$TARGET" ] && tmux switch-client -t "$TARGET"
