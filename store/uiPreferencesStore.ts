"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppearanceMode = "light" | "dark" | "system";
export type Density = "compact" | "comfortable";
export type ButtonShape = "sharp" | "rounded" | "pill";
export type ButtonSize = "sm" | "md" | "lg";
export type FontScale = "sm" | "md" | "lg";
export type HeadingFont = "syne" | "dm";

/** Full-screen atmosphere (CSS + compositor-friendly motion; light GPU). */
export type BackdropPreset =
  | "classic"
  | "frosted"
  | "aurora"
  | "depth3d"
  | "neonPrism"
  | "voidLux"
  | "stone3d"
  | "obsidianFlow"
  | "blackMarbleWaves"
  | "eclipseCore"
  | "abyssalFracture"
  | "shadowTerrain"
  | "neonPhantom"
  | "darkEnergyDragon"
  | "abyssWalker"
  | "cyberMesh"
  | "cosmicNebula"
  | "glassGeometry"
  | "neuralFlow"
  | "cyberCircuit"
  | "warpTunnel";

/** Neon rim / glow accents (works with any color preset). */
export type NeonThemeId =
  | "off"
  | "electricOrchid"
  | "tokyoVoltage"
  | "miamiInferno"
  | "toxicLagoon"
  | "royalPlasma"
  | "bloodCircuit"
  | "frostWire"
  | "solarNitro"
  | "voidRose"
  | "chromeRush";

export const BACKDROP_PRESET_LIST: BackdropPreset[] = [
  "classic",
  "frosted",
  "aurora",
  "depth3d",
  "neonPrism",
  "voidLux",
  "stone3d",
  "obsidianFlow",
  "blackMarbleWaves",
  "eclipseCore",
  "abyssalFracture",
  "shadowTerrain",
  "neonPhantom",
  "darkEnergyDragon",
  "abyssWalker",
  "cyberMesh",
  "cosmicNebula",
  "glassGeometry",
  "neuralFlow",
  "cyberCircuit",
  "warpTunnel",
];

export const UI_PREFERENCE_DEFAULTS = {
  appearanceMode: "dark" as AppearanceMode,
  primaryHex: "#3b82f6",
  secondaryHex: "#8b5cf6",
  backdropPreset: "classic" as BackdropPreset,
  neonTheme: "off" as NeonThemeId,
  surfacePreset: "default" as "default" | "cool" | "warm" | "neutral",
  fontScale: "md" as FontScale,
  density: "comfortable" as Density,
  buttonShape: "rounded" as ButtonShape,
  buttonSize: "md" as ButtonSize,
  headingFont: "syne" as HeadingFont,
};

export type UIPreferencesState = typeof UI_PREFERENCE_DEFAULTS;

type Store = UIPreferencesState & {
  setAppearanceMode: (v: AppearanceMode) => void;
  setPrimaryHex: (v: string) => void;
  setSecondaryHex: (v: string) => void;
  setBackdropPreset: (v: BackdropPreset) => void;
  setNeonTheme: (v: NeonThemeId) => void;
  setSurfacePreset: (v: UIPreferencesState["surfacePreset"]) => void;
  setFontScale: (v: FontScale) => void;
  setDensity: (v: Density) => void;
  setButtonShape: (v: ButtonShape) => void;
  setButtonSize: (v: ButtonSize) => void;
  setHeadingFont: (v: HeadingFont) => void;
  resetAppearance: () => void;
};

export const useUIPreferencesStore = create<Store>()(
  persist(
    (set) => ({
      ...UI_PREFERENCE_DEFAULTS,
      setAppearanceMode: (appearanceMode) => set({ appearanceMode }),
      setPrimaryHex: (primaryHex) => set({ primaryHex }),
      setSecondaryHex: (secondaryHex) => set({ secondaryHex }),
      setBackdropPreset: (backdropPreset) => set({ backdropPreset }),
      setNeonTheme: (neonTheme) => set({ neonTheme }),
      setSurfacePreset: (surfacePreset) => set({ surfacePreset }),
      setFontScale: (fontScale) => set({ fontScale }),
      setDensity: (density) => set({ density }),
      setButtonShape: (buttonShape) => set({ buttonShape }),
      setButtonSize: (buttonSize) => set({ buttonSize }),
      setHeadingFont: (headingFont) => set({ headingFont }),
      resetAppearance: () => set({ ...UI_PREFERENCE_DEFAULTS }),
    }),
    {
      name: "ui-codegen-appearance",
      partialize: (s) => ({
        appearanceMode: s.appearanceMode,
        primaryHex: s.primaryHex,
        secondaryHex: s.secondaryHex,
        backdropPreset: s.backdropPreset,
        neonTheme: s.neonTheme,
        surfacePreset: s.surfacePreset,
        fontScale: s.fontScale,
        density: s.density,
        buttonShape: s.buttonShape,
        buttonSize: s.buttonSize,
        headingFont: s.headingFont,
      }),
    },
  ),
);
