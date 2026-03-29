// ============================================================
// app/api/generate/route.ts — universal generation pipeline
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  openai,
  FAST_MODEL,
  MAX_TOKENS,
  FAST_MAX_TOKENS,
  isReasoningModel,
} from "@/lib/openai";
import {
  buildFrontendSystemPrompt,
  buildFrontendUserMessage,
  buildFeatureEnhancementSystemPrompt,
  buildFeatureEnhancementUserMessage,
  buildMixedUploadUserMessage,
} from "@/lib/prompts";
import {
  stripCodeFences,
  countLines,
  parseMultiFile,
  evaluateCodeQuality,
  splitAuditResponse,
  isProbablyTextFile,
  truncateProjectContent,
} from "@/lib/utils";
import { connectDB } from "@/lib/mongodb";
import Generation from "@/models/Generation";
import type { FileEntry, GenerateRequest } from "@/types";
import { normalizeExtraLibraries } from "@/lib/extra-libraries";
import { resolvePipelineModels } from "@/lib/model-selection";
import { formatAnalysisForPlanContext } from "@/lib/prompt-engineering";
import {
  encodePhaseStart,
  encodePhaseDone,
  encodePlanBlock,
  runPromptAnalysisPass,
  runEngineeringPlanPass,
  runFinalValidationJson,
  buildFinalValidationUserPayload,
  buildComplianceRepairPrompt,
  heuristicAnalysisExcerpt,
  runComplianceRepairPass,
} from "@/lib/engineering-pipeline";
import { validateGenerationConfig } from "@/lib/generation-config";
import { getAuthenticatedUserId } from "@/lib/server-user";

export const maxDuration = 300;

const PHASE_NAMES = [
  "Deep prompt analysis",
  "Requirement extraction & chunking",
  "Stack, model & architecture fit",
  "Plan validation gate",
  "Folder structure & scaffolding plan",
  "Code generation",
  "Syntax & logic verification",
  "Gap, bug & inconsistency sweep",
  "Repair, format & refactor pass",
  "Final compliance & prompt alignment",
] as const;

// ── helpers ──────────────────────────────────────────────────

function reasoningForMode(mode: GenerateRequest["config"]["mode"]) {
  if (mode === "fast") return "low" as const;
  if (mode === "balanced") return "medium" as const;
  return "high" as const;
}

function normalizeProjectFiles(files: FileEntry[] = []) {
  return files
    .filter((f) => f?.path && typeof f.content === "string")
    .slice(0, 60)
    .map((f) => ({
      path: f.path,
      content: isProbablyTextFile(f.path)
        ? truncateProjectContent(f.content, 8_000)
        : "[binary or unsupported file omitted]",
      language: f.language || "text",
    }));
}

function buildFallbackPrompt(
  input: string,
  config: GenerateRequest["config"],
): string {
  return [
    "The code needs one final repair pass.",
    "Fix only obvious syntax, import, structure, and accessibility issues while preserving the design.",
    "",
    `Category: ${config.category ?? "Frontend"}`,
    `Framework: ${config.framework}`,
    `Language: ${config.language}`,
    `Project type: ${config.projectType}`,
    "",
    "Current content:",
    input,
    "",
    "Return corrected code only. No explanations. No code fences.",
  ].join("\n");
}

function engineeringHardRules(): string {
  return [
    "ENGINEERING PIPELINE (non-negotiable):",
    "- Planning and analysis precede implementation. Follow the internal brief and plan exactly.",
    "- Never return incomplete structure: no TODO stubs, no lorem, no truncated files.",
    "- Honor framework, language, styling, accessibility level, and project type from config.",
    "- Multi-file projects must use // ===FILE: path=== markers with // ===END FILE=== as usual.",
  ].join("\n");
}

async function runBufferedCompletion(params: {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  reasoning: "low" | "medium" | "high";
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  const useReasoning = isReasoningModel(params.model);
  const completion = await openai.chat.completions.create({
    model: params.model,
    messages: params.messages,
    max_completion_tokens: params.maxTokens,
    reasoning_effort: params.reasoning,
    ...(useReasoning ? {} : { temperature: params.temperature }),
    stream: false,
  });
  return completion.choices[0]?.message?.content ?? "";
}

function enqueueChunks(
  text: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  const chunkSize = 4096;
  for (let i = 0; i < text.length; i += chunkSize) {
    controller.enqueue(encoder.encode(text.slice(i, i + chunkSize)));
  }
}

async function saveToMongo(params: {
  prompt: string;
  finalCode: string;
  finalFiles: ReturnType<typeof parseMultiFile>;
  config: GenerateRequest["config"];
  quality: ReturnType<typeof evaluateCodeQuality>;
  imageUsed: boolean;
  userId: string | null;
}) {
  const { prompt, finalCode, finalFiles, config, quality, imageUsed, userId } =
    params;

  if (!userId) {
    return;
  }

  if (!finalCode.trim()) {
    console.warn("[MongoDB] Skipped save – finalCode is empty.");
    return;
  }

  try {
    await connectDB();
    await Generation.create({
      prompt: (prompt?.trim() || "Screenshot / project upload").slice(0, 5_000),
      code: finalCode,
      files: finalFiles,
      config,
      lines: countLines(finalCode),
      chars: finalCode.length,
      qualityScore: quality.score,
      qualityIssues: quality.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.name}: ${c.message}`),
      imageUsed,
      refinementCount: 0,
    });
  } catch (dbErr) {
    console.error("[MongoDB Save Error]", dbErr);
  }
}

// ── main handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-proj-your-openai-key-here"
  ) {
    return NextResponse.json(
      {
        error:
          "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local.",
      },
      { status: 500 },
    );
  }

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const {
    prompt,
    imageBase64,
    projectFiles,
    config,
    extraLibraries: rawExtraLibs,
  } = body;
  const extraLibraries = normalizeExtraLibraries(rawExtraLibs);

  const configErr = validateGenerationConfig(config);
  if (configErr) {
    return NextResponse.json({ error: configErr }, { status: 400 });
  }

  const userId = await getAuthenticatedUserId();

  const normalizedFiles = normalizeProjectFiles(projectFiles ?? []);
  const models = resolvePipelineModels(config);

  const isAuditCategory = config.category === "Project Audit";
  const hasFiles = normalizedFiles.length > 0;
  const hasImage = !!imageBase64;

  const auditMode = isAuditCategory && hasFiles;
  const featureMode = hasFiles && !isAuditCategory;
  const mixedMode = hasFiles && hasImage;

  if (!prompt?.trim() && !hasImage && !hasFiles) {
    return NextResponse.json(
      {
        error:
          "Please provide a prompt, upload an image, or add a project zip/folder.",
      },
      { status: 400 },
    );
  }

  let systemPrompt: string;
  let userContent: string;

  if (auditMode) {
    systemPrompt = buildFrontendSystemPrompt(config, extraLibraries);
    userContent = buildFrontendUserMessage(
      prompt ?? "",
      imageBase64,
      config,
      normalizedFiles,
    );
  } else if (mixedMode) {
    systemPrompt = buildFeatureEnhancementSystemPrompt(config, extraLibraries);
    userContent = buildMixedUploadUserMessage(
      prompt ?? "",
      normalizedFiles,
      imageBase64!,
      config,
    );
  } else if (featureMode) {
    systemPrompt = buildFeatureEnhancementSystemPrompt(config, extraLibraries);
    userContent = buildFeatureEnhancementUserMessage(
      prompt ?? "",
      normalizedFiles,
      config,
    );
  } else {
    systemPrompt = buildFrontendSystemPrompt(config, extraLibraries);
    userContent = buildFrontendUserMessage(
      prompt ?? "",
      imageBase64,
      config,
      [],
    );
  }

  systemPrompt = `${systemPrompt}\n\n${engineeringHardRules()}`;

  const codeModel = models.codeGeneration;
  const maxTokens = config.mode === "fast" ? FAST_MAX_TOKENS : MAX_TOKENS;
  const reasoning = reasoningForMode(config.mode);
  const temperature =
    config.mode === "accurate"
      ? 0.15
      : config.mode === "balanced"
        ? 0.35
        : 0.55;

  const analysisPayload = {
    prompt,
    config,
    normalizedFiles,
    modes: { auditMode, featureMode, mixedMode, hasImage },
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finalText = "";

      try {
        // ── Phase 1–2: analysis ────────────────────────────
        controller.enqueue(encoder.encode(encodePhaseStart(1, PHASE_NAMES[0])));
        const analysis = await runPromptAnalysisPass(openai, {
          model: models.reasoning,
          request: analysisPayload,
          reasoning,
        });
        controller.enqueue(encoder.encode(encodePhaseDone(1)));
        const parsed = analysis.parsed;
        const analysisBlock = formatAnalysisForPlanContext(parsed);

        controller.enqueue(encoder.encode(encodePhaseStart(2, PHASE_NAMES[1])));
        controller.enqueue(encoder.encode(encodePhaseDone(2)));

        // ── Phase 3–5: planning ────────────────────────────
        controller.enqueue(encoder.encode(encodePhaseStart(3, PHASE_NAMES[2])));
        let planBody = "";
        if (config.mode === "fast") {
          planBody = analysisBlock;
        } else {
          planBody = await runEngineeringPlanPass(openai, {
            model: models.planning,
            analysisBlock,
            request: { prompt, config, normalizedFiles },
            reasoning,
          });
        }
        controller.enqueue(encoder.encode(encodePhaseDone(3)));
        controller.enqueue(encoder.encode(encodePlanBlock(planBody)));

        controller.enqueue(encoder.encode(encodePhaseStart(4, PHASE_NAMES[3])));
        controller.enqueue(encoder.encode(encodePhaseDone(4)));

        controller.enqueue(encoder.encode(encodePhaseStart(5, PHASE_NAMES[4])));
        controller.enqueue(encoder.encode(encodePhaseDone(5)));

        const augmentedUser = [
          analysisBlock,
          "",
          "=== ENGINEERING PLAN ===",
          planBody,
          "",
          "--- ORIGINAL TASK (AUTHORITATIVE VISUALS / UPLOAD CONTEXT) ---",
          userContent,
        ].join("\n");

        const messages = [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: augmentedUser },
        ];

        // ── Phase 6: code generation (buffered so verification can amend before any bytes ship) ──
        controller.enqueue(encoder.encode(encodePhaseStart(6, PHASE_NAMES[5])));

        try {
          finalText = await runBufferedCompletion({
            model: codeModel,
            messages,
            reasoning,
            temperature,
            maxTokens,
          });

          // Multi-pass refinement for HIGH complexity
          if (parsed?.complexity === "high" && config.mode === "accurate") {
            const refinementMsg = [
              "The initial implementation is done. Now, perform a surgical refinement pass.",
              "Focus on: advanced error handling, security edge cases, and performance optimizations.",
              "Ensure Clean Architecture is strictly followed. Remove any minor duplication.",
              "Return the COMPLETE updated project code. No code fences.",
            ].join("\n");

            finalText = await runBufferedCompletion({
              model: codeModel,
              messages: [
                ...messages,
                { role: "assistant", content: finalText },
                { role: "user", content: refinementMsg },
              ],
              reasoning: "medium",
              temperature: 0.1,
              maxTokens,
            });
          }
        } catch (primaryErr) {
          const shouldFallback = !auditMode && codeModel !== FAST_MODEL;
          if (!shouldFallback) throw primaryErr;
          const errMsg =
            primaryErr instanceof Error
              ? primaryErr.message
              : String(primaryErr);
          console.warn(
            "[Generate] Primary model failed, falling back:",
            errMsg,
          );
          finalText = await runBufferedCompletion({
            model: FAST_MODEL,
            messages: [
              {
                role: "system",
                content: `${systemPrompt}\n\nDeliver a concise, production-ready answer.`,
              },
              {
                role: "user",
                content: buildFallbackPrompt(augmentedUser, config),
              },
            ],
            reasoning: "low",
            temperature: 0.2,
            maxTokens: FAST_MAX_TOKENS,
          });
        }

        controller.enqueue(encoder.encode(encodePhaseDone(6)));

        let responseText = stripCodeFences(finalText);

        // ── Phase 7–8: local verification ─────────────────
        controller.enqueue(encoder.encode(encodePhaseStart(7, PHASE_NAMES[6])));
        controller.enqueue(encoder.encode(encodePhaseDone(7)));

        controller.enqueue(encoder.encode(encodePhaseStart(8, PHASE_NAMES[7])));

        if (!responseText.trim()) {
          controller.enqueue(
            encoder.encode(
              "\n\nERROR: The model returned an empty response. " +
                "This usually means the reasoning model exhausted its token budget. " +
                "Try switching to 'balanced' or 'fast' mode, or simplify your prompt.",
            ),
          );
          controller.close();
          return;
        }

        const audit = auditMode
          ? splitAuditResponse(responseText)
          : { report: "", code: responseText };
        let finalCode = (
          auditMode ? audit.code || responseText : responseText
        ).trim();
        let finalFiles = parseMultiFile(finalCode);
        let quality = evaluateCodeQuality(finalCode, finalFiles, config);

        const needsLocalRepair =
          !auditMode &&
          quality.checks.some((c) => !c.passed && c.severity !== "info");

        if (needsLocalRepair) {
          const repairUserMsg = [
            "Failed checks:",
            ...quality.checks
              .filter((c) => !c.passed)
              .map((c, i) => `${i + 1}. ${c.name}: ${c.message}`),
            "",
            "CODE:",
            finalCode,
            "",
            "Return corrected raw code only. No code fences.",
          ].join("\n");

          const repairedRaw = await runComplianceRepairPass(openai, {
            model: models.refinement,
            systemPrompt: `${systemPrompt}\n\nYou are in repair mode. Fix failed quality checks only. Preserve design and architecture.`,
            repairUserPrompt: repairUserMsg,
            reasoning: "low",
          });

          const repaired = stripCodeFences(repairedRaw);
          if (repaired.trim()) {
            const repairedFiles = parseMultiFile(repaired);
            const repairedQuality = evaluateCodeQuality(
              repaired,
              repairedFiles,
              config,
            );
            if (
              repairedQuality.score >= quality.score ||
              repairedFiles.length >= finalFiles.length
            ) {
              finalCode = repaired.trim();
              finalFiles = repairedFiles;
              quality = repairedQuality;
            }
          }
        }

        controller.enqueue(encoder.encode(encodePhaseDone(8)));

        // ── Phase 9: structured compliance (balanced/accurate) ──
        controller.enqueue(encoder.encode(encodePhaseStart(9, PHASE_NAMES[8])));

        if (config.mode !== "fast" && !auditMode) {
          const gate = await runFinalValidationJson(openai, {
            model: models.compliance,
            user: buildFinalValidationUserPayload({
              prompt: prompt ?? "",
              plan: planBody,
              analysisExcerpt: heuristicAnalysisExcerpt(parsed, analysis.raw),
              code: finalCode,
              config,
            }),
          });

          const bad =
            gate?.issues?.filter(
              (i) => i.severity === "blocker" || i.severity === "major",
            ) ?? [];
          if (bad.length) {
            const repairUser = buildComplianceRepairPrompt({
              issues: bad,
              code: finalCode,
              config,
            });
            const repaired2Raw = await runComplianceRepairPass(openai, {
              model: models.refinement,
              systemPrompt,
              repairUserPrompt: repairUser,
              reasoning: "medium",
            });
            const repaired2 = stripCodeFences(repaired2Raw);
            if (repaired2.trim()) {
              const rf = parseMultiFile(repaired2);
              const rq = evaluateCodeQuality(repaired2, rf, config);
              if (rq.score >= quality.score || rf.length >= finalFiles.length) {
                finalCode = repaired2.trim();
                finalFiles = rf;
                quality = rq;
              }
            }
          }
        }

        controller.enqueue(encoder.encode(encodePhaseDone(9)));

        // ── Phase 10: done ─────────────────────────────────
        controller.enqueue(
          encoder.encode(encodePhaseStart(10, PHASE_NAMES[9])),
        );
        controller.enqueue(encoder.encode(encodePhaseDone(10)));

        const auditReport = auditMode ? audit.report : "";
        const streamBody = auditMode
          ? auditReport
            ? `<<<REPORT>>>\n${auditReport}\n<<<CODE>>>\n${finalCode}`
            : finalCode
          : finalCode;

        enqueueChunks(streamBody, controller, encoder);

        await saveToMongo({
          prompt: prompt ?? "",
          finalCode,
          finalFiles,
          config,
          quality,
          imageUsed: hasImage,
          userId,
        });

        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        console.error("[Generate Error]", err);
        controller.enqueue(encoder.encode(`\n\nERROR: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
