// ============================================================
// app/api/refine/route.ts — production refinement pipeline
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { openai, MAX_TOKENS, FAST_MAX_TOKENS, isReasoningModel } from "@/lib/openai";
import { resolveTaskModel } from "@/lib/model-selection";
import { buildRefinementSystemPrompt, buildRefinementUserPrompt } from "@/lib/prompts";
import { stripCodeFences, countLines, parseMultiFile, evaluateCodeQuality } from "@/lib/utils";
import { connectDB } from "@/lib/mongodb";
import Generation from "@/models/Generation";
import type { RefineRequest, QualityCheck } from "@/types";
import { getAuthenticatedUserId } from "@/lib/server-user";

export const maxDuration = 120;

const REFINEMENT_CHECKS = [
  "Verify change is applied correctly and completely",
  "Ensure no existing functionality was broken",
  "Check responsive layout still works after change",
  "Validate accessibility attributes are preserved",
  "Confirm code style consistency is maintained",
  "Verify no duplicate or dead code was introduced",
  "Check that performance-sensitive patterns are not degraded",
];

function buildRepairPrompt(
  code: string,
  checks: QualityCheck[],
  config: RefineRequest["config"]
): string {
  const failed = checks.filter((c) => !c.passed);
  return [
    "The refinement introduced issues. Repair them without removing the requested change.",
    "",
    `Category: ${config.category ?? "Frontend"}`,
    `Framework: ${config.framework ?? "unknown"}`,
    `Language: ${config.language ?? "unknown"}`,
    `Project type: ${config.projectType ?? "unknown"}`,
    "",
    "Failed checks:",
    ...failed.map((c, i) => `${i + 1}. ${c.name}: ${c.message}`),
    "",
    "Current code:",
    code,
    "",
    "Return the revised code only. No explanations. No code fences.",
  ].join("\n");
}

function buildChatParams(model: string, systemPrompt: string, userPrompt: string, maxTokens: number) {
  const reasoning = isReasoningModel(model);
  return {
    model,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
    reasoning_effort: "medium" as const,
    ...(reasoning ? {} : { temperature: 0.15 }),
  };
}

export async function POST(req: NextRequest) {
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-proj-your-openai-key-here"
  ) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  let body: RefineRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { refinePrompt, currentCode, config } = body;

  if (!refinePrompt?.trim() || !currentCode?.trim()) {
    return NextResponse.json(
      { error: "Refinement prompt and current code are required." },
      { status: 400 }
    );
  }

  const userId = await getAuthenticatedUserId();

  const systemPrompt = buildRefinementSystemPrompt(config);
  const enrichedPrompt = [
    refinePrompt,
    "",
    "After applying the change, silently verify these checks:",
    ...REFINEMENT_CHECKS.map((c, i) => `${i + 1}. ${c}`),
    "",
    "If any check fails, fix it automatically before outputting the final code.",
  ].join("\n");

  const userPrompt = buildRefinementUserPrompt(enrichedPrompt, currentCode, config);

  const primaryModel = resolveTaskModel("Refactoring", config);
  const repairModel = resolveTaskModel("Testing", config);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // ── Primary refinement pass ──────────────────────────
        const completion = await openai.chat.completions.create(
          buildChatParams(primaryModel, systemPrompt, userPrompt, MAX_TOKENS)
        );

        let finalCode = stripCodeFences(completion.choices[0]?.message?.content ?? "");

        // Guard: empty response from reasoning model
        if (!finalCode.trim()) {
          controller.enqueue(
            encoder.encode(
              "ERROR: The model returned an empty response during refinement. " +
                "Try again or switch to balanced mode."
            )
          );
          controller.close();
          return;
        }

        let finalFiles = parseMultiFile(finalCode);
        let quality = evaluateCodeQuality(finalCode, finalFiles, config);

        // ── Optional repair pass ─────────────────────────────
        const needsRepair = quality.checks.some(
          (c) => !c.passed && c.severity !== "info"
        );

        if (needsRepair) {
          const repair = await openai.chat.completions.create(
            buildChatParams(
              repairModel,
              `${systemPrompt}\n\nYou are in repair mode. Fix the failed checks only and preserve the requested refinement.`,
              buildRepairPrompt(finalCode, quality.checks, config),
              FAST_MAX_TOKENS
            )
          );

          const repaired = stripCodeFences(
            repair.choices[0]?.message?.content ?? finalCode
          );

          if (repaired.trim()) {
            const repairedFiles = parseMultiFile(repaired);
            const repairedQuality = evaluateCodeQuality(repaired, repairedFiles, config);
            if (
              repairedQuality.score >= quality.score ||
              repairedFiles.length >= finalFiles.length
            ) {
              finalCode = repaired;
              finalFiles = repairedFiles;
              quality = repairedQuality;
            }
          }
        }

        // ── MongoDB save (signed-in users only) ─────────────
        if (finalCode.trim() && userId) {
          try {
            await connectDB();
            await Generation.create({
              prompt: `[Refinement] ${refinePrompt.slice(0, 200)}`,
              code: finalCode,
              files: finalFiles,
              config,
              lines: countLines(finalCode),
              chars: finalCode.length,
              qualityScore: quality.score,
              qualityIssues: quality.checks
                .filter((c) => !c.passed)
                .map((c) => `${c.name}: ${c.message}`),
              imageUsed: false,
              refinementCount: 1,
            });
          } catch (dbErr) {
            console.error("[MongoDB Refine Save Error]", dbErr);
          }
        }

        controller.enqueue(encoder.encode(finalCode));
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Refinement failed";
        console.error("[Refine Error]", err);
        controller.enqueue(encoder.encode(`\n\nERROR: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
