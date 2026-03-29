/** Lightweight on-page signals from HTML (regex-based, no DOM on server). */

export type AnalyticsFinding = {
  id: string;
  name: string;
  detected: boolean;
  hint: string;
};

const ANALYTICS_RULES: Array<{ id: string; name: string; re: RegExp; hint: string }> = [
  {
    id: "ga4",
    name: "Google Analytics 4 (gtag / G-)",
    re: /googletagmanager\.com\/gtag\/js|gtag\s*\(\s*['"]config['"]\s*,\s*['"]G-[A-Z0-9]+|google-analytics\.com\/g\/collect/i,
    hint: "GA4 tagging appears present. Verify data streams and consent mode in GA4 admin.",
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    re: /googletagmanager\.com\/ns\.html|googletagmanager\.com\/gtm\.js\?id=GTM-/i,
    hint: "GTM container detected. Review tags, triggers, and consent in the GTM workspace.",
  },
  {
    id: "meta_pixel",
    name: "Meta (Facebook) Pixel",
    re: /connect\.facebook\.net\/.*fbq|fbq\s*\(\s*['"]init['"]/i,
    hint: "Meta Pixel scripts found. Confirm events in Meta Events Manager and privacy disclosures.",
  },
  {
    id: "linkedin",
    name: "LinkedIn Insight Tag",
    re: /snap\.licdn\.com\/li\.lms-analytics/i,
    hint: "LinkedIn Insight Tag detected.",
  },
  {
    id: "clarity",
    name: "Microsoft Clarity",
    re: /clarity\.ms\/tag/i,
    hint: "Clarity script detected — useful for session replay and heatmaps.",
  },
  {
    id: "hotjar",
    name: "Hotjar",
    re: /static\.hotjar\.com|hotjar\.com\/c\/hotjar-/i,
    hint: "Hotjar snippets found.",
  },
  {
    id: "plausible",
    name: "Plausible",
    re: /plausible\.io\/js\/script/i,
    hint: "Plausible analytics detected (privacy-oriented).",
  },
  {
    id: "matomo",
    name: "Matomo",
    re: /matomo\.js|piwik\.js|_paq\.push/i,
    hint: "Matomo / Piwik tracking detected.",
  },
  {
    id: "segment",
    name: "Segment",
    re: /cdn\.segment\.com\/analytics\.js|api\.segment\.io/i,
    hint: "Segment loader or API calls detected.",
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    re: /cdn\.mxpnl\.com|mixpanel\.com\/track/i,
    hint: "Mixpanel references found.",
  },
  {
    id: "amplitude",
    name: "Amplitude",
    re: /cdn\.amplitude\.com|api\.amplitude\.com/i,
    hint: "Amplitude SDK or API references found.",
  },
  {
    id: "posthog",
    name: "PostHog",
    re: /posthog\.com\/static\/array\.js|app\.posthog\.com/i,
    hint: "PostHog snippet or endpoint detected.",
  },
];

export type OnPageSeoSummary = {
  title: string | null;
  titleLen: number;
  metaDescription: string | null;
  metaDescriptionLen: number;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  h1Count: number;
  htmlLang: string | null;
  charsetMeta: boolean;
  viewportMeta: boolean;
  hasJsonLd: boolean;
};

function matchMeta(html: string, attr: "name" | "property", value: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const m = re.exec(html);
  return m?.[1]?.trim() || null;
}

function matchLinkCanonical(html: string): string | null {
  const m = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i.exec(html);
  return m?.[1]?.trim() || null;
}

export function analyzeHtmlForSeoSignals(html: string): OnPageSeoSummary {
  const titleM = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const title = titleM?.[1]?.replace(/\s+/g, " ").trim() || null;
  const metaDescription = matchMeta(html, "name", "description");
  const h1Matches = html.match(/<h1\b[^>]*>/gi);
  const htmlLangM = /<html[^>]+lang=["']([^"']+)["'][^>]*>/i.exec(html);

  return {
    title,
    titleLen: title?.length ?? 0,
    metaDescription,
    metaDescriptionLen: metaDescription?.length ?? 0,
    canonical: matchLinkCanonical(html),
    robots: matchMeta(html, "name", "robots"),
    ogTitle: matchMeta(html, "property", "og:title"),
    ogDescription: matchMeta(html, "property", "og:description"),
    ogImage: matchMeta(html, "property", "og:image"),
    h1Count: h1Matches?.length ?? 0,
    htmlLang: htmlLangM?.[1]?.trim() || null,
    charsetMeta: /<meta[^>]+charset\s*=/i.test(html),
    viewportMeta: /name=["']viewport["']/i.test(html),
    hasJsonLd: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
  };
}

export function detectAnalyticsFromHtml(html: string): AnalyticsFinding[] {
  return ANALYTICS_RULES.map((r) => ({
    id: r.id,
    name: r.name,
    detected: r.re.test(html),
    hint: r.hint,
  }));
}

export type SeoTip = { severity: "high" | "medium" | "low"; title: string; detail: string };

export function buildOnPageTips(on: OnPageSeoSummary, findings: AnalyticsFinding[]): SeoTip[] {
  const tips: SeoTip[] = [];

  if (!on.title || on.titleLen < 15) {
    tips.push({
      severity: "high",
      title: "Page title",
      detail: !on.title
        ? "No <title> found. Add a unique, descriptive title (typically 50–60 characters)."
        : "Title is very short. Expand with primary topic + brand where appropriate.",
    });
  } else if (on.titleLen > 70) {
    tips.push({
      severity: "medium",
      title: "Title length",
      detail: "Title may truncate in search results. Aim for ~50–60 visible characters for key pages.",
    });
  }

  if (!on.metaDescription) {
    tips.push({
      severity: "high",
      title: "Meta description",
      detail: "Add a meta description that summarizes the page and matches search intent (~150–160 characters).",
    });
  } else if (on.metaDescriptionLen < 50) {
    tips.push({
      severity: "medium",
      title: "Meta description length",
      detail: "Description is short; consider expanding with a clear value proposition and CTA.",
    });
  } else if (on.metaDescriptionLen > 320) {
    tips.push({
      severity: "low",
      title: "Meta description length",
      detail: "Very long descriptions may be truncated in SERPs; tighten the first sentence.",
    });
  }

  if (on.h1Count === 0) {
    tips.push({
      severity: "high",
      title: "H1 heading",
      detail: "No H1 detected. Use a single clear H1 describing the main topic.",
    });
  } else if (on.h1Count > 1) {
    tips.push({
      severity: "medium",
      title: "Multiple H1s",
      detail: "Several H1 elements found. For most sites, one H1 per page is easier for users and SEO.",
    });
  }

  if (!on.canonical) {
    tips.push({
      severity: "medium",
      title: "Canonical URL",
      detail: "No canonical link found. Add rel=canonical on important pages to reduce duplicate signals.",
    });
  }

  if (!on.htmlLang) {
    tips.push({
      severity: "medium",
      title: "HTML lang",
      detail: 'Add lang="..." on <html> for accessibility and language hints to search engines.',
    });
  }

  if (!on.viewportMeta) {
    tips.push({
      severity: "high",
      title: "Viewport meta",
      detail: "No viewport meta tag — mobile layouts and Lighthouse mobile scores often suffer.",
    });
  }

  if (!on.ogTitle || !on.ogImage) {
    tips.push({
      severity: "low",
      title: "Open Graph",
      detail: "Complete og:title, og:description, and og:image for better link previews on social platforms.",
    });
  }

  if (!on.hasJsonLd) {
    tips.push({
      severity: "low",
      title: "Structured data",
      detail: "No JSON-LD detected. Consider Article, Product, LocalBusiness, or Organization schema where relevant.",
    });
  }

  if (on.robots && /noindex/i.test(on.robots)) {
    tips.push({
      severity: "high",
      title: "robots noindex",
      detail: "Meta robots includes noindex — this page is discouraged from appearing in search results.",
    });
  }

  const anyAnalytics = findings.some((f) => f.detected);
  if (!anyAnalytics) {
    tips.push({
      severity: "low",
      title: "Analytics (optional)",
      detail:
        "No common analytics scripts detected in initial HTML. SPA sites may load tags later — verify in browser DevTools Network after load.",
    });
  }

  return tips;
}
