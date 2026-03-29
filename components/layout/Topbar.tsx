"use client";

import { Github, Rocket, RotateCcw, Sparkles, Menu, Palette, Sun, Moon, Monitor, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAppStore } from "@/store/useAppStore";
import { useShellStore } from "@/store/shellStore";
import { useUIPreferencesStore, type AppearanceMode } from "@/store/uiPreferencesStore";

export function Topbar({
  onOpenGithub,
  onOpenDeploy,
  isGuest,
}: {
  onOpenGithub?: () => void;
  onOpenDeploy?: () => void;
  /** When true, GitHub / Deploy still invoke handlers (parent shows sign-in toast). */
  isGuest?: boolean;
}) {
  const { clearAll, qualityScore, generatedCode } = useAppStore();
  const toggleMobile = useShellStore((s) => s.toggleMobileSidebar);
  const setAppearanceOpen = useShellStore((s) => s.setAppearanceOpen);
  const appearanceMode = useUIPreferencesStore((s) => s.appearanceMode);
  const setAppearanceMode = useUIPreferencesStore((s) => s.setAppearanceMode);

  const getQualityColor = (s: number) =>
    s >= 85 ? "var(--green)" : s >= 65 ? "var(--blue)" : s >= 45 ? "var(--amber)" : "var(--red)";
  const getQualityLabel = (s: number) =>
    s >= 85 ? "Excellent" : s >= 65 ? "Good" : s >= 45 ? "Fair" : "Low";

  const cycleTheme = () => {
    const order: AppearanceMode[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(appearanceMode) + 1) % order.length];
    setAppearanceMode(next);
  };

  const ThemeIcon = appearanceMode === "light" ? Sun : appearanceMode === "system" ? Monitor : Moon;

  return (
    <header
      className="glass glass-strong flex min-h-[48px] flex-wrap items-center gap-2 px-2 py-1.5 sm:min-h-[52px] sm:flex-nowrap sm:gap-3 sm:px-4 md:px-5"
      style={{ borderBottom: "1px solid var(--border2)" }}
    >
      <button
        type="button"
        onClick={toggleMobile}
        className="md:hidden ui-btn-secondary p-2 shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} style={{ color: "var(--text)" }} />
      </button>

      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:block shrink-0"
      >
        <Zap size={18} className="text-blue-500 fill-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      </motion.div>

      <div className="flex-1 min-w-0 py-2">
        <div className="font-heading font-bold text-[15px] sm:text-[16px] tracking-tight" style={{ color: "var(--text)" }}>
          FluxForge <span className="text-blue-500">AI</span>
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.15em] mt-0.5 opacity-60" style={{ color: "var(--text2)" }}>
          Neural Forge · Vision · Deploy
        </div>
      </div>

      {generatedCode && qualityScore > 0 && (
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0"
          style={{
            color: getQualityColor(qualityScore),
            borderColor: getQualityColor(qualityScore) + "44",
            background: getQualityColor(qualityScore) + "11",
            borderRadius: "var(--radius-ui)",
          }}
        >
          <span>Quality {qualityScore}%</span>
          <span className="opacity-70 font-medium hidden md:inline">({getQualityLabel(qualityScore)})</span>
        </div>
      )}

      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 hidden md:inline-flex"
        style={{
          background: "var(--blue-dim)",
          borderColor: "rgba(var(--primary-rgb, 59 130 246) / 0.25)",
          color: "var(--blue)",
        }}
      >
        Pro
      </span>

      <div className="flex items-center gap-1 sm:gap-1.5 ml-auto sm:ml-0 shrink-0">
        <UserMenu />
        <button
          type="button"
          onClick={cycleTheme}
          className="ui-btn-secondary p-2"
          title={`Theme: ${appearanceMode}`}
          aria-label={`Theme: ${appearanceMode}`}
        >
          <ThemeIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => setAppearanceOpen(true)}
          className="ui-btn-secondary p-2"
          title="Customize appearance"
          aria-label="Customize appearance"
        >
          <Palette size={15} />
        </button>
        {onOpenGithub && (
          <>
            <button
              type="button"
              onClick={onOpenGithub}
              className="ui-btn-secondary p-2 sm:hidden"
              aria-label="GitHub"
              title={isGuest ? "Sign in to use GitHub" : "GitHub sync"}
            >
              <Github size={15} />
            </button>
            <button
              type="button"
              onClick={onOpenGithub}
              className="ui-btn-secondary gap-1 hidden sm:flex items-center"
              title={isGuest ? "Sign in to use GitHub" : "GitHub sync"}
            >
              <Github size={14} />
              <span className="hidden lg:inline">GitHub</span>
            </button>
          </>
        )}
        {onOpenDeploy && (
          <>
            <button
              type="button"
              onClick={onOpenDeploy}
              className="ui-btn-secondary p-2 sm:hidden"
              aria-label="Deploy"
              title={isGuest ? "Sign in to deploy" : "Deploy"}
            >
              <Rocket size={15} />
            </button>
            <button
              type="button"
              onClick={onOpenDeploy}
              className="ui-btn-secondary gap-1 hidden sm:flex items-center"
              title={isGuest ? "Sign in to deploy" : "Deploy"}
            >
              <Rocket size={14} />
              <span className="hidden lg:inline">Deploy</span>
            </button>
          </>
        )}
        <button type="button" onClick={clearAll} className="ui-btn-secondary gap-1 flex items-center">
          <RotateCcw size={14} />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
