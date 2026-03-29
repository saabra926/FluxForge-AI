"use client";
import type { ReactNode } from "react";
import {
  Zap,
  Clock,
  Target,
  Server,
  Layers,
  LineChart,
  Globe,
  Smartphone,
  LayoutGrid,
  LayoutTemplate,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useShellStore } from "@/store/shellStore";
import { cn } from "@/lib/utils";
import type { GenerationCategory } from "@/types";

export function Sidebar({
  isGuest,
  onGuestAction,
}: {
  isGuest?: boolean;
  onGuestAction?: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const {
    config,
    setMode,
    setOutputView,
    setInputTab,
    history,
    activeInputTab,
    activeOutputView,
    updateConfig,
  } = useAppStore();
  const mobileOpen = useShellStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useShellStore((s) => s.setMobileSidebarOpen);

  const closeMobile = () => setMobileOpen(false);

  const goWebFrontend = () => {
    patchCategory("Website Development");
    setInputTab("input");
    setOutputView("pipeline");
    closeMobile();
  };

  const goWebBackend = () => {
    patchCategory("Backend");
    setInputTab("backend");
    setOutputView("backend");
    closeMobile();
  };

  const goAppReactNative = () => {
    patchCategory("React Native Application");
    setInputTab("input");
    setOutputView("pipeline");
    closeMobile();
  };

  const goAppFlutter = () => {
    patchCategory("Flutter Application");
    setInputTab("input");
    setOutputView("pipeline");
    closeMobile();
  };

  const goAppFrontend = () => {
    patchCategory("Frontend");
    setInputTab("input");
    setOutputView("pipeline");
    closeMobile();
  };

  const goAppBackend = () => {
    patchCategory("Backend");
    setInputTab("backend");
    setOutputView("backend");
    closeMobile();
  };

  const patchCategory = (category: GenerationCategory) => {
    updateConfig({
      category,
      framework: undefined,
      language: undefined,
      projectType: undefined,
      a11y: undefined,
      styling: [],
      includeHtml: false,
      backendFramework: undefined,
      database: undefined,
      dataStoreKind: undefined,
      apiStyle: undefined,
    });
  };

  const isWebFE = config.category === "Website Development" && activeInputTab !== "backend";
  const isWebBE = config.category === "Backend" && activeInputTab === "backend";
  const isRn = config.category === "React Native Application";
  const isFlutter = config.category === "Flutter Application";
  const isAppFe = config.category === "Frontend" && activeInputTab !== "backend";
  const isAppBe = config.category === "Backend" && activeInputTab === "backend";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] transition-opacity md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "hidden",
        )}
        aria-hidden={!mobileOpen}
        onClick={closeMobile}
      />

      <aside
        className={cn(
          "fixed z-[90] inset-y-0 left-0 flex flex-col w-[min(18.5rem,100vw)] max-w-[100vw] md:relative md:z-auto md:w-[var(--sidebar-w,15.75rem)] md:min-w-[var(--sidebar-w,15.75rem)] md:max-w-none md:flex-shrink-0",
          "transform transition-transform duration-200 ease-out md:transform-none safe-pb",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
          !mobileOpen && "max-md:pointer-events-none",
        )}
        style={{
          background: "color-mix(in srgb, var(--panel) 75%, transparent)",
          backdropFilter: "blur(16px)",
          borderRight: "1px solid var(--border2)",
        }}
        aria-label="Main navigation"
      >
        <div
          className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black font-heading shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-110 hover:rotate-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)" }}
          >
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div className="min-w-0">
            <div className="font-heading font-bold text-[15px] tracking-tight leading-none" style={{ color: "var(--text)" }}>
              FluxForge <span className="text-blue-500">AI</span>
            </div>
            <div className="text-[10px] mt-1 font-medium opacity-60 uppercase tracking-widest" style={{ color: "var(--text2)" }}>
              Design Engine
            </div>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto p-3 space-y-[var(--density-section-gap)]"
          style={{ paddingTop: "var(--density-nav-pad)" }}
        >
          <NavSection icon={<Globe size={13} />} label="Website development">
            <NavItem
              icon={<Layers size={14} />}
              label="Frontend"
              active={isWebFE && activeOutputView !== "seo" && activeOutputView !== "history"}
              onClick={goWebFrontend}
            />
            <NavItem
              icon={<Server size={14} />}
              label="Backend"
              active={isWebBE}
              onClick={goWebBackend}
            />
          </NavSection>

          <NavSection icon={<Smartphone size={13} />} label="Application development">
            <NavItem
              icon={<LayoutGrid size={14} />}
              label="React Native"
              active={isRn}
              onClick={goAppReactNative}
            />
            <NavItem icon={<Layers size={14} />} label="Flutter" active={isFlutter} onClick={goAppFlutter} />
            <NavItem
              icon={<Layers size={14} />}
              label="Frontend"
              active={isAppFe && !isRn && !isFlutter}
              onClick={goAppFrontend}
            />
            <NavItem icon={<Server size={14} />} label="Backend" active={isAppBe} onClick={goAppBackend} />
          </NavSection>

          <NavSection icon={<Zap size={13} />} label="Generation mode">
            <NavItem icon={<Zap size={14} />} label="Fast" active={config.mode === "fast"} onClick={() => setMode("fast")} />
            <NavItem icon={<Target size={14} />} label="Balanced" active={config.mode === "balanced"} onClick={() => setMode("balanced")} />
            <NavItem icon={<Target size={14} />} label="Accurate" active={config.mode === "accurate"} onClick={() => setMode("accurate")} />
          </NavSection>

          <NavSection icon={<LayoutTemplate size={13} />} label="Discover">
            <NavItem
              icon={<LayoutTemplate size={14} />}
              label="Template library"
              href="/templates"
              onClick={closeMobile}
            />
            <NavItem
              icon={<BookOpen size={14} />}
              label="User guide"
              href="/guide"
              onClick={closeMobile}
            />
          </NavSection>

          <NavSection icon={<Clock size={13} />} label="Library">
            <NavItem
              icon={<Clock size={14} />}
              label="History"
              badge={!isGuest && history.length > 0 ? String(history.length) : undefined}
              active={activeOutputView === "history"}
              onClick={() => {
                if (isGuest) {
                  onGuestAction?.("Sign in to save and view generation history.", "info");
                  closeMobile();
                  return;
                }
                setInputTab("input");
                setOutputView("history");
                closeMobile();
              }}
            />
            <NavItem
              icon={<LineChart size={14} />}
              label="SEO & Analytics"
              active={activeOutputView === "seo"}
              onClick={() => {
                if (isGuest) {
                  onGuestAction?.("Sign in to use SEO & PageSpeed analytics.", "info");
                  closeMobile();
                  return;
                }
                setInputTab("input");
                setOutputView("seo");
                closeMobile();
              }}
            />
          </NavSection>
        </nav>

        <div className="p-3 flex-shrink-0 safe-pb" style={{ borderTop: "1px solid var(--border)" }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--green-dim)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 animate-glowPulse"
              style={{ background: "var(--green)" }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "var(--green)" }}>
              Systems operational
            </span>
          </div>
          <div className="text-[10px] mt-2 px-1 leading-snug" style={{ color: "var(--text3)" }}>
            OpenAI · MongoDB · GitHub sync
          </div>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] font-bold px-2 mb-2"
        style={{ color: "var(--text3)" }}
      >
        {icon}
        {label}
      </div>
      <div className="space-y-[var(--density-nav-gap)]">{children}</div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
  href,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      {active && (
        <motion.div
          layoutId="nav-active-bg"
          className="absolute inset-0 bg-blue-500/5 z-0"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className={cn("relative z-10 transition-transform duration-300 group-hover:scale-110", active && "text-blue-500")}>
        {icon}
      </div>
      <span className="flex-1 truncate relative z-10 font-medium tracking-tight">{label}</span>
      {badge && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 relative z-10 shadow-sm"
          style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
        >
          {badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="nav-active-indicator"
          className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </>
  );

  const className = cn(
    "group w-full flex items-center gap-2.5 px-3 py-[var(--density-nav-pad)] text-[13px] transition-all text-left relative overflow-hidden",
  );
  const style = {
    color: active ? "var(--blue)" : "var(--text2)",
    background: active ? "rgba(var(--primary-rgb, 59 130 246) / 0.1)" : "transparent",
    borderRadius: "var(--radius-ui)",
    border: active ? "1px solid rgba(var(--primary-rgb, 59 130 246) / 0.2)" : "1px solid transparent",
  };

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {content}
    </button>
  );
}
