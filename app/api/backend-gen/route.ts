// ============================================================
// app/api/backend-gen/route.ts — Backend project generator
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { openai, MAX_TOKENS, FAST_MAX_TOKENS, isReasoningModel } from "@/lib/openai";
import { resolveTaskModel } from "@/lib/model-selection";
import type { GenerationConfig } from "@/types";
import { buildBackendSystemPrompt, buildBackendUserMessage } from "@/lib/prompts";
import { connectDB } from "@/lib/mongodb";
import Generation from "@/models/Generation";
import { stripCodeFences, countLines, parseMultiFile, evaluateCodeQuality } from "@/lib/utils";
import type { BackendGenRequest, QualityCheck } from "@/types";
import { normalizeExtraLibraries } from "@/lib/extra-libraries";
import { getAuthenticatedUserId } from "@/lib/server-user";

export const maxDuration = 120;

function buildRepairPrompt(code: string, checks: QualityCheck[], config: BackendGenRequest): string {
  const failed = checks.filter((c) => !c.passed);
  return [
    "The backend output needs a repair pass.",
    `Framework: ${config.backendFramework}`,
    `Language: ${config.language}`,
    `Database: ${config.database}`,
    "",
    "Failed checks:",
    ...failed.map((c, i) => `${i + 1}. ${c.name}: ${c.message}`),
    "",
    "Current code:",
    code,
    "",
    "Return the corrected backend code only. No explanations. No code fences.",
  ].join("\n");
}

function buildChatParams(model: string, systemPrompt: string, userMsg: string, maxTokens: number) {
  const reasoning = isReasoningModel(model);
  return {
    model,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMsg },
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
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
  }

  let body: BackendGenRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  body = { ...body, extraLibraries: normalizeExtraLibraries(body.extraLibraries) };

  const { description, backendFramework, database, language, includeAuth, includeTests, aiModel } = body;
  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }

  const userId = await getAuthenticatedUserId();

  const systemPrompt = buildBackendSystemPrompt(body);
  const userMessage = buildBackendUserMessage(body);

  const backendConfig = {
    category: "Backend" as const,
    framework: "Next.js" as const,
    styling: [] as [],
    language,
    projectType: "Backend API" as const,
    a11y: "None" as const,
    mode: "accurate" as const,
    backendFramework,
    database,
    includeAuth,
    includeTests,
  };

  const modelSelectionConfig: GenerationConfig = {
    ...backendConfig,
    useRecommendedTaskModels: true,
    taskModels: aiModel ? { "Backend generation": aiModel } : {},
  };
  const primaryModel = aiModel?.trim() || resolveTaskModel("Backend generation", modelSelectionConfig);
  const repairModel = resolveTaskModel("Refactoring", modelSelectionConfig);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // ── Primary generation pass ──────────────────────────
        const completion = await openai.chat.completions.create(
          buildChatParams(primaryModel, systemPrompt, userMessage, MAX_TOKENS)
        );

        let finalCode = stripCodeFences(completion.choices[0]?.message?.content ?? "");

        // Guard: empty response
        if (!finalCode.trim()) {
          controller.enqueue(
            encoder.encode(
              "ERROR: The model returned an empty response. " +
                "Try again or simplify your description."
            )
          );
          controller.close();
          return;
        }

        let finalFiles = parseMultiFile(finalCode);
        let quality = evaluateCodeQuality(finalCode, finalFiles, backendConfig);

        // ── Optional repair pass ─────────────────────────────
        if (quality.checks.some((c) => !c.passed && c.severity !== "info")) {
          const repair = await openai.chat.completions.create(
            buildChatParams(
              repairModel,
              `${systemPrompt}\n\nYou are in repair mode. Fix only the failed checks and preserve the requested backend architecture.`,
              buildRepairPrompt(finalCode, quality.checks, body),
              FAST_MAX_TOKENS
            )
          );

          const repaired = stripCodeFences(repair.choices[0]?.message?.content ?? "");
          if (repaired.trim()) {
            const repairedFiles = parseMultiFile(repaired);
            const repairedQuality = evaluateCodeQuality(repaired, repairedFiles, backendConfig);
            if (repairedQuality.score >= quality.score || repairedFiles.length >= finalFiles.length) {
              finalCode = repaired;
              finalFiles = repairedFiles;
              quality = repairedQuality;
            }
          }
        }

        // ── MongoDB save (signed-in users only) ──────────────
        if (finalCode.trim() && userId) {
          try {
            await connectDB();
            await Generation.create({
              prompt: `[Backend] ${description.slice(0, 200)}`,
              code: finalCode,
              files: finalFiles,
              config: backendConfig,
              lines: countLines(finalCode),
              chars: finalCode.length,
              qualityScore: quality.score,
              qualityIssues: quality.checks
                .filter((c) => !c.passed)
                .map((c) => `${c.name}: ${c.message}`),
              imageUsed: false,
            });
          } catch (dbErr) {
            console.error("[MongoDB Backend Save Error]", dbErr);
          }
        }

        controller.enqueue(encoder.encode(finalCode));
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Backend generation failed";
        console.error("[Backend-Gen Error]", err);
        controller.enqueue(encoder.encode(`\n\nERROR: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-store" },
  });
}
