export const MIN_SIDEBAR_WIDTH = 20;
export const MAX_SIDEBAR_WIDTH_PERCENT = 0.4;
export const SAVE_DEBOUNCE_MS = 1000;

export function clampSidebarWidth(width: number, windowWidth?: number): number {
  const max = windowWidth ? Math.floor(windowWidth * MAX_SIDEBAR_WIDTH_PERCENT) : Infinity;
  return Math.min(max, Math.max(MIN_SIDEBAR_WIDTH, width));
}
