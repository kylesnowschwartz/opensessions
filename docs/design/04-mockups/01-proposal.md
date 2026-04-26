# 04-mockups/01 · Proposal (the panel under the new vocabulary)

Same 5-session dataset as `00-baseline.md`, rendered with:

- The four-zone layout from `02-zones.md` (header / rolodex / activity / footer)
- The Nerd Font alphabet from `03-vocabulary.md` (Material Design Icons +
  vendored Clawd + brand letterforms + Powerline branch)
- The 4-tier text hierarchy (Primary / Secondary / Dim / Muted)

Width: 38 cells (matching the reference). Pane is **focused**.

> **Status:** This doc is the historical record of the Resolution A vs B
> exploration. The locked design lives in `02-canonical.md`. Resolution B
> was selected; the locked decisions resolved here have since been
> revisited during the Codex review (see `REVIEW-NOTES-codex.md` and the
> updated locked decisions table in `02-canonical.md`). Specifically: the
> count format reverted to numeric-only `2` (not `2π`); ports were
> removed entirely as a feature; the activity zone is now permanently
> reserved (no auto-show / fade).
>
> **Note for grep-based audits:** the side-by-side delta panels and the
> baseline-comparison sections of this doc intentionally contain retired
> glyphs as the "before" half of the comparison. Exclude those panels
> from sanity checks verifying the retired-list is enforced.

---

## Resolution-A: All-in mockup (the canonical proposal)

```
┌──────────────────────────────────────┐
│   opensessions   5 sessions          │   ← HEADER zone (Clawd + Tier 1 + Tier 4 muted count)
│  ──────────────────────────────────  │   ← zone separator (Tier 4 muted)
│                                      │
│   ai-engineering-template       󱙺   │   ← session 1, collapsed (1 agent → robot-outline)
│   pi-mono                       2   │   ← session 2, count=2 (right gutter widens)
│                                      │
│   ────────────── ⌃ ───────────────   │   ← rolodex top wrap-rule
│                                      │
│  ╭────────────────────────────────╮  │   ← FOCUSED CARD border
│  │ ▎opensessions               4  │  │   ← session row (working spinner left, count-4 right)
│  │   main   󰒍 :3000              │  │   ← branch + ports row (Tier 4 muted leaders)
│  │ ▎ pi  15c8                  π  │  │   ← agent: pi working (spinner severity)
│  │ ▎ pi  10bc                󰗡  π  │  │   ← agent: pi ready
│  │ ▎ claude-code             󰗡    │  │   ← agent: claude-code ready (no thread)
│  │ ▎ claude-code 1859        󰗡    │  │   ← agent: claude-code 1859 ready
│  ╰────────────────────────────────╯  │
│                                      │
│   ────────────── ⌄ ───────────────   │   ← rolodex bottom wrap-rule
│                                      │
│   claude-code-system…                │   ← session 4, no agents
│   the-themer                  󰗡 󱙺   │   ← session 5, 1 agent (ready, robot-outline)
│                                      │
│  ──────────────────────────────────  │   ← zone separator
│   ACTIVITY                           │
│   pi 15c8  ask_user                 │   ← live entry (Tier 2 source, Tier 3 desc)
│   cc 1859  Base directory for       │   ← long entry — clean ellipsis,
│             this skill: /Users/    │      indent-continued in available width
│   cc 1859  ran  bun test (passed)   │   ← outcome suffix in green
│   pi 10bc  awaiting input            │   ← system message, source-tagged
│  ──────────────────────────────────  │   ← zone separator
│   j/k nav  ↵ switch  q quit          │   ← FOOTER zone
└──────────────────────────────────────┘

   (Severity glyph legend, in proposal:)
   working   = animated brail spinner, blue
   waiting   = 󰅹 (nf-md-bell-alert), yellow
   ready     = 󰗡 (nf-md-check-circle-outline), green
   stopped   = 󱐨 (nf-md-circle-small), surface2
   error     = 󰀨 (nf-md-alert-circle), red
```

> Note on the activity zone wrap. `cc 1859 Base directory for this skill: /Users/…`
> is now in a zone where wrapping is *expected and acceptable* — the
> activity zone is read top-down and entries can be multi-line. Inside
> the focused card, where rows are anchored to per-agent identity, wrapping
> would have broken the grid. Moving the message here resolves F1 from
> the baseline at the cost of zero focused-card chrome.

---

## Per-zone walkthrough

### Header zone

```
   opensessions   5 sessions
^^^   ^^^^^^^^^^^^   ^^^^^^^^^^
│      │              Tier 4 muted readout
│      Tier 1 bold (focused)
└─ Clawd  (Tier 1 bold; Tier 2 unfocused)
```

- Clawd at the leftmost cell becomes the **product brand mark**. Same
  glyph as the tmux statusline's claude-code window indicator and the
  panel right gutter for claude-code agents — three positions, three
  meanings, one glyph.
- `5 sessions` replaces `Sessions 5 ⚡1`. The `⚡1` running-counter is
  retired; running state is implicit in the rolodex's left severity
  gutter — anyone scanning the panel sees the working spinner on the
  focused card without needing a header tally.

### Rolodex zone — collapsed sessions

```
  ai-engineering-template       󱙺
  pi-mono                       2
  the-themer                  󰗡 󱙺
```

- **Severity gutter (column 1)** stays blank for sessions whose agents
  are all ready or stopped. Reserves the cell, doesn't collapse it —
  this is the HUD discipline at work.
- **Identity gutter (column 36–37)** carries:
  - `󱙺` (robot-outline) when there's exactly 1 agent and it's `generic`
  - `2` digit when count ≥ 2 (gutter widens to 2 cells)
  - `π / ▲ / ♦` when there's 1 agent and it's pi/codex/amp
  - Clawd  when there's 1 agent and it's claude-code
- **The `⎇ main` branch rows are gone** from collapsed sessions — that's
  4 rows of vertical real estate recovered in the 5-session example.
- Under the new tier system, `the-themer 󰗡 󱙺` reads as: name in Tier 2
  default, ready glyph in green, robot-outline in Tier 3 dim. The eye
  reads "this session has a generic agent that's ready." No ambiguity.

### Rolodex zone — focused card

```
  ╭────────────────────────────────╮
  │ ▎opensessions               4 │
  │   main   󰒍 :3000              │
  │ ▎ pi  15c8                 π  │
  │ ▎ pi  10bc               󰗡 π  │
  │ ▎ claude-code            󰗡   │
  │ ▎ claude-code 1859       󰗡   │
  ╰────────────────────────────────╯
```

- **Session row**: name in Tier 1 bold, count `4` in Tier 3 dim right
  gutter. The working spinner takes the severity slot — at a glance the
  user knows "this session has at least one agent doing something."
- **Branch + ports row**: a single Tier 4 muted line. ` main` (Powerline
  branch) and `󰒍 :3000` (server-network glyph + port). When more ports
  exist, this line wraps to additional Tier 4 muted lines — but only
  inside the focused card, never in collapsed cards.
- **Agent rows**: each has its own severity glyph (left), thread suffix
  (Tier 3 dim), then identity glyph in the right gutter. **Activity is
  no longer here** — `ask_user` and `Base directory for…` moved to the
  activity zone.
- **The `×` dismiss control is hidden** until the j/k cursor is on that
  agent row, at which point it appears in column 1 (severity gutter),
  briefly. The cursor's *own* severity glyph slides one cell right while
  the dismiss is showing — that's the only time the gutter shifts.

### Activity zone

```
  ──────────────────────────────────
   ACTIVITY
   pi 15c8  ask_user
   cc 1859  Base directory for
             this skill: /Users/
   cc 1859  ran  bun test (passed)
   pi 10bc  awaiting input
  ──────────────────────────────────
```

- **Constant chevron-right leader** (`󰅂`) at column 1. Tier 4 muted —
  recedes vs. the source column.
- **Source column** at column 3–11: `pi 15c8`, `cc 1859`, etc. Tier 2
  (default text) — readable.
- **Description column** at column 13+: italic Tier 3, with outcome
  suffixes coloured by severity (`(passed)` green, `(failed)` red).
- **Multi-line entries** indent continuation lines to align under the
  description column. The reference screenshot's `Base directory for
  this skill: /Users/…` message now reads cleanly without losing
  characters to truncation, because the activity zone is *expected* to
  carry multi-line content. The focused card stays tight.

### Footer zone

Unchanged from current behaviour. Same key hints; same dim/bright
behaviour on pane focus.

---

## What's recovered

Comparing baseline (28 vertical cells used in the rolodex region) to the
proposal:

| Region                              | Baseline cells | Proposal cells | Delta |
|-------------------------------------|----------------|----------------|-------|
| Header                              | 1              | 1              | 0     |
| Branch rows in collapsed sessions   | 4              | 0              | **−4** |
| Focused-card chrome (border + spacing) | 12             | 8              | **−4** |
| Activity rows inside focused card   | 3 (wrapped, truncated) | 0     | **−3** |
| Activity zone (new)                 | 0              | 6              | **+6** |
| Zone separators (3 rules)           | 0              | 3              | **+3** |
| **Net**                             |                |                | **−2** |

Net 2-cell vertical *gain*, with these qualitative wins:

- The **wrap-row catastrophe is solved** — long activity messages now
  belong in a zone where multi-line is the design, not an accident
  inside a row that wasn't meant to wrap.
- The **`·` and `●` decoder rings are gone** — every glyph in the panel
  now has exactly one role.
- The **collapsed sessions are visually quieter** — same information
  available, but you only see it on the session you're focused on.

---

## Resolution-B: Restraint variant (alternate)

For comparison: same data, but with the activity zone hidden (toggleable
keybind) and branch+ports hidden in the focused card too. Most Tufte.
Most aerospace.

```
┌──────────────────────────────────────┐
│   opensessions   5 sessions          │
│  ──────────────────────────────────  │
│                                      │
│   ai-engineering-template       󱙺  │
│   pi-mono                       2  │
│                                      │
│   ────────────── ⌃ ───────────────   │
│                                      │
│  ╭────────────────────────────────╮  │
│  │ ▎opensessions               4 │  │
│  │ ▎ pi  15c8                 π  │  │
│  │ ▎ pi  10bc               󰗡 π  │  │
│  │ ▎ claude-code            󰗡   │  │
│  │ ▎ claude-code 1859       󰗡   │  │
│  ╰────────────────────────────────╯  │
│                                      │
│   ────────────── ⌄ ───────────────   │
│                                      │
│   claude-code-system…                │
│   the-themer                  󰗡 󱙺  │
│                                      │
│  ──────────────────────────────────  │
│   j/k nav  ↵ switch  q quit          │
└──────────────────────────────────────┘
```

- Activity zone hidden (key toggle). Branch row hidden (info on demand,
  shows in a tooltip / detail mode). Card is tight.
- Recovers ~6 more vertical cells than Resolution-A.
- Loses the live-narrative pulse that made the activity zone tasteful.
- This is what "focused-clean" mode (the third declutter level) looks
  like under the HUD principle.

---

## Statusline strips

The statusline pulls the same identity glyphs and adds severity-aware
colour. Two strips, both 80 cells wide.

### Strip A: nominal — three windows, mixed agents, one active

```
   opensessions   1: VCC   2:  project    3: π utils    4:  docs                       
                  ^^^      ^^             ^^            ^^
                  active   working         ready         ready
                  bold     blue            green         green
```

- Window 1 active (`bold blue` text, no glyph since active is the first
  window in the screenshot's example).
- Window 2 has claude-code (Clawd glyph), state = working → blue glyph.
  Active-window styling does NOT apply to inactive windows, so glyph is
  *blue without bold* — the contrast against window 1's `bold blue`
  text is what carries activeness.
- Window 3 has pi (`π`), ready → green.
- Window 4 has Clawd, ready → green.

### Strip B: collision case — active window has working claude-code

```
   opensessions   1:  vcc    2:  project   3: π utils   4:  docs                       
                  ^^^         ^^            ^^           ^^
                  bold        ready         ready        ready
                  no glyph     green         green        green
                  colour
                  on glyph
```

- Window 1 is active AND has a working claude-code. Active-window
  styling = `bold blue` on text. Severity colour for working = blue.
- The collision resolution rule: **active text uses bold; severity glyph
  uses colour without bold.** Window 1's `vcc` text is bold blue; the
  Clawd glyph is plain blue. The user reads activeness by weight (bold
  vs not-bold), severity by glyph colour.

---

## Side-by-side delta summary

For your scan:

```
BEFORE (baseline)                          AFTER (proposal)
─────────────────────────────              ─────────────────────────────
  Sessions  5  ⚡1                            opensessions   5 sessions
                                            ──────────────────────────
  ai-engineering-te…           ●  ◇          ai-engineering-template       󱙺
  ⎇ kyle/cc-native…                          pi-mono                       2
                                            ────── ⌃ ──────
  pi-mono  ●2                     ◇         ╭──────────────────────────╮
                                            │ ▎opensessions          4 │
 ╭────────────────────────────╮             │   main   󰒍 :3000        │
 │▎opensessions  ●4         : │             │ ▎ pi 15c8              π│
 │ ⎇ main                      │             │ ▎ pi 10bc           󰗡 π│
 │ × pi  #15c8              :  │             │ ▎ claude-code       󰗡  │
 │ · ask_user                  │             │ ▎ claude-code 1859  󰗡  │
 │ × pi  #10bc              ◇  │             ╰──────────────────────────╯
 │ × claude-code            ◇  │             ────── ⌄ ──────
 │ × claude-code #1859      ◇  │             claude-code-system…
 │ · Base directory for        │             the-themer            󰗡 󱙺
 │   this skill: /Users/       │             ──────────────────────────
 ╰────────────────────────────╯             ACTIVITY
                                             pi 15c8  ask_user
  claude-code-syste…                          cc 1859  Base directory for
  ⎇ main                                                this skill: /Users/
                                             cc 1859  ran bun test (passed)
  the-themer  ●                ◇             pi 10bc  awaiting input
  ⎇ main                                    ──────────────────────────
                                             j/k nav  ↵ switch  q quit
  ────────────────────────
  j/k nav  ↵ switch  q quit
```

---

## Open questions surfaced by the mockup

These didn't appear until I drew it. Worth resolving before promoting to
a live OpenTUI mock.

1. **Branch + ports row inside the focused card — same row or two?**
   The mockup has `  main   󰒍 :3000` as one Tier 4 muted line. But
   when there are 3+ ports it has to wrap. Should ports always be on
   their own row, even when there's just one?

2. **The `2` numeric agent count vs. the identity glyph.** When a
   session has 2 agents of the *same* type (e.g. 2 pi instances in
   `pi-mono`), the right gutter shows `2`. Should it instead show
   `2π` (count + glyph) so the user knows the type as well? Costs +1
   cell but gains a fact.

3. **The activity zone label** (`ACTIVITY`). Helps readability, but
   it's a literal label which fails the data-ink test. Possible
   alternatives:
   - Drop the label entirely; the zone separator above + activity
     entries below speak for themselves
   - Replace with a small Clawd-style "live" indicator (e.g. a teal
     dot when new entries are pulsing in)
   - Use the focused session's name as the label (`opensessions →`)
     so the user knows which session's narrative they're reading

4. **Wrap-rule chevrons (`⌃`, `⌄`).** The mockup uses `─── ⌃ ───` and
   `─── ⌄ ───` to indicate "more content above" / "more content
   below." This is new chrome. Earned (tells the eye there's a
   rolodex, not a bounded list) or unearned (looks like decoration)?

5. **Activity zone label colour.** If we keep the `ACTIVITY` label,
   should it use a colour that matches the focused session's
   severity? E.g. `ACTIVITY` in blue when focused-session has a
   working agent? That's a HUD-grade signal but starts to feel
   over-coloured.

These are the kind of questions a static ASCII mockup is good at
flushing out — they're easier to spot in a drawing than in a vocabulary
table. We resolve them before promoting to the OpenTUI live mock.
