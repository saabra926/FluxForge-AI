// ============================================================
// hooks/useGenerate.ts — Generation & Refinement hooks
// ============================================================
"use client";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppStore, PIPELINE_STEPS, type AppState } from "@/store/useAppStore";
import {
  stripCodeFences,
  generateId,
  countLines,
  evaluateCodeQuality,
  parseMultiFile,
  splitAuditResponse,
  stripEngineeringStreamMarkers,
  extractEngineeringPlan,
} from "@/lib/utils";
import type { HistoryEntry } from "@/types";
import { validateGenerationConfig } from "@/lib/generation-config";

function syncPipelineStepsFromRaw(raw: string, store: AppState) {
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    const n = i + 1;
    const done = raw.includes(`<<<UIGEN:PHASE:${n}:done>>>`);
    const started = raw.includes(`<<<UIGEN:PHASE:${n}:start:`);
    if (done) {
      store.completeStep(i, "✓ Completed");
      continue;
    }
    if (started) {
      store.advanceStep(i);
      break;
    }
    break;
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
  } catch {
    return fallback;
  }
}

async function streamTextResponse(res: Response, onChunk: (chunk: string) => void): Promise<string> {
  if (!res.body) throw new Error("No response body from server");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const errorMatch = chunk.match(/\n\nERROR:\s*([\s\S]*)/);
    if (errorMatch) {
      throw new Error(errorMatch[1].trim());
    }

    full += chunk;
    onChunk(full);
  }

  return full;
}

function parsePlainResponse(raw: string) {
  const stripped = stripEngineeringStreamMarkers(raw);
  const responseText = stripCodeFences(stripped);
  const audit = responseText.includes("<<<REPORT>>>") || responseText.includes("<<<CODE>>>") ? splitAuditResponse(responseText) : { report: "", code: responseText };
  const cleanCode = stripCodeFences(audit.code || responseText);
  const files = parseMultiFile(cleanCode);
  return { responseText, audit, cleanCode, files };
}

export function useGenerate() {
  const store = useAppStore();
  const { status } = useSession();

  const generate = useCallback(async (): Promise<{ error?: string; success?: boolean }> => {
    const { prompt, imageBase64, config, projectFiles, extraLibraries } = store;
    const libsPayload = extraLibraries
      .filter((l) => l.name.trim())
      .map((l) => ({ name: l.name.trim(), purpose: l.purpose.trim() }));

    if (!prompt.trim() && !imageBase64 && projectFiles.length === 0) {
      return { error: "Please enter a description, upload a screenshot, or add a project zip/folder." };
    }

    const cfgErr = validateGenerationConfig(config);
    if (cfgErr) return { error: cfgErr };

    store.setGenerating(true);
    store.resetPipeline();
    store.setAnalysisReport("");
    store.setOutputView("pipeline");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageBase64,
          projectFiles,
          config,
          ...(libsPayload.length ? { extraLibraries: libsPayload } : {}),
        }),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res, `HTTP ${res.status}`));

      const fullResponse = await streamTextResponse(res, (full) => {
        syncPipelineStepsFromRaw(full, store);
        const plan = extractEngineeringPlan(full);
        if (plan) store.setAnalysisReport(plan);
        const forDisplay = stripEngineeringStreamMarkers(full);
        store.setGeneratedCode(stripCodeFences(forDisplay));
      });

      const { audit, cleanCode, files } = parsePlainResponse(fullResponse);
      const quality = evaluateCodeQuality(cleanCode, files, store.config);

      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        store.completeStep(i, "✓ Completed");
      }

      if (audit.report) store.setAnalysisReport(audit.report);
      store.setGeneratedCode(cleanCode, files);
      store.setQualityScore(quality.score);
      store.setQualityChecks(quality.checks);
      if (audit.report) store.setOutputView("audit");

      if (status === "authenticated") {
        const entry: HistoryEntry = {
          id: generateId(),
          prompt: (prompt || (projectFiles.length > 0 ? "Project audit upload" : "Screenshot upload")).slice(0, 80) + ((prompt?.length ?? 0) > 80 ? "..." : ""),
          code: cleanCode,
          files,
          config,
          timestamp: Date.now(),
          lines: countLines(cleanCode),
          qualityScore: quality.score,
        };
        store.addToHistory(entry);
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      store.completeStep(PIPELINE_STEPS.length - 1, `✗ ${msg}`);
      return { error: msg };
    } finally {
      store.setGenerating(false);
    }
  }, [store, status]);

  return { generate };
}

export function useBackendGenerate() {
  const store = useAppStore();

  const generate = useCallback(async (): Promise<{ error?: string; success?: boolean }> => {
    const { backendConfig, extraLibraries } = store;
    const libsPayload = extraLibraries
      .filter((l) => l.name.trim())
      .map((l) => ({ name: l.name.trim(), purpose: l.purpose.trim() }));

    if (!backendConfig.description.trim()) {
      return { error: "Add a backend description first." };
    }

    store.setGenerating(true);

    try {
      const aiModel = store.config.taskModels?.["Backend generation"]?.trim();

      const res = await fetch("/api/backend-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...backendConfig, ...(aiModel ? { aiModel } : {}) }),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res, `HTTP ${res.status}`));

      const raw = await res.text();
      const parsed = parsePlainResponse(raw);
      const quality = evaluateCodeQuality(parsed.cleanCode, parsed.files, {
        category: "Backend",
        framework: "Next.js",
        styling: ["Custom CSS"],
        language: backendConfig.language,
        projectType: "Backend API",
        a11y: "None",
        mode: "accurate",
        backendFramework: backendConfig.backendFramework,
        database: backendConfig.database,
        includeAuth: backendConfig.includeAuth,
        includeTests: backendConfig.includeTests,
      });

      store.setBackendCode(parsed.cleanCode);
      store.setGeneratedCode(parsed.cleanCode, parsed.files);
      store.setQualityScore(quality.score);
      store.setQualityChecks(quality.checks);
      store.setOutputView("backend");

      return { success: true };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Backend generation failed" };
    } finally {
      store.setGenerating(false);
    }
  }, [store]);

  return { generate };
}

export function useRefine() {
  const store = useAppStore();
  const { status } = useSession();

  const refine = useCallback(async (refinePrompt: string): Promise<{ error?: string; success?: boolean }> => {
    if (!refinePrompt.trim()) return { error: "Enter a refinement instruction." };
    if (!store.generatedCode) return { error: "Generate code first before refining." };

    store.setGenerating(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refinePrompt, currentCode: store.generatedCode, config: store.config }),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res, `HTTP ${res.status}`));

      const raw = await res.text();
      const parsed = parsePlainResponse(raw);
      const quality = evaluateCodeQuality(parsed.cleanCode, parsed.files, store.config);

      store.setGeneratedCode(parsed.cleanCode, parsed.files);
      store.setQualityScore(quality.score);
      store.setQualityChecks(quality.checks);

      if (status === "authenticated") {
        const entry: HistoryEntry = {
          id: generateId(),
          prompt: `Refine: ${refinePrompt.slice(0, 60)}`,
          code: parsed.cleanCode,
          files: parsed.files,
          config: store.config,
          timestamp: Date.now(),
          lines: countLines(parsed.cleanCode),
          qualityScore: quality.score,
        };
        store.addToHistory(entry);
      }

      return { success: true };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Refinement failed" };
    } finally {
      store.setGenerating(false);
    }
  }, [store, status]);

  return { refine };
}
