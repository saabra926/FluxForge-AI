import { NextRequest, NextResponse } from "next/server";
import { isAllowedDeployHookUrl } from "@/lib/deploy-hooks";

type Body = { hookUrl?: string };

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const hookUrl = body.hookUrl?.trim();
  if (!hookUrl || !isAllowedDeployHookUrl(hookUrl)) {
    return NextResponse.json(
      {
        error:
          "Invalid or disallowed deploy hook URL. Use a Vercel, Netlify, or Render deploy hook (HTTPS only).",
      },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(hookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 400);
      return NextResponse.json(
        { error: `Hook responded with ${res.status}${snippet ? `: ${snippet}` : ""}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to reach deploy hook.";
    console.error("[deploy/trigger]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
