"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { getTemplateById } from "@/lib/templates";
import type { Framework, GenerationCategory } from "@/types";
import { buildEnhancedPromptDraft } from "@/lib/catalog";

function categoryForTemplate(cat: string): GenerationCategory {
  if (cat.includes("Dashboard") || cat === "SaaS / Subscription") return "Frontend";
  if (cat === "E-commerce Store") return "Website Development";
  if (cat === "Authentication") return "Website Development";
  if (cat === "Blog" || cat === "Marketing Site") return "Website Development";
  return "Website Development";
}

export function TemplateFromQuery() {
  const searchParams = useSearchParams();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    const tid = searchParams.get("template");
    if (!tid || applied.current === tid) return;
    const t = getTemplateById(tid);
    if (!t) return;
    applied.current = tid;
    const cat = categoryForTemplate(t.category);
    const draft = buildEnhancedPromptDraft(t.promptSnippet, cat);
    useAppStore.getState().setPrompt(draft);
    useAppStore.getState().updateConfig({
      category: cat,
      framework: t.frameworkHint as Framework,
      styling: ["Tailwind CSS"],
      projectType: cat === "Frontend" ? "Full Page" : "Full Page",
      includeHtml: true,
    });
  }, [searchParams]);

  return null;
}
