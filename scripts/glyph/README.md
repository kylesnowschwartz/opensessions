# glyph — programmatic Nerd Font lookup & preview

Authoritative lookup over the vendored `glyphnames.json` (Nerd Fonts v3.4.0).
Replaces "guessing codepoints from memory" with ground-truth search and
rasterised previews.

## Why this exists

Nerd Font glyph names are not always self-describing (`md-arrow-u-left-top` is
in fact a playing-card icon at U+F18A6 — there is no arrow named that). Picking
the right glyph by name alone is unreliable. This tool resolves that by:

1. Searching the official `glyphnames.json` for candidates by name pattern.
2. Reverse-looking-up codepoints we already use in the codebase.
3. Rasterising one or more glyphs side-by-side to a PNG so the picker
   (human or agent) can **see** them in the actual Nerd Font, not guess.

## Usage

```bash
just glyph-search arrow            # name-pattern search
just glyph-search '^md-arrow'      # regex (case-insensitive)
just glyph-lookup F0054            # reverse: codepoint → name(s)
just glyph-render F0054 F0142      # rasterise → /tmp/glyph-render.png
```

Direct invocation:

```bash
bun run scripts/glyph/glyph.ts search arrow --limit 30
bun run scripts/glyph/glyph.ts render md-arrow-right F0142 --out /tmp/x.png
bun run scripts/glyph/glyph.ts version    # prints METADATA from glyphnames.json
```

`render` accepts either hex codepoints (`F0054`, `0xF0054`, `U+F0054`) or
canonical glyph names (`md-arrow-right`). Output defaults to
`/tmp/glyph-render.png`; override with `--out`. Font defaults to whatever
`fc-match "Hack Nerd Font Mono"` resolves; override with `--font /path/to.ttf`
or `GLYPH_FONT=...`.

## Data source

`glyphnames.json` is vendored from the [Nerd Fonts FontPatcher][1]. It is the
canonical name → codepoint mapping the Nerd Fonts project ships. Pinned to
v3.4.0 (2025-04-24) — bump deliberately when upgrading icon coverage.

[1]: https://github.com/ryanoasis/nerd-fonts/blob/master/font-patcher

License: MIT (Nerd Fonts).

## Why not fc-list / a generic font tool?

`fc-list` and friends enumerate fonts; they don't know glyph **names**. The
Nerd Fonts naming scheme (`md-*`, `fa-*`, `oct-*`, `cod-*`, `dev-*`, `pl-*`,
…) is project-specific metadata that lives only in `glyphnames.json`. There is
no off-the-shelf CLI for searching this set with rasterised previews — hence
this small wrapper.
