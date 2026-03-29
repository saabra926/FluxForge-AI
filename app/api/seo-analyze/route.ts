import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server-user";
import { assertSafePublicHttpUrl, fetchHtmlWithRedirectGuard } from "@/lib/public-url";
import {
  analyzeHtmlForSeoSignals,
  buildOnPageTips,
  detectAnalyticsFromHtml,
} from "@/lib/seo-html-analyze";
import {
  extractCategoryScores,
  extractCoreMetrics,
  extractFailingAuditTips,
  extractFieldMetrics,
  fetchPageSpeedReport,
  parsePageSpeedJson,
} from "@/lib/pagespeed-client";

export const maxDuration = 180;

type Body = { url?: string; strategy?: "mobile" | "desktop" | "both" };

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to use SEO analytics." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  let normalized: URL;
  try {
    normalized = assertSafePublicHttpUrl(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid URL.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const pageUrl = normalized.href;
  const strategy = body.strategy ?? "mobile";
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();

  let htmlBlock: {
    ok: true;
    finalUrl: string;
    onPage: ReturnType<typeof analyzeHtmlForSeoSignals>;
    analytics: ReturnType<typeof detectAnalyticsFromHtml>;
    onPageTips: ReturnType<typeof buildOnPageTips>;
  } | {
    ok: false;
    error: string;
  };

  try {
    const { html, finalUrl, contentType } = await fetchHtmlWithRedirectGuard(pageUrl);
    if (!contentType.includes("html") && !contentType.includes("xml")) {
      htmlBlock = {
        ok: false,
        error: `Fetched content is not HTML (${contentType}). Lighthouse still runs on the URL.`,
      };
    } else {
      const onPage = analyzeHtmlForSeoSignals(html);
      const analytics = detectAnalyticsFromHtml(html);
      const onPageTips = buildOnPageTips(onPage, analytics);
      htmlBlock = { ok: true, finalUrl, onPage, analytics, onPageTips };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "HTML fetch failed.";
    htmlBlock = { ok: false, error: msg };
  }

  const lighthouseReports: Array<{
    strategy: "mobile" | "desktop";
    scores: ReturnType<typeof extractCategoryScores>;
    metrics: ReturnType<typeof extractCoreMetrics>;
    fieldMetrics: ReturnType<typeof extractFieldMetrics>;
    auditTips: ReturnType<typeof extractFailingAuditTips>;
    fetchTime: string;
  }> = [];

  if (apiKey) {
    const run = async (s: "mobile" | "desktop") => {
      const started = Date.now();
      const { data } = await fetchPageSpeedReport(pageUrl, apiKey, s);
      const { lighthouseResult, loadingExperience } = parsePageSpeedJson(data);
      lighthouseReports.push({
        strategy: s,
        scores: extractCategoryScores(lighthouseResult),
        metrics: extractCoreMetrics(lighthouseResult),
        fieldMetrics: extractFieldMetrics(loadingExperience),
        auditTips: extractFailingAuditTips(lighthouseResult),
        fetchTime: `${Math.round((Date.now() - started) / 1000)}s`,
      });
    };

    try {
      if (strategy === "both") {
        await run("mobile");
        await run("desktop");
      } else {
        await run(strategy);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PageSpeed request failed.";
      return NextResponse.json(
        {
          analyzedUrl: pageUrl,
          error: msg,
          lighthouseEnabled: true,
          lighthouseNote:
            "PageSpeed Insights could not complete this run. Quota, URL blocking, or network issues are common causes.",
          analyticsNote:
            "Analytics rows reflect scripts found in HTML when the snapshot succeeded below.",
          htmlSnapshot: htmlBlock,
          lighthouse: [],
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    analyzedUrl: pageUrl,
    lighthouseEnabled: !!apiKey,
    lighthouseNote: apiKey
      ? "Scores and audits are produced by Google PageSpeed Insights (Lighthouse), the same engine as Chrome DevTools."
      : "Set GOOGLE_PAGESPEED_API_KEY in your environment for official Lighthouse category scores (Performance, SEO, Accessibility, Best practices). HTML-based checks still run without it.",
    analyticsNote:
      "Analytics rows reflect scripts/URLs found in the initial HTML response. Single-page apps may load analytics after hydration — validate in the browser Network tab and your tag manager preview mode.",
    htmlSnapshot: htmlBlock,
    lighthouse: lighthouseReports,
  });
}
