import type { SessionData } from "../shared";
import { TERMINAL_STATUSES } from "../contracts/agent";

export const ABSOLUTE_MIN_SIDEBAR_WIDTH = 15;
export const MAX_SIDEBAR_WIDTH_PERCENT = 0.4;
export const SAVE_DEBOUNCE_MS = 1000;

// Layout constants matching the TUI's SessionCard rendering.
const INDEX_COLS = 3;
const PADDING_RIGHT = 1;
const STATUS_ICON_COLS = 2; // " ⠋" or " ●"
const FOCUSED_BORDER_COLS = 2; // <box border> on focused card eats 1 col per side
const NAME_TRUNC_LIMIT = 18;
const BRANCH_TRUNC_LIMIT = 15;

/**
 * Compute the narrowest sidebar width that still fits session content
 * without clipping. Mirrors the TUI's SessionCard layout math.
 *
 * Row 1 (name):   index(3) + name + badge + spacer + statusIcon(2) + pad(1)
 * Row 2 (branch): index(3) + branch + portHint + pad(1)
 *
 * The focused card is wrapped in a border box (+2 cols), so the pane must
 * be wide enough for: max(contentWidth) + 2.
 */
export function computeMinSidebarWidth(sessions: SessionData[]): number {
  let widest = 0;

  for (const s of sessions) {
    const nameLen = Math.min(s.name.length, NAME_TRUNC_LIMIT);
    const badge = agentBadgeWidth(s);
    const nameRow = INDEX_COLS + nameLen + badge + STATUS_ICON_COLS + PADDING_RIGHT;

    // Row 2 renders when branch OR ports are present
    const portHintLen = portHintWidth(s.ports ?? []);
    const branchLen = s.branch ? Math.min(s.branch.length, BRANCH_TRUNC_LIMIT) : 0;
    let branchRow = 0;
    if (branchLen || portHintLen) {
      const spacer = branchLen && portHintLen ? 1 : 0;
      branchRow = INDEX_COLS + branchLen + spacer + portHintLen + PADDING_RIGHT;
    }

    widest = Math.max(widest, nameRow, branchRow);
  }

  // The focused card sits inside a bordered box — account for border columns.
  return Math.max(ABSOLUTE_MIN_SIDEBAR_WIDTH, widest + FOCUSED_BORDER_COLS);
}

/** Mirrors the TUI's agentCount/agentBadge logic: " ●" for 1, " ●N" for N>1. */
function agentBadgeWidth(s: SessionData): number {
  const count = (s.agents ?? []).filter(
    (a) =>
      a.liveness === "alive" ||
      (a.liveness !== "exited" && !TERMINAL_STATUSES.has(a.status)),
  ).length;
  if (count === 0) return 0;
  // " ●" = 2, " ●2" = 3, " ●10" = 4, etc.
  return count === 1 ? 2 : 1 + 1 + String(count).length;
}

function portHintWidth(ports: number[]): number {
  if (ports.length === 0) return 0;
  // "⌁3000" or "⌁3000+2"
  const first = `⌁${ports[0]}`;
  if (ports.length === 1) return first.length;
  return `${first}+${ports.length - 1}`.length;
}

export function clampSidebarWidth(width: number, windowWidth?: number): number {
  const max = windowWidth ? Math.floor(windowWidth * MAX_SIDEBAR_WIDTH_PERCENT) : Infinity;
  return Math.min(max, Math.max(ABSOLUTE_MIN_SIDEBAR_WIDTH, width));
}
