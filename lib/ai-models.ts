// ============================================================
// lib/ai-models.ts — catalog + UX metadata for multi-model selection
// ============================================================
import type { ModelTaskCategory } from "@/types";
import { FAST_MODEL, MODEL, VERIFY_MODEL } from "@/lib/openai-constants";

export type ModelBadgeId =
  | "recommended"
  | "fast"
  | "reasoning"
  | "coding"
  | "ui"
  | "backend"
  | "verify";

export interface AIModelOption {
  id: string;
  label: string;
  shortLabel: string;
  /** Display badges in the selector (not mutually exclusive). */
  badges: ModelBadgeId[];
  bestFor: string[];
  strengths: string[];
  limitations: string[];
  /** Human-readable speed vs quality tradeoff. */
  speedVsQuality: string;
}

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  {
    id: MODEL,
    label: "GPT-5.4",
    shortLabel: "5.4",
    badges: ["recommended", "coding", "reasoning", "ui", "backend"],
    bestFor: [
      "Large apps, SaaS, dashboards, e‑commerce, multi-page flows",
      "Architecture, refactoring, tricky logic, and full-stack deliverables",
      "Premium UI systems, motion, and accessibility-heavy interfaces",
    ],
    strengths: [
      "Highest fidelity to complex instructions and multi-file structure",
      "Strong planning, dependency reasoning, and consistency across files",
      "Excellent at React/Next.js, Node backends, and production patterns",
    ],
    limitations: [
      "Slower and more token-heavy than mini on very long generations",
      "May be overkill for trivial one-off snippets if latency matters most",
    ],
    speedVsQuality: "Biased toward quality and completeness over raw speed.",
  },
  {
    id: FAST_MODEL,
    label: "GPT-5.4 mini",
    shortLabel: "5.4 mini",
    badges: ["fast", "verify"],
    bestFor: [
      "Fast iterations, smaller components, docs, and test scaffolding",
      "Verification passes, formatting passes, and mechanical repairs",
      "Tight loops when you already have a solid plan",
    ],
    strengths: [
      "Lower latency and cost for shorter outputs",
      "Great second-pass checker/fixer alongside the primary model",
    ],
    limitations: [
      "Less reliable on huge apps, deep reasoning, or ambiguous specs",
      "May need an extra refinement pass for advanced UX or backend depth",
    ],
    speedVsQuality: "Biased toward speed; pair with the primary model for hard tasks.",
  },
  {
    id: VERIFY_MODEL,
    label: "Verify (mini)",
    shortLabel: "Verify",
    badges: ["fast", "recommended"],
    bestFor: ["Automated validation", "syntax/logic sweeps", "targeted repair prompts"],
    strengths: ["Efficient at diff-style fixes and checklist-driven repairs"],
    limitations: ["Not ideal as the only model for greenfield complex apps"],
    speedVsQuality: "Fast verification and repair; not a full substitute for primary generation on large builds.",
  },
];

export const MODEL_TASK_CATEGORIES: {
  id: ModelTaskCategory;
  description: string;
}[] = [
  { id: "Planning", description: "Structured plans, milestones, and scope before code" },
  { id: "Reasoning", description: "Deep analysis, tradeoffs, and ambiguity resolution" },
  { id: "UI generation", description: "Layouts, design systems, components, and motion" },
  { id: "Code generation", description: "Primary implementation and multi-file output" },
  { id: "Backend generation", description: "APIs, persistence, auth, and server architecture" },
  { id: "Debugging", description: "Tracing failures, regressions, and root-cause fixes" },
  { id: "Refactoring", description: "Restructuring, cleanup, and safe behavior-preserving edits" },
  { id: "Testing", description: "Unit/integration tests and test harnesses" },
  { id: "Documentation", description: "README, ADRs, and inline technical docs" },
  { id: "Optimization", description: "Performance, bundle size, and scalability passes" },
];

export function getModelOption(id: string | undefined): AIModelOption | undefined {
  if (!id) return undefined;
  return AI_MODEL_OPTIONS.find((m) => m.id === id);
}

export function badgeLabel(b: ModelBadgeId): string {
  switch (b) {
    case "recommended":
      return "Recommended";
    case "fast":
      return "Fast";
    case "reasoning":
      return "Best for reasoning";
    case "coding":
      return "Best for coding";
    case "ui":
      return "Best for UI";
    case "backend":
      return "Best for backend";
    case "verify":
      return "Best for validation";
    default:
      return b;
  }
}
