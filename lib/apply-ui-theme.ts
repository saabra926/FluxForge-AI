import {
  BACKDROP_PRESET_LIST,
  type AppearanceMode,
  type BackdropPreset,
  type ButtonShape,
  type ButtonSize,
  type Density,
  type FontScale,
  type HeadingFont,
  type NeonThemeId,
  type UIPreferencesState,
} from "@/store/uiPreferencesStore";

export function resolveAppearance(appearanceMode: AppearanceMode): "light" | "dark" {
  if (appearanceMode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return appearanceMode === "light" ? "light" : "dark";
}

function fontScaleToPx(scale: FontScale): string {
  switch (scale) {
    case "sm":
      return "14px";
    case "lg":
      return "16px";
    default:
      return "15px";
  }
}

function densityVars(density: Density): Record<string, string> {
  if (density === "compact") {
    return {
      "--density-nav-pad": "0.5rem",
      "--density-nav-gap": "0.125rem",
      "--density-section-gap": "1rem",
      "--density-card-pad": "0.75rem",
      "--sidebar-w": "14rem",
    };
  }
  return {
    "--density-nav-pad": "0.625rem",
    "--density-nav-gap": "0.25rem",
    "--density-section-gap": "1.25rem",
    "--density-card-pad": "1rem",
    "--sidebar-w": "15.75rem",
  };
}

function buttonShapeToRadius(shape: ButtonShape): string {
  switch (shape) {
    case "sharp":
      return "6px";
    case "pill":
      return "9999px";
    default:
      return "12px";
  }
}

function buttonSizeVars(size: ButtonSize): Record<string, string> {
  switch (size) {
    case "sm":
      return { "--btn-pad-x": "0.625rem", "--btn-pad-y": "0.375rem", "--btn-font": "0.6875rem" };
    case "lg":
      return { "--btn-pad-x": "1.125rem", "--btn-pad-y": "0.625rem", "--btn-font": "0.8125rem" };
    default:
      return { "--btn-pad-x": "0.875rem", "--btn-pad-y": "0.5rem", "--btn-font": "0.75rem" };
  }
}

function headingFamily(headingFont: HeadingFont): string {
  return headingFont === "dm"
    ? "var(--font-dm-sans), system-ui, sans-serif"
    : "var(--font-syne), system-ui, sans-serif";
}

/** Applies persisted UI preferences to :root. Safe to call on server (no-op without document). */
export function applyUIPreferencesToDocument(prefs: UIPreferencesState): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const theme = resolveAppearance(prefs.appearanceMode);
  root.setAttribute("data-theme", theme);

  root.style.setProperty("--user-primary", prefs.primaryHex);
  root.style.setProperty("--user-secondary", prefs.secondaryHex);
  root.style.setProperty("--blue", prefs.primaryHex);
  root.style.setProperty("--violet", prefs.secondaryHex);

  const primaryRgb = hexToRgbTuple(prefs.primaryHex);
  const secondaryRgb = hexToRgbTuple(prefs.secondaryHex);
  if (primaryRgb) {
    root.style.setProperty("--primary-rgb", `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
    root.style.setProperty("--blue-dim", `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.14)`);
    root.style.setProperty("--glow-blue", `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.22)`);
  }
  if (secondaryRgb) {
    root.style.setProperty("--secondary-rgb", `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`);
    root.style.setProperty("--glow-purple", `rgba(${secondaryRgb.r},${secondaryRgb.g},${secondaryRgb.b},0.18)`);
  }

  root.style.setProperty("--text-base-size", fontScaleToPx(prefs.fontScale));
  root.style.setProperty("--radius-ui", buttonShapeToRadius(prefs.buttonShape));
  root.style.setProperty("--font-heading-family", headingFamily(prefs.headingFont));

  const d = densityVars(prefs.density);
  Object.entries(d).forEach(([k, v]) => root.style.setProperty(k, v));

  const b = buttonSizeVars(prefs.buttonSize);
  Object.entries(b).forEach(([k, v]) => root.style.setProperty(k, v));

  root.dataset.surfacePreset = prefs.surfacePreset;

  const backdrop: BackdropPreset = BACKDROP_PRESET_LIST.includes(prefs.backdropPreset as BackdropPreset)
    ? (prefs.backdropPreset as BackdropPreset)
    : "classic";
  root.setAttribute("data-backdrop", backdrop);

  const neonRaw = prefs.neonTheme ?? "off";
  const neon: NeonThemeId = neonRaw !== "off" ? neonRaw : "off";
  root.setAttribute("data-neon", neon);
}


export function hexToRgbTuple(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0]!, 16);
    const g = parseInt(h[1]! + h[1]!, 16);
    const b = parseInt(h[2]! + h[2]!, 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}
