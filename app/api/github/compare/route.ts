import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function GET(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }
  const owner = req.nextUrl.searchParams.get("owner")?.trim();
  const repo = req.nextUrl.searchParams.get("repo")?.trim();
  const base = req.nextUrl.searchParams.get("base")?.trim();
  const head = req.nextUrl.searchParams.get("head")?.trim();
  if (!owner || !repo || !base || !head) {
    return NextResponse.json({ error: "Query owner, repo, base, and head are required." }, { status: 400 });
  }

  try {
    const { data } = await octokit.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${base}...${head}`,
    });

    type FileRow = {
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
      patch?: string;
    };

    const files: FileRow[] = (data.files ?? []).map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch ?? undefined,
    }));

    return NextResponse.json({
      status: data.status,
      ahead_by: data.ahead_by,
      behind_by: data.behind_by,
      total_commits: data.total_commits,
      base_commit: data.base_commit?.sha,
      merge_commit: data.merge_base_commit?.sha,
      html_url: data.html_url,
      commits: data.commits?.slice(0, 20).map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name,
        date: c.commit.author?.date,
      })),
      files,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json(
      { error: err.message ?? "Compare failed." },
      { status: err.status === 404 ? 404 : 400 }
    );
  }
}
