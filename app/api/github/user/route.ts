import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function GET(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing or invalid x-github-token header." }, { status: 401 });
  }
  try {
    const { data } = await octokit.users.getAuthenticated();
    return NextResponse.json({
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "GitHub API error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
