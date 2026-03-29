import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function POST(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }
  let body: { name?: string; private?: boolean; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const name = body.name?.trim().replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^-+|-+$/g, "");
  if (!name) {
    return NextResponse.json({ error: "Repository name is required." }, { status: 400 });
  }
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: body.private ?? true,
      description: body.description?.slice(0, 350),
      auto_init: true,
    });
    return NextResponse.json({
      name: data.name,
      full_name: data.full_name,
      default_branch: data.default_branch,
      html_url: data.html_url,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json(
      { error: err.message ?? "Could not create repository." },
      { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 400 }
    );
  }
}
