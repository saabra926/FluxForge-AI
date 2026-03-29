import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function GET(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }
  const owner = req.nextUrl.searchParams.get("owner")?.trim();
  const repo = req.nextUrl.searchParams.get("repo")?.trim();
  if (!owner || !repo) {
    return NextResponse.json({ error: "Query params owner and repo are required." }, { status: 400 });
  }
  try {
    const { data } = await octokit.repos.listBranches({ owner, repo, per_page: 100 });
    return NextResponse.json({
      branches: data.map((b) => ({ name: b.name, sha: b.commit.sha })),
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json(
      { error: err.message ?? "Failed to list branches." },
      { status: err.status === 404 ? 404 : 400 }
    );
  }
}
