// ============================================================
// lib/prompt-engineering.ts — structured internal prompts & analysis
// ============================================================
import type { FileEntry, GenerateRequest } from "@/types";

export interface PromptAnalysisResult {
  intentSummary: string;
  mustHave: string[];
  niceToHave: string[];
  contradictions: string[];
  missingDetails: string[];
  inferredStackNotes: string;
  complexity: "low" | "medium" | "high";
  taskChunks: string[];
  securityRequirements: string[];
  dataModels: string[];
}

export function buildPromptAnalysisSystemPrompt(): string {
  return [
    "You are a principal engineer doing DEEP PROMPT ANALYSIS before any code is written.",
    "Return ONLY valid minified JSON (no markdown fences) with this exact shape:",
    '{"intentSummary":"string","mustHave":["string"],"niceToHave":["string"],"contradictions":["string"],"missingDetails":["string"],"inferredStackNotes":"string","complexity":"low|medium|high","taskChunks":["string"],"securityRequirements":["string"],"dataModels":["string"]}',
    "",
    "Rules:",
    "- Preserve the user's intent exactly; do not invent product goals they did not imply.",
    "- Separate must-have vs optional (nice-to-have) with conservative judgment.",
    "- List contradictions or ambiguous phrases; if none, use empty array.",
    "- taskChunks: 3–12 short imperative steps that decompose delivery.",
    "- securityRequirements: list potential risks (XSS, SQLi, Auth gaps) and mitigation strategies.",
    "- dataModels: list core entities and their relationships.",
    "- complexity: high for admin panels, SaaS, dashboards, e-commerce, multi-role, 3D sites, full-stack.",
    "- inferredStackNotes: briefly restate stack expectations WITHOUT changing user-chosen stack from config.",
  ].join("\n");
}

export function buildPromptAnalysisUserPayload(
  request: Pick<GenerateRequest, "prompt" | "config"> & {
    normalizedFiles: { path: string; content: string }[];
    modes: { auditMode: boolean; featureMode: boolean; mixedMode: boolean; hasImage: boolean };
  }
): string {
  const { prompt, config, normalizedFiles, modes } = request;
  return [
    "CONFIG (authoritative for stack):",
    JSON.stringify(
      {
        category: config.category,
        framework: config.framework,
        language: config.language,
        projectType: config.projectType,
        styling: config.styling,
        a11y: config.a11y,
        includeHtml: config.includeHtml,
        backendFramework: config.backendFramework,
        database: config.database,
        dataStoreKind: config.dataStoreKind,
        apiStyle: config.apiStyle,
        mode: config.mode,
      },
      null,
      2
    ),
    "",
    "MODES:",
    JSON.stringify(modes, null, 2),
    "",
    "USER PROMPT:",
    (prompt?.trim() || "(empty – rely on screenshot and/or project files)").slice(0, 12_000),
    "",
    normalizedFiles.length
      ? `PROJECT FILES (truncated listing, ${normalizedFiles.length} total):\n` +
        normalizedFiles
          .slice(0, 24)
          .map((f) => `- ${f.path}: ${f.content.replace(/\s+/g, " ").slice(0, 400)}`)
          .join("\n")
      : "PROJECT FILES: none",
  ].join("\n");
}

export function safeParsePromptAnalysis(raw: string): PromptAnalysisResult | null {
  let trimmed = raw.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) trimmed = fence[1].trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const data = JSON.parse(trimmed) as PromptAnalysisResult;
    if (!data || typeof data !== "object") return null;
    return {
      intentSummary: String(data.intentSummary ?? ""),
      mustHave: Array.isArray(data.mustHave) ? data.mustHave.map(String) : [],
      niceToHave: Array.isArray(data.niceToHave) ? data.niceToHave.map(String) : [],
      contradictions: Array.isArray(data.contradictions) ? data.contradictions.map(String) : [],
      missingDetails: Array.isArray(data.missingDetails) ? data.missingDetails.map(String) : [],
      inferredStackNotes: String(data.inferredStackNotes ?? ""),
      complexity:
        data.complexity === "low" || data.complexity === "medium" || data.complexity === "high"
          ? data.complexity
          : "medium",
      taskChunks: Array.isArray(data.taskChunks) ? data.taskChunks.map(String) : [],
      securityRequirements: Array.isArray(data.securityRequirements) ? data.securityRequirements.map(String) : [],
      dataModels: Array.isArray(data.dataModels) ? data.dataModels.map(String) : [],
    };
  } catch {
    return null;
  }
}

export function formatAnalysisForPlanContext(analysis: PromptAnalysisResult | null): string {
  if (!analysis) return "(lightweight mode: analysis skipped — follow user prompt and config strictly.)";
  return [
    "=== INTERNAL: PROMPT ANALYSIS (do not contradict) ===",
    `Intent: ${analysis.intentSummary}`,
    `Complexity: ${analysis.complexity}`,
    "",
    "Must-have:",
    ...analysis.mustHave.map((l) => `- ${l}`),
    "",
    "Nice-to-have:",
    ...analysis.niceToHave.map((l) => `- ${l}`),
    "",
    "Contradictions / ambiguities to watch:",
    ...analysis.contradictions.map((l) => `- ${l}`),
    "",
    "Missing details (fill safely without changing scope):",
    ...analysis.missingDetails.map((l) => `- ${l}`),
    "",
    "Security & Mitigation:",
    ...analysis.securityRequirements.map((l) => `- ${l}`),
    "",
    "Data Models:",
    ...analysis.dataModels.map((l) => `- ${l}`),
    "",
    "Work chunks:",
    ...analysis.taskChunks.map((l, i) => `${i + 1}. ${l}`),
    "",
    `Stack notes: ${analysis.inferredStackNotes}`,
    "=== END INTERNAL ANALYSIS ===",
  ].join("\n");
}

export function buildEngineeringPlanSystemPrompt(): string {
  return [
    "You are a principal engineer producing an IMPLEMENTATION PLAN.",
    "The plan will gate code generation — be specific, sequenced, and testable.",
    "",
    "Output MARKDOWN with sections:",
    "## Requirements snapshot",
    "## Architecture & boundaries (Clean Architecture focus)",
    "## Data models & state management",
    "## Security & error handling strategy",
    "## Performance optimization plan",
    "## File/folder plan (Full project structure)",
    "## Step-by-step build sequence",
    "## Validation checklist (checkbox style)",
    "## Risks & mitigations",
    "",
    "Rules:",
    "- Planning only — no code blocks.",
    "- MUST align with the provided stack (framework/language/styling) and category.",
    "- Call out admin/dashboard/e-commerce/multi-role needs explicitly when implied.",
    "- If project files exist, plan must integrate with them (feature/mixed/audit semantics).",
    "- NO TODOs or placeholder sections in the plan itself.",
  ].join("\n");
}

export function buildEngineeringPlanUserPayload(
  analysisBlock: string,
  request: Pick<GenerateRequest, "prompt" | "config"> & {
    normalizedFiles: FileEntry[];
  }
): string {
  const { prompt, config, normalizedFiles } = request;
  return [
    analysisBlock,
    "",
    "USER PROMPT:",
    (prompt?.trim() || "(see attachments)").slice(0, 8_000),
    "",
    "CONFIG:",
    JSON.stringify(config, null, 2),
    "",
    normalizedFiles.length ? `Existing paths (${normalizedFiles.length}): ${normalizedFiles.map((f) => f.path).slice(0, 80).join(", ")}` : "",
  ].join("\n");
}
