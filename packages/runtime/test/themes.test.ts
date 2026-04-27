import { describe, test, expect } from "bun:test";
import { loadExternalTheme, resolveTheme, BUILTIN_THEMES } from "../src/themes";

describe("loadExternalTheme", () => {
  test("returns null for malformed JSON", () => {
    expect(loadExternalTheme("not json {")).toBeNull();
    expect(loadExternalTheme("")).toBeNull();
    expect(loadExternalTheme("null")).toBeNull();
    expect(loadExternalTheme("[]")).toBeNull();
    expect(loadExternalTheme('"a string"')).toBeNull();
  });

  test("returns null for empty object (no recognisable fields)", () => {
    expect(loadExternalTheme("{}")).toBeNull();
    expect(loadExternalTheme('{"unknownKey": "x"}')).toBeNull();
  });

  test("accepts a name + variant + palette JSON", () => {
    const json = JSON.stringify({
      name: "dayfox",
      variant: "light",
      palette: {
        text: "#3d2b5a",
        blue: "#2848a9",
        green: "#396847",
        yellow: "#ac5402",
        red: "#a5222f",
        surface0: "#e7d2be",
        base: "transparent",
      },
    });
    const t = loadExternalTheme(json);
    expect(t).not.toBeNull();
    expect(t?.name).toBe("dayfox");
    expect(t?.variant).toBe("light");
    expect(t?.palette?.text).toBe("#3d2b5a");
    expect(t?.palette?.blue).toBe("#2848a9");
    expect(t?.palette?.surface0).toBe("#e7d2be");
    expect(t?.palette?.base).toBe("transparent");
  });

  test("ignores unknown palette tokens but keeps known ones", () => {
    const json = JSON.stringify({
      palette: {
        text: "#000000",
        bogus: "#ffffff",
        blue: "#0000ff",
      },
    });
    const t = loadExternalTheme(json);
    expect(t?.palette?.text).toBe("#000000");
    expect(t?.palette?.blue).toBe("#0000ff");
    expect((t?.palette as Record<string, unknown>).bogus).toBeUndefined();
  });

  test("rejects palette values that are not non-empty strings", () => {
    const json = JSON.stringify({
      palette: {
        text: "",
        blue: 123,
        green: null,
        red: ["#ff0000"],
        yellow: "#dac832", // valid
      },
    });
    const t = loadExternalTheme(json);
    expect(t?.palette?.text).toBeUndefined();
    expect(t?.palette?.blue).toBeUndefined();
    expect(t?.palette?.green).toBeUndefined();
    expect(t?.palette?.red).toBeUndefined();
    expect(t?.palette?.yellow).toBe("#dac832");
  });

  test("invalid variant value is dropped", () => {
    const json = JSON.stringify({ name: "x", variant: "neon" });
    const t = loadExternalTheme(json);
    expect(t?.name).toBe("x");
    expect(t?.variant).toBeUndefined();
  });

  test("name-only object is accepted (preserves label even if no palette)", () => {
    const t = loadExternalTheme(JSON.stringify({ name: "label-only" }));
    expect(t?.name).toBe("label-only");
    expect(t?.palette).toBeUndefined();
  });

  test("loaded partial composes with resolveTheme over the default builtin", () => {
    const partial = loadExternalTheme(JSON.stringify({
      name: "test",
      palette: { text: "#abcdef", blue: "#012345" },
    }));
    expect(partial).not.toBeNull();
    const resolved = resolveTheme(partial!);
    // overrides
    expect(resolved.palette.text).toBe("#abcdef");
    expect(resolved.palette.blue).toBe("#012345");
    // unspecified tokens fall through to default (catppuccin-mocha)
    const mocha = BUILTIN_THEMES["catppuccin-mocha"]!;
    expect(resolved.palette.green).toBe(mocha.palette.green);
    expect(resolved.palette.red).toBe(mocha.palette.red);
    expect(resolved.palette.surface0).toBe(mocha.palette.surface0);
  });

  test("status and icons pass through verbatim when present", () => {
    const json = JSON.stringify({
      name: "x",
      status: { running: "#ff0000", done: "#00ff00" },
      icons: { running: "*", done: "+" },
    });
    const t = loadExternalTheme(json);
    expect(t?.status?.running).toBe("#ff0000");
    expect(t?.icons?.done).toBe("+");
  });
});
