"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Circle, TrendingUp, ShieldCheck, Trophy, Target, Zap } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { countLines, cn } from "@/lib/utils";

export function PipelineView() {
  const { pipelineSteps, generatedCode, generatedFiles, isGenerating, qualityScore, qualityChecks } = useAppStore();
  const anyStarted = pipelineSteps.some((s) => s.status !== "pending");
  const hasResult = !!generatedCode && !isGenerating;

  if (!anyStarted) return <EmptyState />;

  const getQualityColor = (s: number) => s >= 85 ? "var(--green)" : s >= 65 ? "var(--blue)" : s >= 45 ? "var(--amber)" : "var(--red)";

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-5">
        <h2 className="font-syne font-extrabold text-lg gradient-text mb-1">Verified AI Pipeline</h2>
        <p className="text-[12px]" style={{ color: "var(--text2)" }}>
          Prompt analysis → engineering plan → verified generation → compliance gate
        </p>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {pipelineSteps.map((step, i) => (
            <motion.div key={step.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }} className="flex gap-3 p-3 rounded-xl transition-all"
              style={{ background: step.status === "running" ? "rgba(59,130,246,0.06)" : step.status === "done" ? "rgba(16,185,129,0.03)" : "transparent",
                border: `1px solid ${step.status === "running" ? "rgba(59,130,246,0.2)" : step.status === "done" ? "rgba(16,185,129,0.12)" : "transparent"}` }}>
              <div className="flex-shrink-0 mt-0.5">
                {step.status === "done" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--green)", color: "#fff" }}>
                    <CheckCircle2 size={13} />
                  </div>
                )}
                {step.status === "running" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center animate-glow-pulse"
                    style={{ background: "var(--blue-dim)", border: "2px solid var(--blue)", color: "var(--blue)" }}>
                    <Loader2 size={11} className="animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "2px solid var(--border2)", color: "var(--text3)" }}>
                    <Circle size={8} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold" style={{ color: step.status === "pending" ? "var(--text3)" : "var(--text)" }}>
                    {step.id}. {step.name}
                  </p>
                  {step.status === "running" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                    style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>Processing...</span>}
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text2)" }}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hasResult && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
            <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={15} style={{ color: "var(--green)" }} />
                <span className="text-[13px] font-bold" style={{ color: "var(--green)" }}>Generation Complete</span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text2)" }}>Switch to Code, Preview, or download the project zip.</p>
            </div>

            {/* Confidential Score Board */}
            <div className="rounded-2xl p-5 space-y-4 shadow-xl border" style={{ background: "var(--card)", borderColor: "var(--border2)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Trophy size={16} />
                  </div>
                  <span className="text-[13px] font-bold font-syne uppercase tracking-wider">Engineering Audit Score</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[24px] font-black font-syne leading-none" style={{ color: getQualityColor(qualityScore) }}>
                    {qualityScore}<span className="text-[12px] opacity-60 ml-0.5">/100</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-50 mt-1">Confidential Rating</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase opacity-60">
                  <span>Reliability Index</span>
                  <span>{qualityScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border2)" }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${qualityScore}%` }}
                    transition={{ duration: 1, ease: "circOut" }} style={{ background: getQualityColor(qualityScore) }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}>
                  <Target size={14} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] font-bold opacity-60 uppercase">Precision</p>
                    <p className="text-[12px] font-black">{Math.min(100, qualityScore + 5)}%</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}>
                  <Zap size={14} className="text-amber-500" />
                  <div>
                    <p className="text-[10px] font-bold opacity-60 uppercase">Velocity</p>
                    <p className="text-[12px] font-black">Fast</p>
                  </div>
                </div>
              </div>
            </div>

            {qualityChecks.length > 0 && (
              <div className="rounded-xl p-3.5" style={{ background: "var(--card)", border: "1px solid var(--border2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={13} style={{ color: "var(--green)" }} />
                  <span className="text-[11px] font-bold" style={{ color: "var(--text2)" }}>Verification Checks</span>
                </div>
                <div className="space-y-2">
                  {qualityChecks.slice(0, 5).map((check) => (
                    <div key={check.name} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <span style={{ color: check.passed ? "var(--green)" : check.severity === "error" ? "var(--red)" : "var(--amber)" }}>
                        {check.passed ? "✓" : "•"}
                      </span>
                      <div>
                        <p style={{ color: "var(--text)" }}>{check.name}</p>
                        <p style={{ color: "var(--text2)" }}>{check.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Lines", value: countLines(generatedCode) },
                { label: "Chars", value: generatedCode.length.toLocaleString() },
                { label: "Files", value: String(Math.max(generatedFiles.length, 1)) },
              ].map((s) => (
                <div key={s.label} className="text-center rounded-xl py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="font-syne font-extrabold text-base gradient-text">{s.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--text2)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 animate-float"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)" }}>⚡</div>
      <h3 className="font-syne font-extrabold text-lg mb-2 gradient-text">Ready to Generate</h3>
      <p className="text-[12px] leading-relaxed mb-5" style={{ color: "var(--text2)", maxWidth: "300px" }}>
        Choose a category, describe your UI, and let the verified generation pipeline build it.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {["GPT-5.4", "Category first", "Zip-ready full stack", "Verification checks"].map((f) => (
          <span key={f} className="text-[10px] px-2.5 py-1 rounded-full border"
            style={{ borderColor: "rgba(59,130,246,0.2)", color: "var(--blue)", background: "var(--blue-dim)" }}>{f}</span>
        ))}
      </div>
    </div>
  );
}
