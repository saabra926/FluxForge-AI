import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function POST(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }
  let body: { owner?: string; repo?: string; name?: string; from_branch?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const owner = body.owner?.trim();
  const repo = body.repo?.trim();
  const name = body.name?.trim().replace(/^refs\/heads\//, "");
  if (!owner || !repo || !name) {
    return NextResponse.json({ error: "owner, repo, and name are required." }, { status: 400 });
  }

  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const from = body.from_branch?.trim() || repoData.default_branch;

    const refRes = await octokit.git.getRef({ owner, repo, ref: `heads/${from}` });
    const sha = refRes.data.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${name}`,
      sha,
    });
    return NextResponse.json({ name, sha, from }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    if (err.status === 422) {
      return NextResponse.json({ error: "Branch may already exist or name is invalid." }, { status: 422 });
    }
    return NextResponse.json({ error: err.message ?? "Failed to create branch." }, { status: 400 });
  }
}
