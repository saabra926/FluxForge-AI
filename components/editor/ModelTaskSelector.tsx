"use client";

import { useMemo } from "react";
import { Info, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  AI_MODEL_OPTIONS,
  MODEL_TASK_CATEGORIES,
  badgeLabel,
  getModelOption,
  type ModelBadgeId,
} from "@/lib/ai-models";
import type { ModelTaskCategory } from "@/types";
import {
  previewResolvedMap,
  recommendedModelForTask,
  taskUsesRecommendedModel,
} from "@/lib/model-selection";

function ModelTooltip({ taskId, modelId }: { taskId: ModelTaskCategory; modelId: string }) {
  const meta = getModelOption(modelId);
  if (!meta) return null;
  return (
    <div
      className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-[min(92vw,280px)] -translate-x-1/2 rounded-xl border p-3 text-left opacity-0 shadow-xl transition-all group-hover/tooltip:pointer-events-auto group-hover/tooltip:visible group-hover/tooltip:opacity-100"
      style={{
        background: "var(--card)",
        borderColor: "var(--border2)",
        color: "var(--text2)",
      }}
    >
      <p className="text-[11px] font-bold" style={{ color: "var(--text)" }}>
        {meta.label}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed">
        <span className="font-semibold" style={{ color: "var(--blue)" }}>Best for:</span>{" "}
        {meta.bestFor.join(" · ")}
      </p>
      <p className="mt-1.5 text-[10px] leading-relaxed">
        <span className="font-semibold">Strengths:</span> {meta.strengths.join(" ")}
      </p>
      <p className="mt-1.5 text-[10px] leading-relaxed">
        <span className="font-semibold">Limitations:</span> {meta.limitations.join(" ")}
      </p>
      <p className="mt-1.5 text-[10px] font-medium" style={{ color: "var(--text3)" }}>
        Speed vs quality: {meta.speedVsQuality}
      </p>
      <p className="mt-2 text-[9px] uppercase tracking-wide" style={{ color: "var(--text3)" }}>
        Task: {taskId}
      </p>
    </div>
  );
}

function badgeForModel(
  task: ModelTaskCategory,
  modelId: string,
  mode: "fast" | "balanced" | "accurate"
): ModelBadgeId | null {
  const meta = getModelOption(modelId);
  if (!meta) return null;
  if (modelId === recommendedModelForTask(task, mode)) return "recommended";
  if (meta.badges.includes("fast")) return "fast";
  if (task === "Reasoning" || task === "Planning") return meta.badges.includes("reasoning") ? "reasoning" : null;
  if (task === "UI generation") return meta.badges.includes("ui") ? "ui" : null;
  if (task === "Backend generation") return meta.badges.includes("backend") ? "backend" : null;
  if (task === "Code generation" || task === "Refactoring") return meta.badges.includes("coding") ? "coding" : null;
  return null;
}

export function ModelTaskSelector() {
  const store = useAppStore();
  const { config, updateConfig } = store;
  const taskModels = config.taskModels ?? {};
  const useRec = config.useRecommendedTaskModels !== false;

  const resolvedPreview = useMemo(() => previewResolvedMap(config), [config]);

  const setTaskModel = (task: ModelTaskCategory, modelId: string | null) => {
    const next = { ...taskModels };
    if (!modelId) delete next[task];
    else next[task] = modelId;
    updateConfig({ taskModels: next });
  };

  const clearOverrides = () => updateConfig({ taskModels: {}, useRecommendedTaskModels: true });

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text3)" }}>
            AI models per task
          </p>
          <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "var(--text2)" }}>
            Recommendations follow your speed mode. Override any row — the pipeline always respects your picks.
          </p>
        </div>
        <button
          type="button"
          onClick={clearOverrides}
          className="flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-opacity hover:opacity-80"
          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[11px]" style={{ color: "var(--text2)" }}>
        <input
          type="checkbox"
          className="rounded border"
          style={{ borderColor: "var(--border2)" }}
          checked={useRec}
          onChange={(e) => updateConfig({ useRecommendedTaskModels: e.target.checked })}
        />
        Use recommended models for empty rows (guided defaults)
      </label>

      <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {MODEL_TASK_CATEGORIES.map(({ id, description }) => {
          const chosen = taskModels[id]?.trim();
          const effective = resolvedPreview[id];
          const recommended = recommendedModelForTask(id, config.mode);
          const usesRec = taskUsesRecommendedModel(id, config);
          const badge = badgeForModel(id, effective, config.mode);

          return (
            <div
              key={id}
              className="rounded-xl border p-2.5 transition-colors"
              style={{ borderColor: "var(--border2)", background: "var(--panel)" }}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold" style={{ color: "var(--text)" }}>
                  {id}
                </span>
                {usesRec && useRec && (
                  <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>
                    Recommended
                  </span>
                )}
                {badge && !(usesRec && useRec && badge === "recommended") && (
                  <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: "rgba(16,185,129,0.12)", color: "var(--green)" }}>
                    {badgeLabel(badge)}
                  </span>
                )}
                <div className="group/tooltip relative ml-auto">
                  <Info size={13} style={{ color: "var(--text3)" }} className="cursor-help" />
                  <ModelTooltip taskId={id} modelId={effective} />
                </div>
              </div>
              <p className="mb-2 text-[10px] leading-relaxed" style={{ color: "var(--text3)" }}>{description}</p>
              <select
                className="w-full rounded-lg border py-1.5 pl-2 pr-8 text-[11px] font-medium outline-none"
                style={{ borderColor: "var(--border2)", background: "var(--bg3)", color: "var(--text)" }}
                value={chosen || ""}
                onChange={(e) => setTaskModel(id, e.target.value || null)}
                title={getModelOption(effective)?.speedVsQuality}
              >
                <option value="">
                  Use recommendation ({getModelOption(recommended)?.label ?? recommended})
                </option>
                {AI_MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.shortLabel}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
