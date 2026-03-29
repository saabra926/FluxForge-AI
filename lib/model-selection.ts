// ============================================================
// lib/model-selection.ts — resolve task → model with recommendations
// ============================================================
import type { GenerationConfig, GenerationMode, ModelTaskCategory, TaskModelMap } from "@/types";
import { FAST_MODEL, MODEL } from "@/lib/openai-constants";

const RECOMMENDED_BY_TASK: Record<ModelTaskCategory, string> = {
  Planning: MODEL,
  Reasoning: MODEL,
  "UI generation": MODEL,
  "Code generation": MODEL,
  "Backend generation": MODEL,
  Debugging: MODEL,
  Refactoring: MODEL,
  Testing: FAST_MODEL,
  Documentation: FAST_MODEL,
  Optimization: MODEL,
};

/** Primary generation model from legacy `mode` when no per-task map is used. */
export function defaultPrimaryModel(mode: GenerationMode): string {
  return mode === "fast" ? FAST_MODEL : MODEL;
}

export function recommendedModelForTask(task: ModelTaskCategory, mode: GenerationMode): string {
  const base = RECOMMENDED_BY_TASK[task];
  if (mode === "fast" && (task === "Testing" || task === "Documentation")) return FAST_MODEL;
  if (mode === "fast" && task !== "Testing" && task !== "Documentation") {
    // Still bias quality on greenfield generation even in "fast" UX mode unless user overrides.
    return FAST_MODEL;
  }
  return base;
}

export function resolveTaskModel(
  task: ModelTaskCategory,
  config: GenerationConfig
): string {
  const override = config.taskModels?.[task];
  if (override?.trim()) return override.trim();

  const useRec = config.useRecommendedTaskModels !== false;
  if (useRec) return recommendedModelForTask(task, config.mode);

  return defaultPrimaryModel(config.mode);
}

/** Resolved models for each engineering stage (server-side). */
export interface ResolvedPipelineModels {
  planning: string;
  reasoning: string;
  uiGeneration: string;
  codeGeneration: string;
  backendGeneration: string;
  /** Final checklist / JSON gate */
  compliance: string;
  /** Targeted repair pass */
  refinement: string;
}

export function resolvePipelineModels(config: GenerationConfig): ResolvedPipelineModels {
  return {
    planning: resolveTaskModel("Planning", config),
    reasoning: resolveTaskModel("Reasoning", config),
    uiGeneration: resolveTaskModel("UI generation", config),
    codeGeneration: resolveTaskModel("Code generation", config),
    backendGeneration: resolveTaskModel("Backend generation", config),
    compliance: resolveTaskModel("Testing", config),
    refinement: resolveTaskModel("Refactoring", config),
  };
}

/** Merge explicit map with recommendations for UI previews. */
export function previewResolvedMap(config: GenerationConfig): Record<ModelTaskCategory, string> {
  const keys: ModelTaskCategory[] = [
    "Planning",
    "Reasoning",
    "UI generation",
    "Code generation",
    "Backend generation",
    "Debugging",
    "Refactoring",
    "Testing",
    "Documentation",
    "Optimization",
  ];
  const out = {} as Record<ModelTaskCategory, string>;
  for (const k of keys) {
    out[k] = resolveTaskModel(k, config);
  }
  return out;
}

export function taskUsesRecommendedModel(task: ModelTaskCategory, config: GenerationConfig): boolean {
  return !config.taskModels?.[task]?.trim();
}
