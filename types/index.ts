
// ============================================================
// types/index.ts — All TypeScript types for v2
// ============================================================

export type GenerationCategory =
  | "Website Development"
  | "React Native Application"
  | "Flutter Application"
  | "Frontend"
  | "Backend"
  | "Full Stack"
  | "Prompt Enhancement"
  | "Project Audit";

export type Framework =
  | "HTML+CSS"
  | "React.js"
  | "Next.js"
  | "Vite + React"
  | "Vite + React + Node.js"
  | "Vue.js"
  | "Nuxt.js"
  | "Angular"
  | "Svelte"
  | "SvelteKit"
  | "Astro"
  | "Remix"
  | "React Native"
  | "Expo"
  | "Flutter";

export type Language =
  | "TypeScript"
  | "JavaScript"
  | "Python"
  | "Java"
  | "C#"
  | "PHP"
  | "Go"
  | "Rust"
  | "Dart"
  | "Kotlin";

export type ProjectType = "Component" | "Full Page" | "Full Project" | "Full Stack" | "Backend API" | "Mobile App";
export type StylingOption =
  | "Tailwind CSS"
  | "Custom CSS"
  | "Bootstrap"
  | "Shadcn/ui"
  | "Three.js"
  | "Auto"
  | "NativeWind"
  | "React Native Paper";
export type A11yLevel = "WCAG AAA" | "WCAG AA" | "Basic" | "None";
export type GenerationMode = "fast" | "balanced" | "accurate";

/** Per-step model selection in the engineering pipeline (matches product terminology). */
export type ModelTaskCategory =
  | "Planning"
  | "Code generation"
  | "Debugging"
  | "UI generation"
  | "Backend generation"
  | "Refactoring"
  | "Testing"
  | "Documentation"
  | "Reasoning"
  | "Optimization";

/** Map of task category → OpenAI model id (e.g. gpt-5.4). Undefined entries use recommendations. */
export type TaskModelMap = Partial<Record<ModelTaskCategory, string>>;
export type OutputView =
  | "pipeline"
  | "code"
  | "preview"
  | "history"
  | "backend"
  | "audit"
  | "seo";
export type BackendFramework = "Express.js" | "Fastify" | "NestJS" | "Hono";
export type DatabaseType = "MongoDB" | "PostgreSQL" | "MySQL" | "SQLite" | "None";

/** User-chosen storage family — must align with `database`. */
export type DataStoreKind = "SQL" | "NoSQL";

/** API surface for backend / full-stack — no mixing REST and GraphQL unless user selects both (not supported). */
export type ApiStyle = "REST" | "GraphQL";

/** Optional extra npm libraries the user wants included (generation request only). */
export interface ExtraLibraryEntry {
  name: string;
  purpose: string;
}

export interface GenerationConfig {
  category?: GenerationCategory;
  framework?: Framework;
  styling: StylingOption[];
  language?: Language;
  projectType?: ProjectType;
  a11y?: A11yLevel;
  /** Must be true to generate — user explicitly confirms HTML / semantic markup in deliverables. */
  includeHtml?: boolean;
  mode: GenerationMode;
  /**
   * When true, empty `taskModels` entries use task-type recommendations for this mode.
   * When false, missing entries fall back to primary/speed defaults only.
   */
  useRecommendedTaskModels?: boolean;
  /** Manual model overrides per task category (generation, validation, etc.). */
  taskModels?: TaskModelMap;
  // Backend options (when projectType === "Backend API" or category === "Backend" / "Full Stack")
  backendFramework?: BackendFramework;
  database?: DatabaseType;
  dataStoreKind?: DataStoreKind;
  apiStyle?: ApiStyle;
  includeAuth?: boolean;
  includeTests?: boolean;
}

export interface BackendGenerationConfig {
  description: string;
  backendFramework: BackendFramework;
  database: DatabaseType;
  language: Language;
  includeAuth: boolean;
  includeTests: boolean;
  endpoints: string[];
}

export interface PipelineStep {
  id: number;
  name: string;
  description: string;
  status: "pending" | "running" | "done" | "error";
  result?: string;
  durationMs?: number;
}

// Multi-file output support
export interface FileEntry {
  path: string;
  content: string;
  language: string;
  description?: string;
}

export interface GenerationResult {
  id: string;
  code: string;
  files: FileEntry[];
  lines: number;
  chars: number;
  framework: Framework;
  timestamp: number;
  qualityScore?: number;
  issues?: string[];
}

export interface HistoryEntry {
  id: string;
  prompt: string;
  code: string;
  files?: FileEntry[];
  config: GenerationConfig;
  timestamp: number;
  lines: number;
  qualityScore?: number;
  // MongoDB stored fields
  _id?: string;
  createdAt?: string;
}

export interface QualityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

// Request/Response types
export interface GenerateRequest {
  prompt: string;
  imageBase64?: string;
  projectFiles?: FileEntry[];
  config: GenerationConfig;
  /** Only these extra libraries may be added beyond minimal stack deps; omit or empty = none. */
  extraLibraries?: ExtraLibraryEntry[];
}

export interface RefineRequest {
  refinePrompt: string;
  currentCode: string;
  config: GenerationConfig;
  refinementChecks?: string[];
}

export interface BackendGenRequest {
  description: string;
  backendFramework: BackendFramework;
  database: DatabaseType;
  language: Language;
  includeAuth: boolean;
  includeTests: boolean;
  endpoints?: string[];
  aiModel?: string;
  extraLibraries?: ExtraLibraryEntry[];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
