# Codex review notes

## Verdict

I would not ship this design as-is. The direction is mostly strong, but the docs are not yet a single implementable contract: the same concepts are specified differently across `02-zones.md`, `03-vocabulary.md`, and `04-mockups/02-canonical.md`, and a few of the "locked" mockups use glyphs or behaviors that the supposed source-of-truth tables never define. This needs a doc-tightening pass before implementation, otherwise two careful implementers could still build meaningfully different panels.

## Blocking findings

### B1. Same-type count format is not actually locked

**Where:** `04-mockups/02-canonical.md` §"Locked decisions" Q3 and the quiet/live/errored mockups; `03-vocabulary.md` §3 "Identity row eligibility" and "Numeric agent count formatting"; `02-zones.md` §3.1; `04-mockups/01-proposal.md` §"Resolution-B" and open question 2  
**What:** The canonical doc locks `2π` for uniform same-type sessions and `3` for mixed sessions, but the vocabulary and zones docs still describe a numeric-only widened gutter for any `2+` session. The proposal doc also still shows `2` and still frames `2π` as an unresolved question.  
**Why it blocks:** This changes real layout math: gutter width, truncation budgets, mockup fidelity, and the `9+` edge case all depend on which rule wins. An implementer cannot safely wire the identity gutter without choosing a side.  
**Suggested resolution:** Pick one rule and update every dependent doc. If `2π` stays, specify how it behaves for `9+`, mixed-type sessions, and narrow widths. If numeric-only stays, remove `2π` from the canonical mockups and locked-decisions table.

### B2. The canonical mockup uses structural glyphs that the vocabulary never defines

**Where:** `04-mockups/02-canonical.md` §"Locked decisions", §"Canonical state — quiet/live/heavy"; `03-vocabulary.md` §5, §10, and §11; `02-zones.md` §4 example  
**What:** The locked mockup uses `⌃` and `⌄` in the rolodex wrap rules and `→` in the activity heading. `02-zones.md` also still uses `▸` as the activity leader. None of those glyphs are registered in `03-vocabulary.md` §5 or the codepoint cheat-sheet in §10, and §11 says anything outside the registered sets is a violation.  
**Why it blocks:** Right now the mockup is not mechanically derivable from the vocabulary doc that is supposed to drive implementation. An implementer can reasonably choose plain `─`, `⌃/⌄`, `▸`, or the nf-md chevron-right depending on which doc they trust.  
**Suggested resolution:** Promote every structural glyph used by the locked mockup into `03-vocabulary.md` §5/§10 with codepoint, role, and surface. If `⌃/⌄` and `→` are just sketch glyphs, remove them from the canonical doc and use only registered symbols.

### B3. Activity-zone auto-show has no fixed-height reflow policy

**Where:** `02-zones.md` §1 "Sizing rules" and §4 "Sizing"; `04-mockups/02-canonical.md` §"Auto-show trigger semantics" and the quiet/live/heavy mockups; `00-grounding.md` §5 and §7 (`focus pinning`, `declutter levels`)  
**What:** The docs say the activity zone is sticky, defaults to 5 lines, can range from 3 to 8 cells, and auto-shows when events arrive. But the canonical quiet/live/heavy panels visibly grow by different numbers of rows instead of reallocating space inside one fixed-height viewport, and no doc states what must give way on a real terminal when the zone appears.  
**Why it blocks:** Implementation needs an explicit answer to "what moves when the activity band opens?" Different reasonable choices change focus stability, wrap visibility, scroll behavior, and whether the focused card still feels pinned.  
**Suggested resolution:** Add a fixed-height rule. Examples: reserve the space permanently; steal rows from the rolodex bottom first; overlay the activity band over blank space; or re-center the rolodex and accept movement. Whatever the choice is, state it explicitly and show it in a same-height mockup.

### B4. The promised four-tier hierarchy quietly adds extra style axes and never properly specifies unseen

**Where:** `03-vocabulary.md` §4, §7 "Entry shape", and §8 retired list; `02-zones.md` §4 rationale and §7 "What information moved where"; `00-grounding.md` §7 "Charm: warmth"  
**What:** The design says text hierarchy is only four tiers, but activity descriptions are separately called "italic" in the zones doc, the vocabulary doc, and the canonical mockup notes. Unseen state is even less formal: it is said to become a teal name highlight, but that rule only appears in the retired list / moved-information table, not in the actual vocabulary or canonical examples.  
**Why it blocks:** An implementer cannot tell whether italic is part of Tier 3, an allowed orthogonal modifier, or an outdated leftover. The same goes for unseen: there is no precedence rule against error/working/focus/unfocused states, so different implementations will style unseen sessions differently or drop the signal entirely.  
**Suggested resolution:** Promote both to first-class rules. Either define "activity description = Tier 3 plus italic" as an explicit sanctioned exception, or drop italics. For unseen, specify exact rows, colour token, and precedence against severity and pane-focus dimming, then add at least one canonical mockup that exercises it.

### B5. Collapsed-session severity semantics contradict each other

**Where:** `02-zones.md` §3.1; `03-vocabulary.md` §2 "Severity row eligibility"; `04-mockups/02-canonical.md` §"Canonical state — quiet" and §"Errored agent in non-focused session"  
**What:** `02-zones.md` says collapsed-session severity is blank when all agents are ready/stopped/no-agents. `03-vocabulary.md` says session rows show the worst agent state, full stop. The canonical mockups mostly behave like "blank when nominal" (`ai-engineering-template`, `pi-mono`), but `the-themer` in the quiet mockup also shows a ready glyph parked next to the right gutter instead of in the left severity gutter.  
**Why it blocks:** This is not cosmetic. It determines whether nominal sessions carry a left status glyph at all, which is part of the justification for removing header counters. The canonical mockup itself is not following one stable rule.  
**Suggested resolution:** Decide whether nominal collapsed rows suppress severity. Then encode that in §2 and fix the mockups so severity is either absent or always in the left gutter, never floating beside the identity glyph.

## Important findings

### I1. The auto-show behavior contradicts the stated declutter principle

**Where:** `00-grounding.md` §7 (`HUD: declutter levels`); `04-mockups/02-canonical.md` §"Locked decisions" Q1 and §"Auto-show trigger semantics"  
**What:** The grounding doc says declutter levels are "bound to keypress, not auto." The canonical design then locks the activity zone to auto-show and auto-hide on events.  
**Why it matters:** This is exactly the kind of principle-vs-design contradiction that makes later arguments go in circles. Either auto-show is the intended exception, or the principle is overstated. Right now both are written as normative.  
**Suggested resolution:** Rewrite one of them. I would either soften the grounding principle to allow event-driven reveal for safety-relevant narratives, or drop auto-show and rely on a manual detail toggle plus unseen cues.

### I2. Statusline scope is described as both "follow-up" and "part of v1"

**Where:** `02-zones.md` §6; `01-audit.md` §6 item 6; `03-vocabulary.md` §6; `REVIEW.md` "What's NOT in scope"  
**What:** One part of the design set still says severity-aware statusline colouring is a follow-up phase, while later docs say it has already been promoted into the redesign, and the review guide says exact implementation is deferred even though the redesign lifts it now.  
**Why it matters:** This is not just chronology noise. It changes whether panel/statusline alignment is part of the first implementation wave or a second wave, and it affects how reviewers judge drift in `tmux-header-sync.ts`.  
**Suggested resolution:** State one phase rule in one place. My recommendation: "panel vocabulary lands first; statusline glyph-table + colour alignment lands in the same overall redesign, but can be a separate PR."

### I3. `02-zones.md` still reads like an active contract even where it has been superseded

**Where:** `02-zones.md` §4 "Open questions for §3 (mockups)", §3.1, and §4 example; compare `01-audit.md` §6 which explicitly marks its open questions as historical  
**What:** `02-zones.md` still contains unresolved-question language about activity scope/persistence/format, still shows `▸` as the leader, and still describes numeric-only counts, but it does not mark those bits as superseded the way `01-audit.md` does.  
**Why it matters:** A reviewer or implementer reading in numeric order can easily treat old wording as current wording. That is exactly what happened here: later docs "resolve" things that earlier docs still present as live choices.  
**Suggested resolution:** Add explicit historical framing or strike-through notes in `02-zones.md` wherever later docs overruled it.

### I4. Cross-surface alignment is still easy to misread from the live code

**Where:** `03-vocabulary.md` §3 and §6; `packages/runtime/src/server/tmux-header-sync.ts` glyph table and `computeWindowStates()`  
**What:** The live statusline code still uses `generic: "●"` and still hard-codes all glyph colours to `theme.palette.blue`. The design docs do note the `generic` drift, but they otherwise speak as if the panel and statusline are already one shared vocabulary.  
**Why it matters:** An implementer who updates only the panel side will leave the tmux header stale, and the code currently gives them no safety rail. The statusline is also one of the explicit review targets.  
**Suggested resolution:** Add an explicit implementation checklist near `03-vocabulary.md` §6: update `AGENT_GLYPHS`, propagate severity colour, and re-check active-window collision handling in `tmux-header-sync.ts`.

### I5. The pane-unfocused mirror rules are specified but never shown in a full mockup

**Where:** `03-vocabulary.md` §4 "Pane-unfocused override"; the mockup set as a whole  
**What:** The docs define a full focused→unfocused tier slide, but none of the canonical states render a real unfocused-panel example. The only mention is textual annotation, not a complete panel.  
**Why it matters:** This leaves one of the core hierarchy promises untested. The first time anyone will see the full interaction of unfocused text, borders, current-session bar, and severity glyphs is during implementation.  
**Suggested resolution:** Add one canonical unfocused-pane state, even if it is small, so the mirror rules can be reviewed before code exists.

## Nice-to-have findings

### N1. `REVIEW.md` has a few sloppy references for the very reviewer workflow it is trying to guide

**Where:** `REVIEW.md` high-stakes table and review process section  
**What:** The high-stakes table points to `01-proposal.md` / `02-canonical.md` without the `04-mockups/` prefix from the repo-root-level guide, and "§1" for `02-canonical.md` is not a real section label.  
**Why it matters:** It does not block implementation, but it wastes reviewer time and weakens confidence in the reference hygiene of the set.  
**Suggested resolution:** Normalize those paths and point to named headings, not pseudo-section numbers.

### N2. The retired-glyph sanity check is noisy because the proposal doc embeds a before/after comparison

**Where:** `04-mockups/01-proposal.md` §"Side-by-side delta summary"; `04-mockups/00-baseline.md`  
**What:** The actual new-state panels are mostly clean, but the proposal doc intentionally reprints the old glyphs in the "BEFORE" half of the comparison.  
**Why it matters:** Grep-based checks for retired elements will throw false positives unless the comparison panels are excluded on purpose.  
**Suggested resolution:** Add a one-line note that baseline/comparison panels intentionally contain retired glyphs, while canonical end-state panels must not.

### N3. The `a` key is presented as both real UI and placeholder

**Where:** `04-mockups/02-canonical.md` footer lines and §"What this canonical doc does NOT yet specify"  
**What:** The canonical footer renders `a act` as if it is part of the locked UI, but the same doc later says the exact keybind is still placeholder text for `05-spec.md`.  
**Why it matters:** Small issue, but it creates avoidable churn in screenshots, test fixtures, and reviewer expectations.  
**Suggested resolution:** Either lock `a` now or render the footer label generically until the keybind is actually fixed.

### N4. Some of the PUA glyphs were invisible in my terminal

**Where:** Mostly the Clawd header/statusline glyph and some nf-md samples in the mockups  
**What:** A few private-use glyphs rendered as blank cells in my review environment.  
**Why it matters:** This is not a design issue, but it means visual review alone is a weak way to validate glyph-table consistency unless reviewers also cross-check the codepoints.  
**Suggested resolution:** Keep doing what the docs already partly do: pair visual mockups with explicit codepoint tables.

## Decisions you would have made differently

- Q1. Detail-level interaction: **disagree**. I would not auto-show a multi-line activity band until the design proves it can appear without violating focus pinning. My alternative would be manual reveal plus a lighter unseen/attention cue, or a permanently reserved activity band if auto-show is non-negotiable.
- Q2. Branch+ports row layout: **disagree**. I would keep ports on their own row whenever they exist. The conditional "same row when it fits" rule buys a little density but adds width-sensitive branching exactly where the design is already tight.
- Q3. Same-type count format: **disagree**. I would use numeric-only counts in the session gutter. Type information already exists on agent rows and the statusline; `2π` is clever, but it complicates width, edge cases, and cross-doc consistency for marginal gain.
- Q4. Activity zone heading: **agree**. Session-name-as-heading is better than a literal `ACTIVITY` label because it tells the user whose narrative they are reading.
- Q5. Rolodex wrap rules: **agree**. Chevron-bearing wrap rules are a good idea if they are properly codified in the vocabulary and visually distinct from ordinary separators.
- Ports kept as a feature / port-detection as an auto-show trigger: **agree**. Ports are operationally useful; I would keep them, just not on the collapsed default surface.
