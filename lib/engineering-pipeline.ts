// ============================================================
// lib/engineering-pipeline.ts — planning, markers, validation passes
// ============================================================
import type { FileEntry, GenerateRequest } from "@/types";
import type { OpenAI } from "openai";
import {
  formatAnalysisForPlanContext,
  safeParsePromptAnalysis,
  buildPromptAnalysisSystemPrompt,
  buildPromptAnalysisUserPayload,
  buildEngineeringPlanSystemPrompt,
  buildEngineeringPlanUserPayload,
} from "@/lib/prompt-engineering";
import { FAST_MAX_TOKENS, isReasoningModel } from "@/lib/openai-constants";
import { stripCodeFences } from "@/lib/utils";

export const PHASE_PREFIX = "<<<UIGEN:PHASE:";
export const PLAN_START = "<<<UIGEN:PLAN>>>";
export const PLAN_END = "<<<UIGEN:END_PLAN>>>";

export function encodePhaseStart(index: number, name: string): string {
  return `${PHASE_PREFIX}${index}:start:${escapeMarker(name)}>>>\n`;
}

export function encodePhaseDone(index: number): string {
  return `${PHASE_PREFIX}${index}:done>>>\n`;
}

export function encodePlanBlock(plan: string): string {
  return `${PLAN_START}\n${plan.trim()}\n${PLAN_END}\n`;
}

function escapeMarker(s: string): string {
  return s.replace(/>/g, "›");
}

function chatParams(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  reasoning: "low" | "medium" | "high"
) {
  const reasoningModel = isReasoningModel(model);
  return {
    model,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
    max_completion_tokens: maxTokens,
    reasoning_effort: reasoning,
    ...(reasoningModel ? {} : { temperature: 0.2 }),
  };
}

export async function runPromptAnalysisPass(openai: OpenAI, params: {
  model: string;
  request: Pick<GenerateRequest, "prompt" | "config"> & {
    normalizedFiles: { path: string; content: string }[];
    modes: { auditMode: boolean; featureMode: boolean; mixedMode: boolean; hasImage: boolean };
  };
  reasoning: "low" | "medium" | "high";
}): Promise<{ raw: string; parsed: ReturnType<typeof safeParsePromptAnalysis> }> {
  const user = buildPromptAnalysisUserPayload(params.request);
  const completion = await openai.chat.completions.create(
    chatParams(
      params.model,
      buildPromptAnalysisSystemPrompt(),
      user,
      Math.min(FAST_MAX_TOKENS, 8192),
      params.reasoning
    )
  );
  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  return { raw, parsed: safeParsePromptAnalysis(raw) };
}

export async function runEngineeringPlanPass(openai: OpenAI, params: {
  model: string;
  analysisBlock: string;
  request: Pick<GenerateRequest, "prompt" | "config"> & {
    normalizedFiles: FileEntry[];
  };
  reasoning: "low" | "medium" | "high";
}): Promise<string> {
  const user = buildEngineeringPlanUserPayload(params.analysisBlock, {
    ...params.request,
    normalizedFiles: params.request.normalizedFiles ?? [],
  });
  const completion = await openai.chat.completions.create(
    chatParams(
      params.model,
      buildEngineeringPlanSystemPrompt(),
      user,
      Math.min(FAST_MAX_TOKENS, 8192),
      params.reasoning
    )
  );
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export interface ValidationIssue {
  severity: "blocker" | "major" | "minor";
  topic: string;
  detail: string;
}

export function buildFinalValidationUserPayload(params: {
  prompt: string;
  plan: string;
  analysisExcerpt: string;
  code: string;
  config: GenerateRequest["config"];
}): string {
  return [
    "You are a strict principal engineer doing a FINAL QUALITY AUDIT.",
    "Compare FINAL CODE against requirements, analysis, and engineering plan.",
    "",
    "STRICT AUDIT CRITERIA:",
    "1. Architecture: Is Clean Architecture strictly followed? (Layers separated, DI used?)",
    "2. Security: Are there any XSS, SQLi, or Auth gaps? (Input validation, proper headers?)",
    "3. Performance: Are there unnecessary re-renders or heavy computations in loops?",
    "4. Completeness: Are there ANY 'TODO's, placeholders, or truncated files?",
    "5. Resilience: Is there robust error handling for API calls and async ops?",
    "",
    "Return ONLY minified JSON: {issues:[{severity:'blocker'|'major'|'minor',topic:string,detail:string}],summary:string}",
    "",
    "CONFIG:",
    JSON.stringify(params.config, null, 2),
    "",
    "USER PROMPT:",
    params.prompt.slice(0, 4000),
    "",
    "ANALYSIS:",
    params.analysisExcerpt.slice(0, 3000),
    "",
    "PLAN:",
    params.plan.slice(0, 4000),
    "",
    "CODE (excerpt):",
    params.code.slice(0, 100_000),
  ].join("\n");
}

export async function runFinalValidationJson(openai: OpenAI, params: {
  model: string;
  user: string;
}): Promise<{ issues: ValidationIssue[]; summary: string } | null> {
  const completion = await openai.chat.completions.create(
    chatParams(
      params.model,
      "You are a strict release gatekeeper. Find gaps vs requirements. Be concise.",
      params.user,
      4096,
      "low"
    )
  );
  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const data = JSON.parse(raw) as { issues?: ValidationIssue[]; summary?: string };
    const issues = Array.isArray(data.issues) ? data.issues : [];
    return { issues, summary: String(data.summary ?? "") };
  } catch {
    return null;
  }
}

export function buildComplianceRepairPrompt(params: {
  issues: ValidationIssue[];
  code: string;
  config: GenerateRequest["config"];
}): string {
  return [
    "Fix the issues below. Preserve architecture and stack. Return raw code only (no markdown fences).",
    "",
    ...params.issues.slice(0, 20).map(
      (i, idx) => `${idx + 1}. [${i.severity}] ${i.topic}: ${i.detail}`
    ),
    "",
    `Category: ${params.config.category ?? "Frontend"}`,
    `Framework: ${params.config.framework ?? "unknown"}`,
    `Language: ${params.config.language ?? "unknown"}`,
    "",
    "CURRENT CODE:",
    params.code,
  ].join("\n");
}

export async function runComplianceRepairPass(openai: OpenAI, params: {
  model: string;
  systemPrompt: string;
  repairUserPrompt: string;
  reasoning: "low" | "medium" | "high";
}): Promise<string> {
  const completion = await openai.chat.completions.create(
    chatParams(
      params.model,
      `${params.systemPrompt}\n\nYou are in compliance repair mode.`,
      params.repairUserPrompt,
      FAST_MAX_TOKENS,
      params.reasoning
    )
  );
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export function heuristicAnalysisExcerpt(
  parsed: ReturnType<typeof safeParsePromptAnalysis>,
  rawFallback: string
): string {
  if (!parsed) return rawFallback.slice(0, 2000);
  return formatAnalysisForPlanContext(parsed).slice(0, 6000);
}
