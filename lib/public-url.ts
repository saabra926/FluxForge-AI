/**
 * Validates URLs before server-side fetch to reduce SSRF risk.
 * Blocks non-public hosts, file/data protocols, and common metadata endpoints.
 */
export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

function ipv4ToParts(host: string): [number, number, number, number] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const p = m.slice(1, 5).map((x) => Number(x));
  if (p.some((n) => n > 255)) return null;
  return [p[0]!, p[1]!, p[2]!, p[3]!];
}

function isPrivateOrReservedIpv4(a: number, b: number, c: number, d: number): boolean {
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && c === 0) return true; // IETF reserved
  if (a === 192 && b === 51 && c === 100 && d === 254) return true; // documentation
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

export function assertSafePublicHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("Invalid URL. Include https:// (or http://).");
  }

  if (u.username || u.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed.");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are supported.");
  }

  const host = u.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    throw new UnsafeUrlError("Local and loopback hosts are not allowed.");
  }

  if (host === "metadata.google.internal" || host.includes("metadata.google")) {
    throw new UnsafeUrlError("This host is not allowed.");
  }
  if (host === "metadata" || host.startsWith("169.254.") || host.includes("169.254.169.254")) {
    throw new UnsafeUrlError("Metadata and link-local targets are not allowed.");
  }

  const v4 = ipv4ToParts(host);
  if (v4 && isPrivateOrReservedIpv4(...v4)) {
    throw new UnsafeUrlError("Private IP addresses are not allowed.");
  }

  return u;
}

const MAX_HTML_BYTES = 600_000;

export async function fetchHtmlWithRedirectGuard(
  startHref: string,
  options: { maxRedirects?: number; timeoutMs?: number } = {},
): Promise<{ html: string; finalUrl: string; contentType: string }> {
  const maxRedirects = options.maxRedirects ?? 6;
  const timeoutMs = options.timeoutMs ?? 18_000;

  let current = assertSafePublicHttpUrl(startHref).href;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    assertSafePublicHttpUrl(current);
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SEOAuditor/1.0",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`Redirect (${res.status}) without Location header.`);
      current = new URL(loc, current).href;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch page: HTTP ${res.status}.`);
    }

    const ct = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "application/octet-stream";
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error("Page response is too large to analyze (max ~600 KB).");
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    return { html, finalUrl: current, contentType: ct };
  }

  throw new Error("Too many redirects.");
}
