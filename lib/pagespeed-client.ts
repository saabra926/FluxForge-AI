/**
 * Google PageSpeed Insights API v5 — same Lighthouse engine as Chrome DevTools.
 * Requires GOOGLE_PAGESPEED_API_KEY in server environment.
 */

export type PageSpeedStrategy = "mobile" | "desktop";

export type CategoryScores = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
};

export type MetricRow = { id: string; title: string; display: string | null; score: number | null };

export type FieldMetricRow = { id: string; percentile?: string; category?: string };

export type AuditTip = { id: string; title: string; description: string };

type LhrCategories = Record<
  string,
  {
    score: number | null;
    title?: string;
  }
>;

type LhrAudit = {
  title?: string;
  description?: string;
  score: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
};

function scoreTo100(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.min(100, Math.max(0, Math.round(v * 100)));
}

export function extractCategoryScores(lhr: { categories?: LhrCategories } | null): CategoryScores | null {
  if (!lhr?.categories) return null;
  const c = lhr.categories;
  return {
    performance: scoreTo100(c.performance?.score ?? null),
    accessibility: scoreTo100(c.accessibility?.score ?? null),
    bestPractices: scoreTo100(c["best-practices"]?.score ?? c.bestPractices?.score ?? null),
    seo: scoreTo100(c.seo?.score ?? null),
  };
}

const CORE_IDS = [
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
  "first-contentful-paint",
  "speed-index",
  "interaction-to-next-paint",
];

export function extractCoreMetrics(lhr: { audits?: Record<string, LhrAudit> } | null): MetricRow[] {
  if (!lhr?.audits) return [];
  const out: MetricRow[] = [];
  for (const id of CORE_IDS) {
    const a = lhr.audits[id];
    if (!a) continue;
    out.push({
      id,
      title: a.title ?? id,
      display: a.displayValue ?? null,
      score: a.score != null ? Math.round(a.score * 100) : null,
    });
  }
  return out;
}

export function extractFailingAuditTips(
  lhr: { audits?: Record<string, LhrAudit> } | null,
  max = 22,
): AuditTip[] {
  if (!lhr?.audits) return [];
  const tips: AuditTip[] = [];
  for (const [id, raw] of Object.entries(lhr.audits)) {
    const a = raw as LhrAudit;
    if (a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "manual") continue;
    if (a.score === null) continue;
    if (a.score >= 0.99) continue;
    const desc = (a.description ?? "")
      .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
      .replace(/`/g, "")
      .slice(0, 900);
    tips.push({
      id,
      title: a.title ?? id,
      description: desc,
    });
  }
  tips.sort((x, y) => (x.title > y.title ? 1 : -1));
  return tips.slice(0, max);
}

export function extractFieldMetrics(loadingExperience: Record<string, unknown> | undefined): FieldMetricRow[] {
  if (!loadingExperience?.metrics || typeof loadingExperience.metrics !== "object") return [];
  const metrics = loadingExperience.metrics as Record<string, { percentile?: number; category?: string }>;
  const rows: FieldMetricRow[] = [];
  for (const [id, m] of Object.entries(metrics)) {
    rows.push({
      id,
      percentile: m.percentile != null ? String(m.percentile) : undefined,
      category: m.category,
    });
  }
  return rows;
}

export async function fetchPageSpeedReport(
  pageUrl: string,
  apiKey: string,
  strategy: PageSpeedStrategy,
): Promise<{ data: unknown; strategy: PageSpeedStrategy }> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", pageUrl);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  for (const c of ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]) {
    endpoint.searchParams.append("category", c);
  }

  const res = await fetch(endpoint.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(120_000),
  });

  const text = await res.text();
  if (!res.ok) {
    let errMsg = `PageSpeed API error (${res.status})`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) errMsg = j.error.message;
    } catch {
      errMsg = text.slice(0, 200) || errMsg;
    }
    throw new Error(errMsg);
  }

  return { data: JSON.parse(text) as unknown, strategy };
}

export function parsePageSpeedJson(data: unknown): {
  lighthouseResult: { categories?: LhrCategories; audits?: Record<string, LhrAudit> } | null;
  loadingExperience: Record<string, unknown> | undefined;
} {
  const root = data as {
    lighthouseResult?: { categories?: LhrCategories; audits?: Record<string, LhrAudit> };
    loadingExperience?: Record<string, unknown>;
  };
  return {
    lighthouseResult: root.lighthouseResult ?? null,
    loadingExperience: root.loadingExperience,
  };
}
