
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  A11yLevel,
  BackendGenerationConfig,
  BackendFramework,
  DatabaseType,
  GenerationConfig,
  GenerationMode,
  HistoryEntry,
  PipelineStep,
  QualityCheck,
  StylingOption,
  Language,
  OutputView,
  ProjectType,
  Framework,
  GenerationCategory,
  FileEntry,
  ExtraLibraryEntry,
} from "@/types";

export const PIPELINE_STEPS: Omit<PipelineStep, "status">[] = [
  { id: 1, name: "Deep prompt analysis", description: "Intent, must-haves vs nice-to-haves, contradictions, missing details" },
  { id: 2, name: "Requirement extraction & chunking", description: "Decomposing the request into clear, ordered work chunks" },
  { id: 3, name: "Stack, model & architecture fit", description: "Aligning scope with framework, language, styling, and complexity" },
  { id: 4, name: "Plan validation gate", description: "Confirming the implementation plan matches the stack and prompt" },
  { id: 5, name: "Folder structure & scaffolding", description: "Module graph, boundaries, and production folder layout" },
  { id: 6, name: "Code generation", description: "Stepwise implementation with strict stack adherence" },
  { id: 7, name: "Syntax & logic verification", description: "Static checks, imports, types, and structural coherence" },
  { id: 8, name: "Gap, bug & inconsistency sweep", description: "Edge cases, broken flows, dependency mismatches vs the brief" },
  { id: 9, name: "Repair, format & refactor pass", description: "Targeted fixes, formatting, and consistency before ship" },
  { id: 10, name: "Final compliance & prompt alignment", description: "Feature-level checklist vs original prompt before handoff" },
];

const DEFAULT_CONFIG: GenerationConfig = {
  category: undefined,
  framework: undefined,
  styling: [],
  language: undefined,
  projectType: undefined,
  a11y: undefined,
  includeHtml: false,
  mode: "accurate",
  useRecommendedTaskModels: true,
  taskModels: {},
  backendFramework: undefined,
  database: undefined,
  dataStoreKind: undefined,
  apiStyle: undefined,
  includeAuth: false,
  includeTests: false,
};

const DEFAULT_BACKEND_CONFIG: BackendGenerationConfig = {
  description: "",
  backendFramework: "Express.js",
  database: "MongoDB",
  language: "TypeScript",
  includeAuth: false,
  includeTests: false,
  endpoints: [],
};

export interface AppState {
  prompt: string;
  imageBase64: string | null;
  imagePreview: string | null;
  config: GenerationConfig;
  backendConfig: BackendGenerationConfig;
  isGenerating: boolean;
  generatedCode: string;
  generatedFiles: Array<{ path: string; content: string; language: string; description?: string }>;
  backendCode: string;
  analysisReport: string;
  projectFiles: FileEntry[];
  projectName: string;
  qualityScore: number;
  qualityChecks: QualityCheck[];
  pipelineSteps: PipelineStep[];
  activeOutputView: OutputView;
  activeInputTab: "input" | "config" | "refine" | "backend";
  activeFileIndex: number;
  history: HistoryEntry[];
  /** Optional npm libraries to include in generation (not persisted). */
  extraLibraries: ExtraLibraryEntry[];
  // Mobile build state
  mobileBuildStatus: "none" | "pending" | "processing" | "completed" | "error";
  mobileBuildType: "apk" | "ipa" | null;
  mobileBuildLinks: { apk?: string; ipa?: string };
  mobileQrCode: string | null;

  setPrompt: (prompt: string) => void;
  setImage: (imageBase64: string | null, imagePreview: string | null) => void;
  updateConfig: (partial: Partial<GenerationConfig>) => void;
  setMode: (mode: GenerationMode) => void;
  setBackendConfig: (partial: Partial<BackendGenerationConfig>) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGeneratedCode: (generatedCode: string, files?: AppState["generatedFiles"]) => void;
  setBackendCode: (backendCode: string) => void;
  setAnalysisReport: (analysisReport: string) => void;
  setProjectFiles: (files: FileEntry[], name?: string) => void;
  clearProjectFiles: () => void;
  setQualityScore: (qualityScore: number) => void;
  setQualityChecks: (qualityChecks: QualityCheck[]) => void;
  advanceStep: (i: number) => void;
  completeStep: (i: number, result: string, ms?: number) => void;
  resetPipeline: () => void;
  setOutputView: (activeOutputView: OutputView) => void;
  setInputTab: (activeInputTab: AppState["activeInputTab"]) => void;
  setActiveFile: (activeFileIndex: number) => void;
  addToHistory: (entry: HistoryEntry) => void;
  loadFromHistory: (id: string) => void;
  setHistory: (history: HistoryEntry[]) => void;
  clearHistory: () => void;
  clearAll: () => void;
  setExtraLibraries: (libs: ExtraLibraryEntry[]) => void;
  addExtraLibraryRow: () => void;
  updateExtraLibrary: (index: number, partial: Partial<ExtraLibraryEntry>) => void;
  removeExtraLibrary: (index: number) => void;
  // Mobile build actions
  setMobileBuildStatus: (status: AppState["mobileBuildStatus"]) => void;
  setMobileBuildType: (type: AppState["mobileBuildType"]) => void;
  setMobileBuildLinks: (links: AppState["mobileBuildLinks"]) => void;
  setMobileQrCode: (qr: string | null) => void;
}

const buildPipelineSteps = (): PipelineStep[] => PIPELINE_STEPS.map((step) => ({ ...step, status: "pending" }));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      prompt: "",
      imageBase64: null,
      imagePreview: null,
      config: DEFAULT_CONFIG,
      backendConfig: DEFAULT_BACKEND_CONFIG,
      isGenerating: false,
      generatedCode: "",
      generatedFiles: [],
      backendCode: "",
      analysisReport: "",
      projectFiles: [],
      projectName: "",
      qualityScore: 0,
      qualityChecks: [],
      pipelineSteps: buildPipelineSteps(),
      activeOutputView: "pipeline",
      activeInputTab: "input",
      activeFileIndex: 0,
      history: [],
      extraLibraries: [],
      mobileBuildStatus: "none",
      mobileBuildType: null,
      mobileBuildLinks: {},
      mobileQrCode: null,
      setPrompt: (prompt) => set({ prompt }),
      setImage: (imageBase64, imagePreview) => set({ imageBase64, imagePreview }),
      updateConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
      setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
      setBackendConfig: (partial) => set((state) => ({ backendConfig: { ...state.backendConfig, ...partial } })),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setGeneratedCode: (generatedCode, files) => set({ generatedCode, generatedFiles: files ?? [] }),
      setBackendCode: (backendCode) => set({ backendCode }),
      setAnalysisReport: (analysisReport) => set({ analysisReport }),
      setProjectFiles: (files, name = "") => set({ projectFiles: files, projectName: name }),
      clearProjectFiles: () => set({ projectFiles: [], projectName: "" }),
      setQualityScore: (qualityScore) => set({ qualityScore }),
      setQualityChecks: (qualityChecks) => set({ qualityChecks }),
      advanceStep: (i) => set((state) => ({ pipelineSteps: state.pipelineSteps.map((step, idx) => idx === i ? { ...step, status: "running" } : step) })),
      completeStep: (i, result, ms) => set((state) => ({ pipelineSteps: state.pipelineSteps.map((step, idx) => idx === i ? { ...step, status: "done", result, durationMs: ms } : step) })),
      // NOTE: resetPipeline intentionally does NOT clear projectFiles/projectName.
      // Files persist across generations so the user can iterate (e.g. "add dark mode",
      // then "add auth") on the same uploaded codebase without re-uploading.
      // Call clearProjectFiles() explicitly to remove them.
      resetPipeline: () => set({
        pipelineSteps: buildPipelineSteps(),
        generatedCode: "",
        generatedFiles: [],
        analysisReport: "",
        qualityScore: 0,
        qualityChecks: [],
        mobileBuildStatus: "none",
        mobileBuildType: null,
        mobileBuildLinks: {},
        mobileQrCode: null,
      }),
      setOutputView: (activeOutputView) => set({ activeOutputView }),
      setInputTab: (activeInputTab) => set({ activeInputTab }),
      setActiveFile: (activeFileIndex) => set({ activeFileIndex }),
      addToHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 50) })),
      loadFromHistory: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (entry) {
          const cfg = entry.config;
          set({
            generatedCode: entry.code,
            generatedFiles: entry.files ?? [],
            config: {
              ...cfg,
              includeHtml: cfg.includeHtml ?? true,
            },
            activeOutputView: "code",
            qualityScore: entry.qualityScore ?? 0,
            analysisReport: "",
            projectFiles: [],
            projectName: "",
            mobileBuildStatus: "none",
            mobileBuildType: null,
            mobileBuildLinks: {},
            mobileQrCode: null,
          });
        }
      },
      setHistory: (history) => set({ history }),
      clearHistory: () => set({ history: [] }),
      setExtraLibraries: (extraLibraries) => set({ extraLibraries }),
      addExtraLibraryRow: () =>
        set((state) => ({
          extraLibraries: [...state.extraLibraries, { name: "", purpose: "" }].slice(0, 24),
        })),
      updateExtraLibrary: (index, partial) =>
        set((state) => ({
          extraLibraries: state.extraLibraries.map((row, i) => (i === index ? { ...row, ...partial } : row)),
        })),
      removeExtraLibrary: (index) =>
        set((state) => ({
          extraLibraries: state.extraLibraries.filter((_, i) => i !== index),
        })),
      setMobileBuildStatus: (status) => set({ mobileBuildStatus: status }),
      setMobileBuildType: (type) => set({ mobileBuildType: type }),
      setMobileBuildLinks: (links) => set({ mobileBuildLinks: links }),
      setMobileQrCode: (qr) => set({ mobileQrCode: qr }),
      clearAll: () => set({
        prompt: "",
        imageBase64: null,
        imagePreview: null,
        config: DEFAULT_CONFIG,
        generatedCode: "",
        generatedFiles: [],
        backendCode: "",
        analysisReport: "",
        qualityScore: 0,
        qualityChecks: [],
        backendConfig: DEFAULT_BACKEND_CONFIG,
        projectFiles: [],
        projectName: "",
        pipelineSteps: buildPipelineSteps(),
        activeOutputView: "pipeline",
        activeInputTab: "input",
        activeFileIndex: 0,
        extraLibraries: [],
      }),
    }),
    {
      name: "ui-code-gen-v2",
      partialize: (state) => ({
        history: state.history,
        config: state.config,
        backendConfig: state.backendConfig,
      }),
    }
  )
);
