# Spec: opensessions tmux header

**Status:** v1.1 — severity-aware glyph colour, per-agent-type identity
**Origin ticket:** TMUX-HEADER-001
**Last updated:** 2026-05 (Stage 5 of side-panel redesign)

This spec is the lasting reference for the opensessions tmux status line. It defines the option contract, the agent glyph table, and the read/write protocol between the opensessions server and tmux. Implementation lives in `packages/runtime/src/server/tmux-header-sync.ts` and `integrations/tmux-plugin/scripts/header.tmux`.

---

## 1. Goals and non-goals

### Goals
- Replace third-party tmux themes with a status line whose colours and iconography track the active opensessions theme (`packages/runtime/src/themes.ts`).
- Surface an at-a-glance per-window glyph for tmux windows that contain a live agent process (Claude Code, Pi, Codex, …), to aid tab navigation.
- **Severity-aware glyph colour.** The per-window glyph is painted in the colour of the dominant agent's severity (working / waiting / ready / stopped / error), so the tab strip doubles as a hands-off status board. Mirrors the panel's left-gutter severity colours; see `docs/design/03-vocabulary.md` §6. *(Lifted to v1 in v1.1.)*
- Keep the integration zero-cost on the tmux status repaint hot path (no `#(...)` shell expansions for agent state).

### Non-goals (v1.1)
- Per-agent-type colour. The glyph identifies *which* agent; severity colour answers *what state*. They share the same cell.
- Per-session palette divergence. v1 writes `@os-thm-*` at the global scope.
- Tooltip / hover-reveal of agent metadata.
- Multi-agent rendering in a single cell (e.g. "two glyphs"). Precedence picks one identity *and* its severity.

---

## 2. Architecture

```
                     +---------------------------+
                     |  opensessions server      |
                     |                           |
                     |  broadcastStateImmediate  |
                     |     |                     |
                     |     v                     |
                     |  syncTmuxHeaderOptions    |
                     |     |                     |
                     +-----+---------------------+
                           |
                           |  tmux set-option -w -t <wid> @os-agent <glyph>
                           |  tmux set-option -w -t <wid> @os-agent-fg <hex>
                           |  tmux set-option -w -t <wid> @os-agent-type <agent>
                           |  tmux set-option -g           @os-thm-<token> <hex>
                           v
                     +---------------------------+
                     |  tmux server              |
                     |                           |
                     |  window-status-format     |
                     |  reads @os-agent*         |
                     |  status-style reads       |
                     |  @os-thm-*                |
                     +---------------------------+
```

The server is the single writer; tmux is a passive reader. Status-line repaint never shells out for agent state.

---

## 3. Option contract

### 3.1 Per-window options (writer: server, scope: `set-option -w`)

| Option | Type | Meaning |
|---|---|---|
| `@os-agent` | string (single-cell glyph) | Glyph for the dominant agent type in this window. Unset when no live agent is present. |
| `@os-agent-fg` | hex string (`#rrggbb`) or `default` | Foreground colour for the glyph. Resolved per-window from the dominant agent's severity: `working`→`palette.blue`, `waiting`→`palette.yellow`, `ready`→`palette.green`, `stopped`→`palette.surface2`, `error`→`palette.red`. The mapping is locked in `severityColour()` in `tmux-header-sync.ts` and mirrors the panel's left-gutter resolver. |
| `@os-agent-type` | string | Agent name (`claude-code`, `pi`, `codex`, `amp`, …) of the dominant agent. For introspection / future variants. |

Lifetime:
- Set when at least one agent in the window has `liveness === "alive"`.
- Unset (`set-option -wu`) the broadcast cycle after the last alive agent exits, OR when the window itself is destroyed (tmux handles the latter).

### 3.2 Per-server (global) options (writer: server, scope: `set-option -g`)

| Option | Maps to `Theme.palette.*` |
|---|---|
| `@os-thm-base` | `base` |
| `@os-thm-text` | `text` |
| `@os-thm-blue` | `blue` |
| `@os-thm-surface0` | `surface0` |
| `@os-thm-surface2` | `surface2` |
| `@os-thm-overlay0` | `overlay0` |
| `@os-thm-yellow` | `yellow` |
| `@os-thm-red` | `red` |
| `@os-thm-green` | `green` |

Lifetime: re-written when the server detects a theme change. Otherwise stable.

**Transparency translation.** Some builtin themes (e.g. `transparent`) store the literal string `"transparent"` for `palette.base`/`mantle`/`crust` to indicate "use the terminal's own background." tmux understands the keyword `default`, not `transparent`. Before writing palette tokens, `tmux-header-sync.ts` runs each value through a `toTmuxColour()` helper that maps `"transparent" → "default"`; all other values pass through unchanged. The format-string fallback chain (`#{?@os-thm-base,#{@os-thm-base},default}`) at §6 still works because `default` is set, not the empty string.

### 3.3 User options (writer: user, scope: `set -g` in tmux conf)

| Option | Default | Meaning |
|---|---|---|
| `@opensessions-header` | unset (= `off`) | Set to `on` to opt in. The server reads this once at startup and gates `syncTmuxHeaderOptions`. The tmux conf also reads it to decide whether to source `header.tmux`. |

---

## 4. AGENT_GLYPHS table

| Agent name | Glyph | Codepoint | Notes |
|---|---|---|---|
| `claude-code` |  / `★` | U+100CC0 *(Clawd)* / U+2605 *(fallback)* | Detect-and-fall-back: emits Clawd when the font is installed, else BLACK STAR. See §4.1. |
| `pi` | `π` | U+03C0 GREEK SMALL LETTER PI | |
| `codex` | `▲` | U+25B2 BLACK UP-POINTING TRIANGLE | |
| `amp` | `♦` | U+2666 BLACK DIAMOND SUIT | |
| `generic` |  | U+F167A nf-md-robot-outline | Fallback when no specific entry exists. Aligns with the panel's right-gutter `ID_GENERIC`. |

### 4.1. Clawd auto-detect

`isClawdInstalled()` in `tmux-header-sync.ts` does one `existsSync` against the OS-standard user-fonts path at module load:

| Platform | Path |
|---|---|
| macOS | `~/Library/Fonts/Clawd.ttf` |
| Linux | `~/.local/share/fonts/Clawd.ttf` |

`buildAgentGlyphs({ clawdInstalled })` produces the table — Clawd codepoint when true, `★` when false. The probe is one-shot at module load; restart the server after running the installer. The font itself is vendored at `fonts/Clawd.ttf`; `just install-clawd` (or `scripts/install-clawd-font.sh` directly) is the idempotent installer.

Mascot likeness is a trademark of Anthropic; personal-use vendoring is fine, public redistribution outside this fork needs Anthropic's nod.

**Constraints on glyph values:**
- Single column-cell wide. Multi-cell glyphs (most emoji) drift status-line column accounting.
- Available in MesloLGS Nerd Font (or whatever the user's terminal renders). The conf documents the assumption.
- ASCII-safe is preferred; widely-supported Unicode (U+25xx geometric shapes, U+26xx miscellaneous symbols, basic Greek) is next; Nerd Font private-use codepoints last (they bind us to a font).
- **Avoid less-common codepoints** like U+2726 (BLACK FOUR POINTED STAR) — they render as tofu boxes in monospace stacks that don't carry them, including some Nerd Font variants.

**Swap path.** Edit `AGENT_GLYPHS` in `tmux-header-sync.ts` and restart the server. No tmux conf change required.

### Precedence (multi-agent windows)

```
const AGENT_PRIORITY = ["claude-code", "pi", "codex", "amp"];
```

`pickAgentForWindow(agents)` returns the first match from `AGENT_PRIORITY` present in `agents`, falling back to `agents[0]` and finally to `"generic"`. Mirrors the existing `AGENT_TITLE_PATTERNS` ordering in `server/index.ts`.

---

## 5. Function signatures

### `tmux-header-sync.ts`

```ts
import type { SessionData } from "../contracts";
import type { Theme } from "../themes";

export const AGENT_GLYPHS: Record<string, string>;
export const AGENT_PRIORITY: readonly string[];

export function pickAgentForWindow(agents: string[]): string;

export function syncTmuxHeaderOptions(args: {
  sessions: SessionData[];
  theme: Theme;
  enabled: boolean;
}): void;
```

### Behaviour contract

- **Idempotent.** Identical inputs after the first call produce zero shell invocations.
- **Non-throwing.** Internal errors are caught and logged via `log("tmux-header", ...)`; the function never throws.
- **Bounded shell cost.** At most: 1 `list-panes` call per invocation, plus 1 chained `tmux` invocation containing all `set-option`/`set-option -wu` writes.
- **No global side effects when disabled.** `enabled === false` short-circuits before any tmux call.

---

## 6. Read protocol — `header.tmux`

Sourced from `opensessions.tmux` when `@opensessions-header == on`. Sets:

| tmux variable | Format |
|---|---|
| `status-position` | `top` |
| `status-justify` | `left` |
| `status-style` | `fg=default,bg=#{?@os-thm-base,#{@os-thm-base},default}` |
| `window-status-style` | `fg=default` |
| `window-status-current-style` | `fg=#{?@os-thm-blue,#{@os-thm-blue},default},bold` |
| `window-status-format` | `<space>#{?@os-agent,#[fg=#{@os-agent-fg}]#{@os-agent}#[default] ,}#I:#{=12:#{b:pane_current_path}}#{?window_zoomed_flag,Z,}<space>` |
| `window-status-current-format` | identical to `window-status-format` (active-window styling carried by `window-status-current-style`) |
| `window-status-separator` | single space — paired with the trailing pad above gives 2 cells between tabs |
| `status-left` | session-name pill in `theme.blue`. Ends with `#[default]` and **no trailing space** — windows carry their own leading pad, so adding one here would render with `bg=default` and produce a stray cell when the terminal default differs from the bar's bg. |
| `status-right` | preserved oh-my-tmux semantic content (prefix, pairing, sync) |

**Inactive-tab readability.** Inactive windows render with `fg=default` rather than a fixed `@os-thm-overlay0` colour. The opensessions theme palette is calibrated for dark terminal backgrounds; users running light terminal palettes (`the-themer` switches both) would see overlay grays as illegible. Letting the terminal palette dictate inactive-tab fg, and using `bold + theme.blue` for the active tab, keeps differentiation regardless of light/dark.

**Active-window vs. severity-colour collision.** When the active window's agent is `working`, both `window-status-current-style` and `@os-agent-fg` resolve to `theme.blue`, so colour alone can't differentiate "this is the active tab" from "this glyph means working." Resolution: the active style carries `bold`; the inline `#[fg=@os-agent-fg]` overrides the *colour* but inherits the segment-level `bold`, so the active working glyph renders bold-blue while inactive working glyphs render plain blue. When severity is anything other than `working`, both colour *and* weight differentiate. No special-case in the format string — tmux's existing attribute inheritance handles it. See `docs/design/03-vocabulary.md` §6 "Active-window vs. severity colour collision".

The `#{?@os-thm-base,#{@os-thm-base},default}` chain ensures the status line is readable on first paint before the server has written palette options.

---

## 7. Failure modes and recovery

See `artifacts/03-blueprint.md` Section 3 for the authoritative table. Key entries:

- Server not running inside tmux → sync no-ops, header stays unstyled.
- `@opensessions-header` off → no writes; tmux falls back to whatever else is loaded.
- Glyph wider than one cell → column drift. Constrained at the spec level.
- Window closed mid-broadcast → write fails harmlessly (`shellStatus()` throws on nonzero exit, the sync's outer try/catch swallows it without advancing the cache, so the next successful broadcast retries).
- Empty `tmux list-panes` (transient flake or genuinely empty) → sync returns early **without clearing caches**. Cached `lastWindows`/`lastPalette` are preserved so a subsequent successful scan can compute correct cleanup diffs and the bar does not lose its palette colours after a tmux server restart that wiped `@os-thm-*` options.

### 7.1 Disable behaviour (sticky-off)

Setting `@opensessions-header` from `on` back to `off` does **not** retroactively tear down options written during the previous active period:

- The server reads the gate **once at startup**, so a runtime flip is invisible until restart.
- After restart with the gate off, the server short-circuits before any tmux probe — it does not issue cleanup writes for `@os-agent*` per-window options or revert the status-line settings that `header.tmux` applied.

To fully revert: comment out or remove the `set -g @opensessions-header on` line, restart the tmux server, and (optionally) source the user's prior status-line config. v1 does not implement an automated tear-down path; treat the gate as restart-required and forget-on-restart.

---

## 8. Test surface

Module-spec tests live in `packages/runtime/test/tmux-header-sync.test.ts` (new). Coverage targets:
- Glyph lookup and precedence (S1–S3, E2 from blueprint test plan)
- Idempotence (S4)
- Diff-driven cleanup (E1, E5)
- Disabled gate (S6)
- Theme change propagates palette (S5)

Live verification on a real tmux server is recorded in the blueprint as L1–L3 and runs as part of the Stage 5 testing handoff.

---

## 9. Future work (not in v1.1)

- Per-status glyph swap: extend `@os-agent` lookup to also vary the *glyph* by status (e.g. severity-glyph overlay) when `@opensessions-header-status-aware == on`. Today only the colour varies; the glyph is identity-only.
- Per-agent-type colour: `theme.status[status]` or a separate `@os-agent-type-fg` palette.
- Tooltip via `@os-agent-tooltip` and tmux `#{T:...}` formats.
- Per-session palette overrides (different theme per tmux session).
- Custom Nerd Font glyphs delivered via the user's SVG-derived icon font — only the `AGENT_GLYPHS` table changes.
