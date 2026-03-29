"use client";

import type { LucideIcon } from "lucide-react";
import {
  X,
  RotateCcw,
  Palette,
  Type,
  MousePointer2,
  LayoutTemplate,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Droplets,
  Waves,
  Box,
  Hexagon,
  Orbit,
  Gem,
  Flame,
  Sparkles,
  Zap,
  CircleDot,
  Cpu,
  Rocket,
  Mountain,
  Ghost,
  Wind,
} from "lucide-react";
import {
  useUIPreferencesStore,
  type AppearanceMode,
  type BackdropPreset,
  type NeonThemeId,
} from "@/store/uiPreferencesStore";
import { useShellStore } from "@/store/shellStore";
import { cn } from "@/lib/utils";

const PRESETS = [
  { name: "Ocean", primary: "#0ea5e9", secondary: "#6366f1" },
  { name: "Violet", primary: "#8b5cf6", secondary: "#ec4899" },
  { name: "Forest", primary: "#10b981", secondary: "#14b8a6" },
  { name: "Amber", primary: "#f59e0b", secondary: "#ef4444" },
  { name: "Slate Pro", primary: "#64748b", secondary: "#3b82f6" },
  { name: "Cyber Mint", primary: "#00d4aa", secondary: "#7c3aed" },
  { name: "Solar Flare", primary: "#f97316", secondary: "#ec4899" },
  { name: "Deep Space", primary: "#6366f1", secondary: "#06b6d4" },
  { name: "Rose Quartz", primary: "#f472b6", secondary: "#a78bfa" },
  { name: "Noir Gold", primary: "#d4af37", secondary: "#1e3a5f" },
  { name: "Chromium", primary: "#38bdf8", secondary: "#94a3b8" },
  { name: "Blood Moon", primary: "#dc2626", secondary: "#7c2d12" },
  { name: "Electric Lime", primary: "#bef264", secondary: "#4c1d95" },
  { name: "Arctic", primary: "#22d3ee", secondary: "#e0f2fe" },
  { name: "Royal Ink", primary: "#312e81", secondary: "#c084fc" },
];

const BACKDROP_OPTIONS: { id: BackdropPreset; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "classic", label: "Classic", hint: "Grid + soft glow", icon: LayoutGrid },
  { id: "frosted", label: "Liquid glass", hint: "Frosted planes", icon: Droplets },
  { id: "aurora", label: "Aurora", hint: "Drifting chroma", icon: Waves },
  { id: "depth3d", label: "3D horizon", hint: "Perspective grid", icon: Box },
  { id: "neonPrism", label: "Neon prism", hint: "Diagonal beams", icon: Hexagon },
  { id: "voidLux", label: "Void lux", hint: "Starfield haze", icon: Orbit },
  { id: "stone3d", label: "3D stone", hint: "Relief layers (CSS)", icon: Mountain },
  { id: "obsidianFlow", label: "Obsidian flow", hint: "Slow obsidian drift", icon: Wind },
  { id: "blackMarbleWaves", label: "Black marble waves", hint: "Marble sheen", icon: Waves },
  { id: "eclipseCore", label: "Eclipse core", hint: "Corona pulse", icon: CircleDot },
  { id: "abyssalFracture", label: "Abyssal fracture", hint: "Sharp light cracks", icon: Zap },
  { id: "shadowTerrain", label: "Shadow terrain", hint: "Low silhouettes", icon: Mountain },
  { id: "neonPhantom", label: "Neon phantom", hint: "Magenta / cyan mist", icon: Ghost },
  { id: "darkEnergyDragon", label: "Dark energy dragon", hint: "Coiling ribbons", icon: Flame },
  { id: "abyssWalker", label: "Abyss walker", hint: "Deep trench sweep", icon: Gem },
  { id: "cyberMesh", label: "Cyber Mesh", hint: "3D perspective grid", icon: LayoutGrid },
  { id: "cosmicNebula", label: "Cosmic Nebula", hint: "Floating 3D stars", icon: Sparkles },
  { id: "glassGeometry", label: "Glass Geometry", hint: "Forged glass shapes", icon: Box },
  { id: "neuralFlow", label: "Neural Flow", hint: "Drifting neural energy", icon: Zap },
  { id: "cyberCircuit", label: "Cyber Circuit", hint: "Glowing logic paths", icon: Cpu },
  { id: "warpTunnel", label: "Warp Tunnel", hint: "Hyper-speed travel", icon: Rocket },
];

const NEON_PACKS: {
  id: NeonThemeId;
  label: string;
  hint: string;
  vibe: "Classy" | "Wild";
  primary?: string;
  secondary?: string;
}[] = [
  { id: "off", label: "Off", hint: "No extra neon rim", vibe: "Classy" },
  { id: "electricOrchid", label: "Electric orchid", hint: "Violet + rose rim", vibe: "Classy", primary: "#c084fc", secondary: "#f472b6" },
  { id: "tokyoVoltage", label: "Tokyo voltage", hint: "Cyan / magenta buzz", vibe: "Wild", primary: "#22d3ee", secondary: "#f472b6" },
  { id: "miamiInferno", label: "Miami inferno", hint: "Sunset rails", vibe: "Wild", primary: "#fb7185", secondary: "#fbbf24" },
  { id: "toxicLagoon", label: "Toxic lagoon", hint: "Acid lime edge", vibe: "Wild", primary: "#4ade80", secondary: "#10b981" },
  { id: "royalPlasma", label: "Royal plasma", hint: "Gold + sapphire", vibe: "Classy", primary: "#3b82f6", secondary: "#facc15" },
  { id: "bloodCircuit", label: "Blood circuit", hint: "Crimson pulse", vibe: "Wild", primary: "#f87171", secondary: "#b91c1c" },
  { id: "frostWire", label: "Frost wire", hint: "Ice + silver", vibe: "Classy", primary: "#7dd3fc", secondary: "#e2e8f0" },
  { id: "solarNitro", label: "Solar nitro", hint: "Amber fusion", vibe: "Wild", primary: "#fb923c", secondary: "#facc15" },
  { id: "voidRose", label: "Void rose", hint: "Deep purple bloom", vibe: "Classy", primary: "#e879f9", secondary: "#6d28d9" },
  { id: "chromeRush", label: "Chrome rush", hint: "Silver electric", vibe: "Wild", primary: "#38bdf8", secondary: "#e2e8f0" },
];

export function AppearancePanel({ onToast }: { onToast?: (m: string, t?: "success" | "error") => void }) {
  const open = useShellStore((s) => s.appearanceOpen);
  const setOpen = useShellStore((s) => s.setAppearanceOpen);

  const {
    appearanceMode,
    primaryHex,
    secondaryHex,
    surfacePreset,
    backdropPreset,
    neonTheme,
    fontScale,
    density,
    buttonShape,
    buttonSize,
    headingFont,
    setAppearanceMode,
    setPrimaryHex,
    setSecondaryHex,
    setBackdropPreset,
    setNeonTheme,
    setSurfacePreset,
    setFontScale,
    setDensity,
    setButtonShape,
    setButtonSize,
    setHeadingFont,
    resetAppearance,
  } = useUIPreferencesStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-stretch justify-end backdrop-blur-[3px] sm:justify-center sm:items-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.42)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="appearance-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative flex h-full w-full flex-col shadow-2xl animate-fadeUp sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--panel) 92%, transparent)",
          backdropFilter: "blur(20px) saturate(1.35)",
          WebkitBackdropFilter: "blur(20px) saturate(1.35)",
          border: "1px solid var(--border2)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border2)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--blue), var(--violet))" }}>
               <Palette size={18} className="text-white" />
            </div>
            <h2 id="appearance-title" className="font-heading font-black text-[18px] uppercase tracking-tighter" style={{ color: "var(--text)" }}>
              Forge <span className="text-blue-500">Settings</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "var(--text2)" }}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ scrollbarColor: "rgba(var(--primary-rgb, 59 130 246) / 0.25) transparent" }}>
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              <Sun size={12} /> Theme
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "light" as AppearanceMode, icon: Sun, label: "Light" },
                  { id: "dark" as AppearanceMode, icon: Moon, label: "Dark" },
                  { id: "system" as AppearanceMode, icon: Monitor, label: "System" },
                ] as const
              ).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAppearanceMode(id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold border transition-all",
                  )}
                  style={{
                    borderColor: appearanceMode === id ? "var(--blue)" : "var(--border2)",
                    background: appearanceMode === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                    color: appearanceMode === id ? "var(--blue)" : "var(--text2)",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Atmosphere & Neural Backdrops
            </div>
            <p className="text-[10px] leading-relaxed opacity-60" style={{ color: "var(--text3)" }}>
              Hardware-accelerated 3D environments. FluxForge renders these using GPU-optimized CSS transforms and neural gradients.
            </p>
            <div className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-3">
              {BACKDROP_OPTIONS.map(({ id, label, hint, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBackdropPreset(id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition-all",
                  )}
                  style={{
                    borderColor: backdropPreset === id ? "var(--blue)" : "var(--border2)",
                    background:
                      backdropPreset === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                  }}
                >
                  <Icon size={15} style={{ color: backdropPreset === id ? "var(--blue)" : "var(--text2)" }} />
                  <span
                    className="text-[11px] font-bold leading-tight"
                    style={{ color: backdropPreset === id ? "var(--blue)" : "var(--text)" }}
                  >
                    {label}
                  </span>
                  <span className="text-[9px] leading-snug" style={{ color: "var(--text3)" }}>
                    {hint}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500">
              <Sparkles size={12} /> Plasma Rim Themes
            </div>
            <p className="text-[10px] leading-relaxed opacity-60" style={{ color: "var(--text3)" }}>
              High-frequency neon energy applied to glass surfaces and forged controls.
            </p>
            <div className="grid max-h-[280px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {NEON_PACKS.map((pack) => {
                const active = (neonTheme ?? "off") === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setNeonTheme(pack.id);
                      if (pack.primary) setPrimaryHex(pack.primary);
                      if (pack.secondary) setSecondaryHex(pack.secondary);
                    }}
                    className="flex flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition-all"
                    style={{
                      borderColor: active ? "var(--violet)" : "var(--border2)",
                      background: active ? "rgba(var(--secondary-rgb, 139 92 246) / 0.12)" : "var(--bg2)",
                    }}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-[11px] font-bold" style={{ color: active ? "var(--violet)" : "var(--text)" }}>
                        {pack.label}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase"
                        style={{ color: pack.vibe === "Wild" ? "var(--pink)" : "var(--text3)" }}
                      >
                        {pack.vibe}
                      </span>
                    </span>
                    <span className="text-[9px] leading-snug" style={{ color: "var(--text3)" }}>
                      {pack.hint}
                    </span>
                    {pack.primary && (
                      <span className="flex gap-1 pt-0.5">
                        <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: pack.primary }} />
                        <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: pack.secondary }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Color presets
            </div>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-0.5 sm:max-h-48">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPrimaryHex(p.primary);
                    setSecondaryHex(p.secondary);
                  }}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium"
                  style={{
                    borderColor: "var(--border2)",
                    background: "var(--bg2)",
                    color: "var(--text)",
                  }}
                >
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.primary }} />
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.secondary }} />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="appearance-tool-label">Primary</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="w-10 h-9 rounded-lg border cursor-pointer p-0"
                    style={{ borderColor: "var(--border2)" }}
                  />
                  <input
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="input-ring flex-1 rounded-lg px-2 py-1.5 text-[11px] font-mono min-w-0"
                    style={{ background: "var(--bg3)", color: "var(--text)" }}
                  />
                </div>
              </label>
              <label className="space-y-1">
                <span className="appearance-tool-label">Secondary</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="w-10 h-9 rounded-lg border cursor-pointer p-0"
                    style={{ borderColor: "var(--border2)" }}
                  />
                  <input
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="input-ring flex-1 rounded-lg px-2 py-1.5 text-[11px] font-mono min-w-0"
                    style={{ background: "var(--bg3)", color: "var(--text)" }}
                  />
                </div>
              </label>
            </div>
            <div>
              <span className="appearance-tool-label block mb-1">Background mood</span>
              <select
                value={surfacePreset}
                onChange={(e) => setSurfacePreset(e.target.value as typeof surfacePreset)}
                className="input-ring w-full rounded-xl px-3 py-2 text-[12px]"
                style={{ background: "var(--bg3)", color: "var(--text)", borderColor: "var(--border2)" }}
              >
                <option value="default">Balanced</option>
                <option value="cool">Cool tint</option>
                <option value="warm">Warm tint</option>
                <option value="neutral">Neutral gray</option>
              </select>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              <Type size={12} /> Typography
            </div>
            <div>
              <span className="appearance-tool-label block mb-1">Base font size</span>
              <div className="grid grid-cols-3 gap-2">
                {(["sm", "md", "lg"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFontScale(id)}
                    className="py-2 rounded-xl text-[11px] font-semibold border capitalize"
                    style={{
                      borderColor: fontScale === id ? "var(--blue)" : "var(--border2)",
                      background: fontScale === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                      color: fontScale === id ? "var(--blue)" : "var(--text2)",
                    }}
                  >
                    {id === "sm" ? "Small" : id === "md" ? "Medium" : "Large"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="appearance-tool-label block mb-1">Heading font</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHeadingFont("syne")}
                  className="py-2 rounded-xl text-[11px] font-semibold border font-syne"
                  style={{
                    borderColor: headingFont === "syne" ? "var(--blue)" : "var(--border2)",
                    background: headingFont === "syne" ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                    color: headingFont === "syne" ? "var(--blue)" : "var(--text2)",
                  }}
                >
                  Syne
                </button>
                <button
                  type="button"
                  onClick={() => setHeadingFont("dm")}
                  className="py-2 rounded-xl text-[11px] font-semibold border"
                  style={{
                    borderColor: headingFont === "dm" ? "var(--blue)" : "var(--border2)",
                    background: headingFont === "dm" ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                    color: headingFont === "dm" ? "var(--blue)" : "var(--text2)",
                  }}
                >
                  DM Sans
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              <MousePointer2 size={12} /> Buttons
            </div>
            <div>
              <span className="appearance-tool-label block mb-1">Corner style</span>
              <div className="grid grid-cols-3 gap-2">
                {(["sharp", "rounded", "pill"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setButtonShape(id)}
                    className="py-2 rounded-xl text-[11px] font-semibold border capitalize"
                    style={{
                      borderColor: buttonShape === id ? "var(--blue)" : "var(--border2)",
                      background: buttonShape === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                      color: buttonShape === id ? "var(--blue)" : "var(--text2)",
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="appearance-tool-label block mb-1">Control size</span>
              <div className="grid grid-cols-3 gap-2">
                {(["sm", "md", "lg"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setButtonSize(id)}
                    className="py-2 rounded-xl text-[11px] font-semibold border uppercase"
                    style={{
                      borderColor: buttonSize === id ? "var(--blue)" : "var(--border2)",
                      background: buttonSize === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                      color: buttonSize === id ? "var(--blue)" : "var(--text2)",
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              <LayoutTemplate size={12} /> Layout density
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["comfortable", "compact"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDensity(id)}
                  className="py-2.5 rounded-xl text-[11px] font-semibold border capitalize"
                  style={{
                    borderColor: density === id ? "var(--blue)" : "var(--border2)",
                    background: density === id ? "rgba(var(--primary-rgb, 59 130 246) / 0.12)" : "var(--bg2)",
                    color: density === id ? "var(--blue)" : "var(--text2)",
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--text3)" }}>
              Preferences sync to this browser via localStorage. Signed-in cloud profiles can be added later.
            </p>
          </section>
        </div>

        <div
          className="flex gap-2 p-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border2)", background: "var(--bg2)" }}
        >
          <button
            type="button"
            onClick={() => {
              resetAppearance();
              onToast?.("Reset to defaults");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold border"
            style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: "var(--blue)", color: "#fff" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
