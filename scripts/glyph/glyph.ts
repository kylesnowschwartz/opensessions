#!/usr/bin/env bun
/**
 * glyph — programmatic Nerd Font lookup & preview.
 *
 * Subcommands:
 *   search <pattern> [--limit N] [--prefix md|fa|oct|cod|dev|pl|...]
 *   lookup <hex>
 *   render <id> [<id> ...] [--out PATH] [--font PATH]
 *   version
 *
 * ids: hex codepoint (F0054, 0xF0054, U+F0054) or canonical name (md-arrow-right).
 *
 * See scripts/glyph/README.md for design rationale.
 */
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(HERE, "glyphnames.json");

interface Entry { char: string; code: string }
interface Metadata { website?: string; version?: string; date?: string }

function loadAll(): { entries: Map<string, Entry>; meta: Metadata } {
  if (!existsSync(DATA_PATH)) {
    console.error(`glyph: missing data file at ${DATA_PATH}`);
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as Record<string, unknown>;
  const entries = new Map<string, Entry>();
  let meta: Metadata = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "METADATA") { meta = v as Metadata; continue; }
    if (v && typeof v === "object" && "char" in v && "code" in v) {
      entries.set(k, v as Entry);
    }
  }
  return { entries, meta };
}

function normHex(input: string): string {
  return input.toLowerCase()
    .replace(/^u\+/i, "")
    .replace(/^0x/i, "")
    .replace(/^\\u\{/, "")
    .replace(/\}$/, "")
    .trim();
}

function fmtRow(name: string, e: Entry): string {
  // U+ codepoint padded to 5 hex chars (Nerd Fonts use 4-6); name suffixed.
  const cp = `U+${e.code.toUpperCase().padEnd(5)}`;
  return `${e.char}  ${cp}  ${name}`;
}

function search(pattern: string, limit: number, prefix?: string): Array<[string, Entry]> {
  let re: RegExp;
  try { re = new RegExp(pattern, "i"); }
  catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
  const { entries } = loadAll();
  const hits: Array<[string, Entry]> = [];
  for (const [name, e] of entries) {
    if (prefix && !name.startsWith(`${prefix}-`)) continue;
    if (re.test(name)) hits.push([name, e]);
  }
  hits.sort((a, b) => a[0].localeCompare(b[0]));
  return hits.slice(0, limit);
}

function lookup(hex: string): Array<[string, Entry]> {
  const code = normHex(hex);
  const { entries } = loadAll();
  const hits: Array<[string, Entry]> = [];
  for (const [name, e] of entries) if (e.code === code) hits.push([name, e]);
  return hits;
}

function resolveId(id: string, entries: Map<string, Entry>): { name: string; entry: Entry } | null {
  // Hex-looking ids: F0054, 0xF0054, U+F0054
  if (/^(u\+|0x)?[0-9a-f]{4,6}$/i.test(id)) {
    const code = normHex(id);
    for (const [name, e] of entries) if (e.code === code) return { name, entry: e };
    return null;
  }
  // Otherwise treat as canonical name
  const e = entries.get(id);
  if (e) return { name: id, entry: e };
  return null;
}

function defaultFont(): string {
  if (process.env.GLYPH_FONT && existsSync(process.env.GLYPH_FONT)) return process.env.GLYPH_FONT;
  // Prefer Hack Nerd Font Mono, fall back to any installed Nerd Font Mono.
  for (const family of ["Hack Nerd Font Mono", "JetBrainsMono Nerd Font Mono", "MesloLGL Nerd Font", "Nerd Font Mono"]) {
    const r = spawnSync("fc-match", ["-f", "%{file}\t%{family}", family], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) {
      const [file, fam] = r.stdout.trim().split("\t");
      // fc-match falls back silently — only accept if the resolved family
      // contains "Nerd" (case-insensitive). Otherwise try the next family.
      if (file && /nerd/i.test(fam ?? "")) return file;
    }
  }
  console.error("glyph: no Nerd Font found via fc-match. Set GLYPH_FONT=/path/to/font.ttf.");
  process.exit(2);
}

function render(ids: string[], outPath: string, font: string): void {
  const { entries } = loadAll();
  const tmpDir = mkdtempSync(join(tmpdir(), "glyph-"));
  const tiles: string[] = [];
  const missing: string[] = [];

  for (let i = 0; i < ids.length; i++) {
    const r = resolveId(ids[i], entries);
    if (!r) { missing.push(ids[i]); continue; }
    const tile = join(tmpDir, `tile-${i}.png`);
    const glyphPng = join(tmpDir, `g-${i}.png`);
    const capPng = join(tmpDir, `c-${i}.png`);

    // Glyph cell — large, centred, fixed extent so all tiles align.
    const g = spawnSync("magick", [
      "-font", font, "-pointsize", "144",
      "-background", "white", "-fill", "black",
      `label:${r.entry.char}`,
      "-gravity", "center", "-extent", "200x200",
      glyphPng,
    ]);
    if (g.status !== 0) {
      console.error(`glyph: magick failed rendering ${r.name} (${r.entry.code}): ${g.stderr?.toString() ?? ""}`);
      process.exit(1);
    }

    // Caption: codepoint + name, smaller font.
    spawnSync("magick", [
      "-pointsize", "18", "-background", "white", "-fill", "black",
      `label:U+${r.entry.code.toUpperCase()}\n${r.name}`,
      "-gravity", "center", "-extent", "200x70",
      capPng,
    ]);

    // Vertical stack: glyph above caption.
    spawnSync("magick", [glyphPng, capPng, "-append", tile]);
    tiles.push(tile);
  }

  if (tiles.length === 0) {
    console.error(`glyph: no glyphs rendered (missing: ${missing.join(", ")})`);
    process.exit(1);
  }

  // Horizontal strip of all tiles.
  spawnSync("magick", [...tiles, "+append", outPath]);
  if (missing.length) console.error(`glyph: skipped unknown ids: ${missing.join(", ")}`);
  console.log(`wrote ${outPath}  (${tiles.length} glyph${tiles.length === 1 ? "" : "s"}, font: ${font})`);
}

function usage(): never {
  console.error(`usage:
  glyph search <pattern> [--limit N] [--prefix md|fa|oct|cod|dev|pl|seti|weather|...]
  glyph lookup <hex>
  glyph render <id> [<id> ...] [--out PATH] [--font PATH]
  glyph version

ids: hex codepoint (F0054, 0xF0054, U+F0054) or canonical name (md-arrow-right).
data: scripts/glyph/glyphnames.json (Nerd Fonts vendor pin).`);
  process.exit(2);
}

function popFlag(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}

const argv = process.argv.slice(2);
const cmd = argv.shift();
if (!cmd) usage();

if (cmd === "version") {
  const { meta } = loadAll();
  console.log(JSON.stringify(meta, null, 2));
} else if (cmd === "search") {
  const limitStr = popFlag(argv, "--limit");
  const prefix = popFlag(argv, "--prefix");
  const pat = argv[0];
  if (!pat) usage();
  const limit = limitStr ? Number(limitStr) : 100;
  const hits = search(pat, limit, prefix);
  for (const [n, e] of hits) console.log(fmtRow(n, e));
  console.error(`(${hits.length} result${hits.length === 1 ? "" : "s"}${prefix ? `, prefix=${prefix}` : ""})`);
} else if (cmd === "lookup") {
  const hex = argv[0];
  if (!hex) usage();
  const hits = lookup(hex);
  if (hits.length === 0) {
    console.error(`glyph: no entry for U+${normHex(hex).toUpperCase()}`);
    process.exit(1);
  }
  for (const [n, e] of hits) console.log(fmtRow(n, e));
} else if (cmd === "render") {
  const out = popFlag(argv, "--out") ?? "/tmp/glyph-render.png";
  const font = popFlag(argv, "--font") ?? defaultFont();
  if (argv.length === 0) usage();
  render(argv, out, font);
} else {
  usage();
}
