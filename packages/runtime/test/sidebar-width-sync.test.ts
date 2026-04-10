import { describe, expect, test } from "bun:test";
import {
  clampSidebarWidth,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH_PERCENT,
} from "../src/server/sidebar-width-sync";

describe("sidebar width sync", () => {
  test("clampSidebarWidth enforces minimum", () => {
    expect(clampSidebarWidth(10)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(5)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(0)).toBe(MIN_SIDEBAR_WIDTH);
  });

  test("clampSidebarWidth passes through values above minimum", () => {
    expect(clampSidebarWidth(50)).toBe(50);
    expect(clampSidebarWidth(MIN_SIDEBAR_WIDTH)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(100)).toBe(100);
  });

  test("with windowWidth, clamps to 40% max", () => {
    // 40% of 200 = 80
    expect(clampSidebarWidth(90, 200)).toBe(80);
    expect(clampSidebarWidth(80, 200)).toBe(80);
    expect(clampSidebarWidth(50, 200)).toBe(50);
  });

  test("with small windowWidth, max wins over large values", () => {
    // 40% of 100 = 40
    expect(clampSidebarWidth(60, 100)).toBe(40);
    expect(clampSidebarWidth(40, 100)).toBe(40);
    expect(clampSidebarWidth(30, 100)).toBe(30);
  });

  test("without windowWidth, no max enforced", () => {
    expect(clampSidebarWidth(500)).toBe(500);
    expect(clampSidebarWidth(1000)).toBe(1000);
  });

  test("min boundary passes through exactly", () => {
    expect(clampSidebarWidth(MIN_SIDEBAR_WIDTH)).toBe(MIN_SIDEBAR_WIDTH);
  });

  test("computed max boundary passes through exactly", () => {
    const windowWidth = 200;
    const maxWidth = Math.floor(windowWidth * MAX_SIDEBAR_WIDTH_PERCENT);
    expect(clampSidebarWidth(maxWidth, windowWidth)).toBe(maxWidth);
  });

  test("max takes precedence when window is very small", () => {
    // 40% of 30 = 12, which is below MIN_SIDEBAR_WIDTH.
    // Max wins because a 20-col sidebar in a 30-col window is unusable.
    expect(clampSidebarWidth(15, 30)).toBe(12);
    expect(clampSidebarWidth(25, 30)).toBe(12);
  });
});
