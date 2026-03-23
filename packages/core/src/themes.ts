import type { AgentStatus } from "./contracts/agent";

export interface ThemePalette {
  blue: string;
  lavender: string;
  pink: string;
  mauve: string;
  yellow: string;
  green: string;
  red: string;
  peach: string;
  teal: string;
  sky: string;
  text: string;
  subtext0: string;
  subtext1: string;
  overlay0: string;
  overlay1: string;
  surface0: string;
  surface1: string;
  surface2: string;
  base: string;
  mantle: string;
  crust: string;
}

export interface Theme {
  palette: ThemePalette;
  status: Record<AgentStatus, string>;
  icons: Record<AgentStatus, string>;
}

// --- Builtin themes ---

const CATPPUCCIN_MOCHA: Theme = {
  palette: {
    blue: "#89b4fa", lavender: "#b4befe", pink: "#cba6f7", mauve: "#cba6f7",
    yellow: "#f9e2af", green: "#a6e3a1", red: "#f38ba8", peach: "#fab387",
    teal: "#94e2d5", sky: "#89dceb", text: "#cdd6f4", subtext0: "#a6adc8",
    subtext1: "#bac2de", overlay0: "#6c7086", overlay1: "#7f849c",
    surface0: "#313244", surface1: "#45475a", surface2: "#585b70",
    base: "#1e1e2e", mantle: "#181825", crust: "#11111b",
  },
  status: {
    idle: "#585b70", running: "#f9e2af", done: "#a6e3a1",
    error: "#f38ba8", waiting: "#89b4fa", interrupted: "#fab387",
  },
  icons: {
    idle: "○", running: "●", done: "✓",
    error: "✗", waiting: "◉", interrupted: "⚠",
  },
};

const CATPPUCCIN_LATTE: Theme = {
  palette: {
    blue: "#1e66f5", lavender: "#7287fd", pink: "#ea76cb", mauve: "#8839ef",
    yellow: "#df8e1d", green: "#40a02b", red: "#d20f39", peach: "#fe640b",
    teal: "#179299", sky: "#04a5e5", text: "#4c4f69", subtext0: "#6c6f85",
    subtext1: "#5c5f77", overlay0: "#9ca0b0", overlay1: "#8c8fa1",
    surface0: "#ccd0da", surface1: "#bcc0cc", surface2: "#acb0be",
    base: "#eff1f5", mantle: "#e6e9ef", crust: "#dce0e8",
  },
  status: {
    idle: "#acb0be", running: "#df8e1d", done: "#40a02b",
    error: "#d20f39", waiting: "#1e66f5", interrupted: "#fe640b",
  },
  icons: CATPPUCCIN_MOCHA.icons,
};

const TOKYO_NIGHT: Theme = {
  palette: {
    blue: "#7aa2f7", lavender: "#bb9af7", pink: "#bb9af7", mauve: "#bb9af7",
    yellow: "#e0af68", green: "#9ece6a", red: "#f7768e", peach: "#ff9e64",
    teal: "#73daca", sky: "#7dcfff", text: "#c0caf5", subtext0: "#a9b1d6",
    subtext1: "#9aa5ce", overlay0: "#565f89", overlay1: "#414868",
    surface0: "#24283b", surface1: "#292e42", surface2: "#343a52",
    base: "#1a1b26", mantle: "#16161e", crust: "#13131a",
  },
  status: {
    idle: "#343a52", running: "#e0af68", done: "#9ece6a",
    error: "#f7768e", waiting: "#7aa2f7", interrupted: "#ff9e64",
  },
  icons: CATPPUCCIN_MOCHA.icons,
};

const GRUVBOX_DARK: Theme = {
  palette: {
    blue: "#83a598", lavender: "#d3869b", pink: "#d3869b", mauve: "#d3869b",
    yellow: "#fabd2f", green: "#b8bb26", red: "#fb4934", peach: "#fe8019",
    teal: "#8ec07c", sky: "#83a598", text: "#ebdbb2", subtext0: "#d5c4a1",
    subtext1: "#bdae93", overlay0: "#665c54", overlay1: "#7c6f64",
    surface0: "#3c3836", surface1: "#504945", surface2: "#665c54",
    base: "#282828", mantle: "#1d2021", crust: "#1b1b1b",
  },
  status: {
    idle: "#665c54", running: "#fabd2f", done: "#b8bb26",
    error: "#fb4934", waiting: "#83a598", interrupted: "#fe8019",
  },
  icons: CATPPUCCIN_MOCHA.icons,
};

const NORD: Theme = {
  palette: {
    blue: "#81a1c1", lavender: "#b48ead", pink: "#b48ead", mauve: "#b48ead",
    yellow: "#ebcb8b", green: "#a3be8c", red: "#bf616a", peach: "#d08770",
    teal: "#8fbcbb", sky: "#88c0d0", text: "#eceff4", subtext0: "#d8dee9",
    subtext1: "#e5e9f0", overlay0: "#4c566a", overlay1: "#434c5e",
    surface0: "#3b4252", surface1: "#434c5e", surface2: "#4c566a",
    base: "#2e3440", mantle: "#272c36", crust: "#242933",
  },
  status: {
    idle: "#4c566a", running: "#ebcb8b", done: "#a3be8c",
    error: "#bf616a", waiting: "#81a1c1", interrupted: "#d08770",
  },
  icons: CATPPUCCIN_MOCHA.icons,
};

export const BUILTIN_THEMES: Record<string, Theme> = {
  "catppuccin-mocha": CATPPUCCIN_MOCHA,
  "catppuccin-latte": CATPPUCCIN_LATTE,
  "tokyo-night": TOKYO_NIGHT,
  "gruvbox-dark": GRUVBOX_DARK,
  "nord": NORD,
};

export const DEFAULT_THEME = "catppuccin-mocha";

/** Partial theme for user overrides — any field can be omitted */
export type PartialTheme = {
  palette?: Partial<ThemePalette>;
  status?: Partial<Record<AgentStatus, string>>;
  icons?: Partial<Record<AgentStatus, string>>;
};

/**
 * Resolve a theme from config.
 * @param themeConfig — string name of builtin, partial inline object, or undefined for default
 */
export function resolveTheme(themeConfig: string | PartialTheme | undefined): Theme {
  const base = BUILTIN_THEMES[DEFAULT_THEME];

  if (!themeConfig) return base;

  if (typeof themeConfig === "string") {
    return BUILTIN_THEMES[themeConfig] ?? base;
  }

  // Merge partial inline theme over default
  return {
    palette: { ...base.palette, ...themeConfig.palette },
    status: { ...base.status, ...themeConfig.status },
    icons: { ...base.icons, ...themeConfig.icons },
  };
}
