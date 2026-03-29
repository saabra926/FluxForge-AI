"use client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Copy, Download, Check, FileArchive, FileCode } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PipelineView } from "./PipelineView";
import { CodeView } from "./CodeView";
import { HistoryView } from "./HistoryView";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { BackendPanel } from "@/components/backend/BackendPanel";
import { SeoAnalyticsView } from "@/components/seo/SeoAnalyticsView";
import { getFileExtension, cn } from "@/lib/utils";
import type { OutputView } from "@/types";

const BASE_TABS: { id: OutputView; label: string }[] = [
  { id: "pipeline", label: "⚡ Pipeline" },
  { id: "code",     label: "{ } Code" },
  { id: "preview",  label: "👁 Preview" },
  { id: "history",  label: "🕐 History" },
  { id: "seo",      label: "📈 SEO" },
];

export function OutputPanel({
  onToast,
  isGuest,
}: {
  onToast: (m: string, t?: "success" | "error" | "info") => void;
  isGuest?: boolean;
}) {
  const {
    activeOutputView, setOutputView,
    generatedCode, generatedFiles, config,
    activeInputTab, analysisReport,
  } = useAppStore();

  useEffect(() => {
    if (isGuest && (activeOutputView === "history" || activeOutputView === "seo")) {
      setOutputView("pipeline");
    }
  }, [isGuest, activeOutputView, setOutputView]);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isMultiFile = generatedFiles.length > 1;
  const hasCode = !!generatedCode?.trim();

  const tabsAll = analysisReport
    ? [...BASE_TABS, { id: "audit" as OutputView, label: "📋 Plan / Audit" }]
    : BASE_TABS;
  const tabs = isGuest
    ? tabsAll.filter((t) => t.id !== "history" && t.id !== "seo")
    : tabsAll;

  const handleCopy = async () => {
    if (!hasCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    onToast("Code copied!");
    setTimeout(() => setCopied(false), 2_000);
  };

  const handleDownload = async () => {
    if (isGuest) {
      onToast("Sign in to download generated code (ZIP or single file).", "info");
      return;
    }
    if (!hasCode || downloading) return;
    setDownloading(true);

    try {
      if (isMultiFile && generatedFiles.length > 0) {
        // ── Multi-file → proper ZIP with directory structure ──
        const zip   = new JSZip();
        const root  = sanitizeRootName(config.category ?? config.projectType ?? "project");
        const folder = zip.folder(root) ?? zip;

        for (const file of generatedFiles) {
          // Preserve nested directory structure inside the zip
          const parts = file.path.replace(/^\/+/, "").split("/");
          if (parts.length === 1) {
            folder.file(file.path, file.content);
          } else {
            // ensure intermediate dirs exist (JSZip does this automatically)
            folder.file(file.path, file.content);
          }
        }

        // Add a minimal README if missing
        const hasReadme = generatedFiles.some((f) => /readme/i.test(f.path));
        if (!hasReadme) {
          folder.file("README.md", buildReadme(root, config.framework ?? "HTML+CSS", config.language ?? "TypeScript"));
        }

        const blob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        triggerDownload(blob, `${root}.zip`);
        onToast(`Downloaded ${generatedFiles.length} files as ${root}.zip`);
      } else {
        // ── Single file download ──────────────────────────────
        const ext  = getFileExtension(config.framework);
        const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
        triggerDownload(blob, `generated.${ext}`);
        onToast("File downloaded!");
      }
    } catch (err) {
      console.error("[Download error]", err);
      onToast("Download failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (activeInputTab === "backend") {
    return (
      <div className="flex-1 overflow-hidden">
        <BackendPanel onToast={onToast} />
      </div>
    );
  }

  const showActions =
    hasCode &&
    (activeOutputView === "code" || activeOutputView === "preview" || activeOutputView === "audit");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div
        className="glass glass-strong flex min-h-[44px] flex-shrink-0 flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain px-2 py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-0.5 sm:px-4 [&::-webkit-scrollbar]:hidden"
        style={{ borderBottom: "1px solid var(--border2)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setOutputView(tab.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all sm:px-3 sm:text-[11px]",
              activeOutputView === tab.id ? "" : "hover:opacity-80",
            )}
            style={{
              color: activeOutputView === tab.id ? "var(--blue)" : "var(--text2)",
              background: activeOutputView === tab.id ? "var(--blue-dim)" : "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}

        {showActions && (
          <div className="ml-auto flex shrink-0 gap-1 sm:gap-1.5">
            <ActionBtn
              onClick={handleCopy}
              icon={copied ? <Check size={12} /> : <Copy size={12} />}
              label={copied ? "Copied!" : "Copy"}
            />
            <ActionBtn
              onClick={handleDownload}
              loading={downloading}
              icon={isMultiFile ? <FileArchive size={12} /> : <FileCode size={12} />}
              label={isMultiFile ? `ZIP (${generatedFiles.length} files)` : "Download"}
            />
          </div>
        )}

        {/* Download hint when code exists but we're on pipeline view */}
        {hasCode && activeOutputView === "pipeline" && (
          <div className="ml-auto">
            <button onClick={() => setOutputView("code")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: "var(--green)", color: "var(--green)", background: "rgba(16,185,129,0.06)" }}>
              <Check size={12} /> Code ready — view &amp; download
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background: activeOutputView === "code" ? "var(--code-bg)" : "var(--bg)" }}>
        {activeOutputView === "pipeline" && <PipelineView />}
        {activeOutputView === "code"     && <CodeView />}
        {activeOutputView === "preview"  && <PreviewFrame />}
        {activeOutputView === "history"  && <HistoryView onToast={onToast} />}
        {activeOutputView === "audit"    && <AuditView />}
        {activeOutputView === "seo"      && <SeoAnalyticsView onToast={onToast} />}
      </div>
    </div>
  );
}

// ── Audit view ────────────────────────────────────────────────

function AuditView() {
  const { analysisReport, projectFiles, projectName } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-5" style={{ color: "var(--text)" }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-2xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
          <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: "var(--text3)" }}>Project audit</p>
          <h3 className="text-[18px] font-semibold mb-1">{projectName || "Uploaded project"}</h3>
          <p className="text-[12px]" style={{ color: "var(--text2)" }}>{projectFiles.length} files analyzed</p>
        </div>
        <div className="rounded-2xl p-4 whitespace-pre-wrap text-[13px] leading-7"
          style={{ background: "var(--code-bg)", border: "1px solid var(--border2)", color: "var(--text)" }}>
          {analysisReport || "No audit report available yet."}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function ActionBtn({
  onClick, icon, label, loading,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
      style={{ borderColor: "var(--border2)", color: "var(--text2)", background: "transparent" }}>
      {loading
        ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        : icon}
      <span className="max-w-[9rem] truncate sm:max-w-none">{label}</span>
    </button>
  );
}

function sanitizeRootName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "generated-project";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

function buildReadme(name: string, framework: string, language: string): string {
  return [
    `# ${name}`,
    "",
    `Generated with UI Generator · Framework: ${framework} · Language: ${language}`,
    "",
    "## Getting Started",
    "",
    "```bash",
    "npm install",
    "npm run dev",
    "```",
    "",
    "## Environment Variables",
    "",
    "Copy `.env.example` to `.env.local` and fill in your values.",
    "",
  ].join("\n");
}
