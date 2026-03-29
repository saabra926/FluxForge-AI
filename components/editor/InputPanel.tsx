"use client";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  ImageIcon, Wand2, Zap, Sparkles, Boxes, Globe, Smartphone,
  ServerCog, Shapes, UploadCloud, FolderOpen, FileCode2, X, Plus, LayoutTemplate,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { compressImage, cn } from "@/lib/utils";
import { parseProjectFiles } from "@/lib/parse-project-files";
import { useGenerate, useRefine } from "@/hooks/useGenerate";
import {
  GENERATION_CATEGORIES,
  PROMPT_ENHANCEMENT_PRESETS,
  POPULAR_LANGUAGES,
  BACKEND_FRAMEWORKS,
  getFrameworksForCategory,
  getLanguageHintForCategory,
  getProjectTypesForCategory,
  getStylingForCategory,
  buildEnhancedPromptDraft,
} from "@/lib/catalog";
import { validateGenerationConfig, needsBackendStackFields } from "@/lib/generation-config";
import type { A11yLevel, DatabaseType, GenerationCategory } from "@/types";
import { ModelTaskSelector } from "@/components/editor/ModelTaskSelector";

// ── constants ────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: "🚀", label: "SaaS Landing", text: "A modern SaaS landing page with hero section, animated feature cards (6 in grid), pricing table (3 tiers: free/pro/enterprise), testimonials with avatars, FAQ accordion, and sticky navbar with CTA. Dark theme with blue gradient accents, glassmorphism cards, and smooth scroll animations." },
  { icon: "📊", label: "Dashboard", text: "An analytics dashboard with KPI metric cards at top (revenue, users, conversion, churn), a responsive line chart, a donut pie chart, a sortable data table with search and pagination, real-time status indicators, and a collapsible sidebar nav. Professional dark UI." },
  { icon: "🔐", label: "Auth Form", text: "A polished authentication UI with animated login/signup tabs, social OAuth buttons (Google, GitHub, Microsoft), email+password inputs with real-time validation, password strength meter, remember me toggle, forgot password link, and a glassmorphism card with gradient border glow." },
  { icon: "🛍️", label: "E-commerce", text: "A product detail page with zoomable image gallery (main + thumbnails), product info (name, rating stars, review count), size/color variant selectors with availability status, quantity picker, add-to-cart + wishlist buttons, shipping estimate widget, related products grid. Modern, clean design." },
  { icon: "💬", label: "Chat App", text: "A full real-time chat interface — contacts sidebar with search and unread badges, message thread with sent/received bubbles, timestamps, typing indicators with animated dots, emoji picker, file attachment button, and a polished message input. Dark theme like Discord." },
];

// All image types the tool accepts
const IMAGE_ACCEPT = {
  "image/png":  [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif":  [".gif"],
  "image/bmp":  [".bmp"],
  "image/tiff": [".tiff", ".tif"],
  "image/svg+xml": [".svg"],
  "image/avif": [".avif"],
  "image/heic": [".heic"],
};

// All code/project file types the tool accepts
const PROJECT_FILE_ACCEPT = {
  "application/zip":             [".zip"],
  "application/x-zip-compressed":[".zip"],
  "text/plain":                  [".txt", ".md", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".css", ".scss", ".sass", ".less", ".html", ".htm", ".xml", ".yaml", ".yml", ".toml", ".env", ".sh"],
  "text/x-python":               [".py"],
  "text/x-go":                   [".go"],
  "text/x-java-source":          [".java"],
  "text/x-php":                  [".php"],
  "text/x-ruby":                 [".rb"],
  "text/x-rustsrc":              [".rs"],
  "text/x-kotlin":               [".kt", ".kts"],
  "text/x-swift":                [".swift"],
  "text/x-dart":                 [".dart"],
  "text/x-csrc":                 [".c", ".h", ".cpp", ".cc"],
  "text/x-csharp":               [".cs"],
  "application/x-sql":           [".sql"],
  "application/graphql":         [".graphql", ".gql"],
};

// ── component ────────────────────────────────────────────────

export function InputPanel({ onToast }: { onToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const store = useAppStore();
  const { generate } = useGenerate();
  const { refine } = useRefine();
  const [refineText, setRefineText] = useState("");
  const [promptGoal, setPromptGoal] = useState("");

  const zipInputRef    = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef  = useRef<HTMLInputElement | null>(null);

  const currentCategory = store.config.category;
  const auditMode = currentCategory === "Project Audit";
  const tab = store.activeInputTab;

  // Derived upload state
  const hasImage = !!store.imagePreview;
  const hasFiles = store.projectFiles.length > 0;

  // ── image upload ─────────────────────────────────────────
  const loadImage = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { onToast("Max 20MB image size", "error"); return; }
    try {
      // SVG: read as text and encode, no canvas needed
      if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
        const text = await file.text();
        const base64 = btoa(unescape(encodeURIComponent(text)));
        const preview = `data:image/svg+xml;base64,${base64}`;
        store.setImage(base64, preview);
        onToast("SVG image loaded");
        return;
      }
      const { base64, preview } = await compressImage(file, 1600, 0.9);
      store.setImage(base64, preview);
      onToast("Image loaded");
    } catch {
      onToast("Failed to load image", "error");
    }
  }, [store, onToast]);

  const onImageDrop = useCallback(async (files: File[]) => {
    if (files[0]) await loadImage(files[0]);
  }, [loadImage]);

  // ── project files upload ──────────────────────────────────
  const onProjectDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    try {
      const parsed = await parseProjectFiles(files);
      if (!parsed.length) { onToast("No readable files found in the upload", "error"); return; }
      store.setProjectFiles(parsed, files[0]?.name || "uploaded-project");
      onToast(`Loaded ${parsed.length} file${parsed.length !== 1 ? "s" : ""}`);
    } catch {
      onToast("Failed to read project archive", "error");
    }
  }, [store, onToast]);

  // ── paste handler for images ──────────────────────────────
  usePasteImage(loadImage);

  // ── dropzones ─────────────────────────────────────────────
  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onImageDrop,
    accept: IMAGE_ACCEPT,
    maxFiles: 1,
    noClick: hasImage,
  });

  const {
    getRootProps: getFilesRootProps,
    getInputProps: getFilesInputProps,
    isDragActive: isFilesDragActive,
  } = useDropzone({
    onDrop: onProjectDrop,
    accept: PROJECT_FILE_ACCEPT,
    maxFiles: 50,
    noClick: true,
  });

  // ── generate / refine ─────────────────────────────────────
  const handleGenerate = async () => {
    const err = validateGenerationConfig(store.config);
    if (err) { onToast(err, "error"); return; }
    const r = await generate();
    if (r?.error) onToast(r.error, "error");
    else {
      if (auditMode) onToast("Audit started");
      else if (hasFiles && hasImage) onToast("Mixed-mode generation started");
      else if (hasFiles) onToast("Feature enhancement started");
      else onToast("Code generated successfully!");
    }
  };

  const handleRefine = async () => {
    if (!refineText.trim()) return;
    const r = await refine(refineText);
    if (r?.error) onToast(r.error, "error");
    else { onToast("Refinement applied!"); setRefineText(""); }
  };

  const applyCategory = (category: GenerationCategory) => {
    store.updateConfig({
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
    if (category === "Backend") {
      store.setInputTab("backend");
      store.setOutputView("backend");
      onToast("Backend workspace opened");
    } else if (category === "Project Audit") {
      store.setOutputView("audit");
      onToast("Audit mode selected");
    } else {
      onToast(`${category} selected`);
    }
  };

  const enhancePrompt = () => {
    const draft = buildEnhancedPromptDraft(store.prompt || promptGoal, store.config.category);
    store.setPrompt(draft);
    onToast("Prompt enhanced");
  };

  const selectedFrameworks  = useMemo(() => getFrameworksForCategory(currentCategory), [currentCategory]);
  const selectedLanguages   = useMemo(() => getLanguageHintForCategory(currentCategory), [currentCategory]);
  const selectedProjectTypes = useMemo(() => getProjectTypesForCategory(currentCategory), [currentCategory]);
  const selectedStyling     = useMemo(() => getStylingForCategory(currentCategory), [currentCategory]);
  const enhancedPreview     = useMemo(() => buildEnhancedPromptDraft(store.prompt || promptGoal, currentCategory), [store.prompt, promptGoal, currentCategory]);

  // ── generate button label ─────────────────────────────────
  const generateLabel = (() => {
    if (store.isGenerating) return "Generating…";
    if (auditMode) return "Trace & Fix Bugs";
    if (hasFiles && hasImage) return "Implement Design in Code";
    if (hasFiles) return "Add Features to Code";
    return "Generate with GPT-5.4";
  })();

  const configError = validateGenerationConfig(store.config);
  const canGenerate = !configError;

  const showBackendStack = needsBackendStackFields(store.config.category, store.config.projectType);
  const sqlDatabases: DatabaseType[] = ["PostgreSQL", "MySQL", "SQLite"];
  const nosqlDatabases: DatabaseType[] = ["MongoDB"];
  const databaseOptions: DatabaseType[] =
    store.config.dataStoreKind === "SQL"
      ? sqlDatabases
      : store.config.dataStoreKind === "NoSQL"
        ? nosqlDatabases
        : [];

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-h-[55vh] flex-col overflow-hidden lg:max-h-none">
      {/* Tabs */}
      <div className="flex" style={{ background: "var(--panel)", borderBottom: "1px solid var(--border2)" }}>
        {(["input", "config", "refine"] as const).map((t) => (
          <button key={t} onClick={() => store.setInputTab(t)}
            className={cn("flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide capitalize transition-all", tab === t ? "tab-active" : "tab-inactive")}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-4 md:space-y-5">

        {/* ── INPUT TAB ───────────────────────────────────── */}
        {tab === "input" && (
          <>
            {/* Step 1: Category */}
            <Section label="1. Choose a category">
              <div className="grid grid-cols-2 gap-2">
                {GENERATION_CATEGORIES.map((item) => {
                  const Icon = iconForCategory(item.id);
                  const active = currentCategory === item.id;
                  return (
                    <button key={item.id} onClick={() => applyCategory(item.id)}
                      className="group relative rounded-2xl border p-3 text-left transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
                      style={{ 
                        background: active ? "rgba(var(--primary-rgb, 59 130 246) / 0.15)" : "var(--bg2)", 
                        borderColor: active ? "var(--blue)" : "var(--border2)",
                        boxShadow: active ? "0 0 20px rgba(59, 130, 246, 0.1)" : "none"
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: active ? "var(--blue)" : "var(--text3)" }}>{item.badge}</span>
                        <Icon size={18} className={cn("transition-transform duration-500 group-hover:rotate-12", active ? "text-blue-500" : "text-slate-500")} />
                      </div>
                      <p className="text-[13px] font-bold mb-1 tracking-tight" style={{ color: "var(--text)" }}>{item.title}</p>
                      <p className="text-[10px] leading-relaxed opacity-70" style={{ color: "var(--text2)" }}>{item.description}</p>
                      {active && (
                        <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Step 2: Universal Attachments (always visible) */}
            <Section label="2. Attach reference (optional)">
              <div className="space-y-2">

                {/* ── Screenshot upload ───────────────────── */}
                <div {...getImageRootProps()}
                  className="group relative border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer overflow-hidden"
                  style={{ 
                    borderColor: isImageDragActive ? "var(--blue)" : "var(--border3)", 
                    background: isImageDragActive ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.02)" 
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input {...getImageInputProps()} />

                  {hasImage ? (
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="relative group/img">
                        <Image
                          src={store.imagePreview!}
                          alt="Preview"
                          width={96}
                          height={64}
                          unoptimized
                          className="h-16 w-24 object-cover rounded-xl shadow-lg transition-transform group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                           <Sparkles size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-blue-400">✓ Visual asset loaded</p>
                        <p className="text-[10px] mt-0.5 opacity-60" style={{ color: "var(--text3)" }}>Click to replace · Ctrl+V to paste</p>
                        <button onClick={(e) => { e.stopPropagation(); store.setImage(null, null); }}
                          className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors">
                          <X size={12} /> REMOVE ASSET
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-2xl p-3 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ background: "rgba(59,130,246,0.1)" }}>
                        <ImageIcon size={22} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Forge from Vision</p>
                        <p className="text-[10px] opacity-60 mt-0.5" style={{ color: "var(--text2)" }}>Drop screenshot · PNG · JPG · WebP · Max 20MB</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                        className="ml-auto px-3 py-2 rounded-xl text-[10px] font-bold border transition-all hover:bg-white/5 active:scale-95"
                        style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
                        BROWSE
                      </button>
                    </div>
                  )}
                  <input ref={imageInputRef} type="file" accept={Object.values(IMAGE_ACCEPT).flat().join(",")} className="hidden"
                    onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await loadImage(f); }} />
                </div>

                {/* ── Code / ZIP upload ────────────────────── */}
                <div {...getFilesRootProps()}
                  className="group relative border-2 border-dashed rounded-2xl p-4 transition-all overflow-hidden"
                  style={{ 
                    borderColor: isFilesDragActive ? "var(--green)" : "var(--border3)", 
                    background: isFilesDragActive ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.02)" 
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input {...getFilesInputProps()} />

                  {hasFiles ? (
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl p-2.5 shadow-inner" style={{ background: "rgba(16,185,129,0.1)" }}>
                          <FileCode2 size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-bold text-emerald-400">
                            ✓ {store.projectFiles.length} source file{store.projectFiles.length !== 1 ? "s" : ""} forged
                          </p>
                          <p className="text-[10px] opacity-60 truncate" style={{ color: "var(--text3)" }}>{store.projectName || "Uploaded project"}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); store.clearProjectFiles(); }}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors">
                          <X size={12} /> CLEAR
                        </button>
                      </div>
                      <div className="max-h-24 overflow-y-auto rounded-xl p-2.5 space-y-1 custom-scrollbar" style={{ background: "rgba(0,0,0,0.2)" }}>
                        {store.projectFiles.slice(0, 12).map((f) => (
                          <p key={f.path} className="text-[10px] truncate font-mono opacity-60 hover:opacity-100 transition-opacity cursor-default" style={{ color: "var(--text3)" }}>{f.path}</p>
                        ))}
                        {store.projectFiles.length > 12 && (
                          <p className="text-[10px] font-bold text-emerald-500/50 mt-1">…and {store.projectFiles.length - 12} more files</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-2xl p-3 shadow-inner transition-transform group-hover:scale-110 group-hover:-rotate-3" style={{ background: "rgba(16,185,129,0.1)" }}>
                        <FolderOpen size={22} className="text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Forge from Source</p>
                        <p className="text-[10px] opacity-60 mt-0.5" style={{ color: "var(--text2)" }}>Drop ZIP or folder · Any codebase</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click(); }}
                          className="px-3 py-2 rounded-xl text-[10px] font-bold border transition-all hover:bg-white/5 active:scale-95"
                          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
                          ZIP
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                          className="px-3 py-2 rounded-xl text-[10px] font-bold border transition-all hover:bg-white/5 active:scale-95"
                          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
                          FOLDER
                        </button>
                      </div>
                    </div>
                  )}

                  <input ref={zipInputRef} type="file" accept=".zip" className="hidden"
                    onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await onProjectDrop([f]); }} />
                  <input ref={folderInputRef} type="file" multiple className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={async (e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; if (files.length) await onProjectDrop(files); }} />
                </div>

                {/* Mode hint badge */}
                {(hasImage || hasFiles) && (
                  <ModeHintBadge hasImage={hasImage} hasFiles={hasFiles} auditMode={auditMode} />
                )}
              </div>
            </Section>

            {/* Step 3: Prompt */}
            <Section label={auditMode ? "3. What should be fixed?" : hasFiles ? "3. What should be added/changed?" : "3. Describe your UI"}>
              <Textarea
                value={store.prompt}
                onChange={store.setPrompt}
                placeholder={
                  auditMode
                    ? "Example: trace runtime errors, broken imports, and logic bugs — then patch them."
                    : hasFiles && hasImage
                    ? "Example: implement the design shown in the screenshot into the existing codebase, preserving all existing functionality."
                    : hasFiles
                    ? "Example: add a dark mode toggle, implement user authentication, or add a search feature."
                    : "Describe the layout, components, colors, interactions, animations, and polish you need…"
                }
                rows={5}
              />
            </Section>

            <Section label="Optional: npm libraries (before generate)">
              <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--text3)" }}>
                List only packages you want beyond the chosen stack. Leave empty and the model will not add optional libraries automatically.
              </p>
              <div className="space-y-2">
                {store.extraLibraries.map((row, i) => (
                  <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <input
                      value={row.name}
                      onChange={(e) => store.updateExtraLibrary(i, { name: e.target.value })}
                      placeholder="Package name (e.g. framer-motion)"
                      className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[11px] border bg-transparent"
                      style={{ borderColor: "var(--border2)", color: "var(--text)" }}
                    />
                    <input
                      value={row.purpose}
                      onChange={(e) => store.updateExtraLibrary(i, { purpose: e.target.value })}
                      placeholder="Purpose"
                      className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[11px] border bg-transparent sm:max-w-[48%]"
                      style={{ borderColor: "var(--border2)", color: "var(--text)" }}
                    />
                    <button
                      type="button"
                      onClick={() => store.removeExtraLibrary(i)}
                      className="shrink-0 rounded-lg p-2 border self-start sm:self-center"
                      style={{ borderColor: "var(--border2)", color: "var(--text3)" }}
                      aria-label="Remove row"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => store.addExtraLibraryRow()}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold border transition-all hover:opacity-80"
                  style={{ borderColor: "var(--border2)", color: "var(--blue)" }}
                >
                  <Plus size={14} /> Add library row
                </button>
              </div>
            </Section>

            {/* Step 4: Prompt enhancement */}
            <Section label="4. Prompt enhancement">
              <div className="rounded-2xl p-3 space-y-3" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.1)" }}>
                <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: "var(--text2)" }}>
                  <Sparkles size={13} style={{ color: "var(--blue)" }} /> Turn a basic prompt into a high-precision brief.
                </div>
                <Textarea value={promptGoal} onChange={setPromptGoal} placeholder="Optional short goal for the enhancer…" rows={2} />
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_ENHANCEMENT_PRESETS.map((preset) => (
                    <button key={preset} onClick={() => setPromptGoal(preset)}
                      className="text-[10px] px-2.5 py-1.5 rounded-full border transition-all hover:opacity-80"
                      style={{ borderColor: "var(--border2)", color: "var(--text2)", background: "var(--bg2)" }}>
                      {preset.length > 34 ? `${preset.slice(0, 34)}…` : preset}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={enhancePrompt} className="flex-1 py-2.5 rounded-xl font-bold text-[12px] text-white btn-primary flex items-center justify-center gap-2">
                    <Wand2 size={13} /> Enhance Prompt
                  </button>
                  <button onClick={() => store.setPrompt(enhancedPreview)} className="px-3 py-2.5 rounded-xl text-[12px] border font-semibold"
                    style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
                    Apply
                  </button>
                </div>
                <div className="rounded-xl p-3 text-[11px] leading-relaxed" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)" }}>
                  {enhancedPreview}
                </div>
              </div>
            </Section>

            {/* Quick examples */}
            {!hasFiles && (
              <div className="rounded-2xl p-3" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.1)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>💡 Quick examples</p>
                <div className="space-y-1">
                  {QUICK_PROMPTS.map((qp) => (
                    <button key={qp.label} onClick={() => store.setPrompt(qp.text)}
                      className="w-full text-left px-2.5 py-2 rounded-lg border text-[11px] transition-all hover:opacity-80"
                      style={{ color: "var(--text2)", borderColor: "var(--border)", background: "var(--bg2)" }}>
                      {qp.icon} {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CONFIG TAB ──────────────────────────────────── */}
        {tab === "config" && (
          <>
            <ConfigGroup label="Category">
              <div className="flex flex-wrap gap-1.5">
                {GENERATION_CATEGORIES.map((item) => (
                  <button key={item.id} onClick={() => applyCategory(item.id)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all"
                    style={{ background: currentCategory === item.id ? "var(--blue-dim)" : "transparent", borderColor: currentCategory === item.id ? "var(--blue)" : "var(--border2)", color: currentCategory === item.id ? "var(--blue)" : "var(--text2)" }}>
                    {item.title}
                  </button>
                ))}
              </div>
            </ConfigGroup>

            {!currentCategory ? (
              <div className="rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: "var(--bg2)", border: "1px solid var(--border2)", color: "var(--text2)" }}>
                Select a category first to unlock stack options.
              </div>
            ) : (
              <>
                <ConfigGroup label="HTML output (required)">
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all"
                    style={{
                      borderColor: store.config.includeHtml ? "var(--blue)" : "var(--border2)",
                      background: store.config.includeHtml ? "var(--blue-dim)" : "var(--bg2)",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!store.config.includeHtml}
                      onChange={(e) => store.updateConfig({ includeHtml: e.target.checked })}
                    />
                    <span className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>
                      Include HTML in deliverables — semantic HTML, or framework templates that render real HTML. Code generation stays disabled until you enable this.
                    </span>
                  </label>
                </ConfigGroup>

                <ConfigGroup label="Framework">
                  <RadioGroup options={selectedFrameworks} value={store.config.framework} onChange={(v) => store.updateConfig({ framework: v })} />
                </ConfigGroup>
                <ConfigGroup label="Styling (pick one)">
                  <RadioGroup
                    options={selectedStyling}
                    value={store.config.styling[0]}
                    onChange={(v) => store.updateConfig({ styling: [v] })}
                  />
                </ConfigGroup>
                <ConfigGroup label="Language">
                  <RadioGroup options={selectedLanguages} value={store.config.language} onChange={(v) => store.updateConfig({ language: v })} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {POPULAR_LANGUAGES.map((lang) => (
                      <button key={lang} onClick={() => store.updateConfig({ language: lang })}
                        className="px-2.5 py-1 rounded-full text-[10px] border transition-all hover:opacity-80"
                        style={{ borderColor: store.config.language === lang ? "var(--blue)" : "var(--border2)", background: store.config.language === lang ? "var(--blue-dim)" : "var(--bg2)", color: store.config.language === lang ? "var(--blue)" : "var(--text2)" }}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </ConfigGroup>
                <ConfigGroup label="Project type">
                  <RadioGroup options={selectedProjectTypes} value={store.config.projectType} onChange={(v) => store.updateConfig({ projectType: v })} />
                </ConfigGroup>
                <ConfigGroup label="Accessibility">
                  <RadioGroup options={["WCAG AAA", "WCAG AA", "Basic", "None"] as A11yLevel[]} value={store.config.a11y} onChange={(v) => store.updateConfig({ a11y: v })} />
                </ConfigGroup>

                {showBackendStack && (
                  <>
                    <ConfigGroup label="Data store">
                      <RadioGroup
                        options={["SQL", "NoSQL"]}
                        value={store.config.dataStoreKind}
                        onChange={(v) => store.updateConfig({ dataStoreKind: v as "SQL" | "NoSQL", database: undefined })}
                      />
                    </ConfigGroup>
                    {!!store.config.dataStoreKind && databaseOptions.length > 0 && (
                      <ConfigGroup label="Database">
                        <RadioGroup
                          options={databaseOptions}
                          value={store.config.database}
                          onChange={(d) => store.updateConfig({ database: d })}
                        />
                      </ConfigGroup>
                    )}
                    <ConfigGroup label="Backend framework">
                      <RadioGroup
                        options={BACKEND_FRAMEWORKS}
                        value={store.config.backendFramework}
                        onChange={(v) => store.updateConfig({ backendFramework: v })}
                      />
                    </ConfigGroup>
                    <ConfigGroup label="API style">
                      <RadioGroup
                        options={["REST", "GraphQL"]}
                        value={store.config.apiStyle}
                        onChange={(v) => store.updateConfig({ apiStyle: v as "REST" | "GraphQL" })}
                      />
                    </ConfigGroup>
                  </>
                )}

                <ConfigGroup label="Models & pipeline">
                  <ModelTaskSelector />
                </ConfigGroup>
                {currentCategory === "Full Stack" && (
                  <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.16)" }}>
                    <div className="flex items-center gap-2 mb-2" style={{ color: "var(--green)" }}>
                      <Shapes size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">ZIP-ready full-stack output</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>
                      Multi-file output is exported as a fully structured ZIP with frontend/ and backend/ directories, package.json, README, and .env.example.
                    </p>
                  </div>
                )}
                {currentCategory === "Backend" && (
                  <button onClick={() => store.setInputTab("backend")} className="w-full rounded-2xl p-4 text-left border transition-all hover:-translate-y-0.5" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.18)" }}>
                    <div className="flex items-center gap-2 mb-1" style={{ color: "var(--violet)" }}>
                      <ServerCog size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Backend workspace</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>Configure backend generation in the dedicated API workspace.</p>
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── REFINE TAB ──────────────────────────────────── */}
        {tab === "refine" && (
          <>
            <Section label="Refine code">
              <div className="rounded-2xl p-3 mb-3" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>
                  AI applies surgical changes with verification checks for correctness, responsiveness, accessibility, code style, dead code, and performance.
                </p>
              </div>
              <Textarea value={refineText} onChange={setRefineText}
                placeholder={`Examples:\n"Make all buttons rounded-full"\n"Add smooth hover animations"\n"Convert to dark mode"\n"Fix mobile layout issues"\n"Add TypeScript types"`}
                rows={5} />
              <button onClick={handleRefine} disabled={store.isGenerating || !refineText.trim() || !store.generatedCode}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[13px] text-white btn-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {store.isGenerating ? <SpinIcon /> : <Wand2 size={14} />}
                {store.isGenerating ? "Refining…" : "Apply Refinement"}
              </button>
              {!store.generatedCode && <p className="text-[11px] text-center mt-2" style={{ color: "var(--text3)" }}>Generate code first</p>}
            </Section>

            <Section label="Quick refinements">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Rounded corners", "Dark mode", "Add animations", "Mobile-first",
                  "Add TypeScript", "Improve spacing", "Add loading states", "Better colors",
                  "Add hover effects", "Fix accessibility", "Add error handling", "Performance pass",
                ].map((s) => (
                  <button key={s} onClick={() => setRefineText(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border transition-all hover:opacity-80"
                    style={{ borderColor: "var(--border2)", color: "var(--text2)", background: "var(--bg2)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Generate button */}
      {tab !== "backend" && (
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={handleGenerate} disabled={store.isGenerating || !canGenerate}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[14px] text-white font-syne btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {store.isGenerating ? <SpinIcon /> : <Zap size={16} />}
            {generateLabel}
          </button>
          {!store.isGenerating && !canGenerate && configError && (
            <p className="mt-2 text-center text-[10px] leading-snug" style={{ color: "var(--text3)" }}>{configError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mode hint badge ───────────────────────────────────────────

function ModeHintBadge({ hasImage, hasFiles, auditMode }: { hasImage: boolean; hasFiles: boolean; auditMode: boolean }) {
  let color = "var(--blue)";
  let bg = "rgba(59,130,246,0.08)";
  let border = "rgba(59,130,246,0.2)";
  let label = "";

  if (auditMode) {
    color = "var(--amber, #f59e0b)"; bg = "rgba(245,158,11,0.08)"; border = "rgba(245,158,11,0.2)";
    label = "🩺 Audit mode — AI will trace bugs and produce fixes";
  } else if (hasImage && hasFiles) {
    color = "var(--violet, #8b5cf6)"; bg = "rgba(139,92,246,0.08)"; border = "rgba(139,92,246,0.2)";
    label = "🎨 Mixed mode — AI will implement the screenshot design into your codebase";
  } else if (hasFiles) {
    color = "var(--green)"; bg = "rgba(16,185,129,0.08)"; border = "rgba(16,185,129,0.2)";
    label = "⚡ Feature mode — AI will add/modify features in your uploaded codebase";
  } else if (hasImage) {
    label = "📷 Vision mode — AI will recreate the UI from the screenshot";
  }

  if (!label) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-[11px] font-medium" style={{ color, background: bg, border: `1px solid ${border}` }}>
      {label}
    </div>
  );
}

// ── Paste image hook ──────────────────────────────────────────

function usePasteImage(onImage: (file: File) => Promise<void>) {
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items ?? [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) await onImage(file);
          break;
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [onImage]);
}

// ── Sub-components ────────────────────────────────────────────

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: "var(--text2)" }}>{label}</p>
      {children}
    </div>
  );
}

function ConfigGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: "var(--text2)" }}>{label}</p>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full rounded-2xl px-3 py-2.5 text-[13px] resize-none outline-none transition-all"
      style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", lineHeight: 1.6, fontFamily: "inherit" }}
      onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border2)")} />
  );
}

function RadioGroup<T extends string>({ options, value, onChange }: { options: T[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all"
          style={{ background: value === o ? "var(--blue-dim)" : "transparent", borderColor: value === o ? "var(--blue)" : "var(--border2)", color: value === o ? "var(--blue)" : "var(--text2)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function iconForCategory(category: GenerationCategory) {
  switch (category) {
    case "Website Development":      return Globe;
    case "React Native Application": return Smartphone;
    case "Flutter Application":     return LayoutTemplate;
    case "Frontend":                 return Boxes;
    case "Backend":                  return ServerCog;
    case "Full Stack":               return Shapes;
    case "Prompt Enhancement":       return Sparkles;
    case "Project Audit":            return UploadCloud;
    default:                         return Boxes;
  }
}

// keep unused import happy
const _Plus = Plus;
