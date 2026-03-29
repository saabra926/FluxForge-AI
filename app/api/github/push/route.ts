import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

const MAX_FILE_BYTES = 900_000;

type PushBody = {
  owner?: string;
  repo?: string;
  branch?: string;
  message?: string;
  /** Create branch from default if it does not exist */
  create_branch_if_missing?: boolean;
  files?: Array<{ path: string; content: string }>;
};

function uniquePaths(files: Array<{ path: string; content: string }>) {
  const map = new Map<string, string>();
  for (const f of files) {
    const path = f.path.replace(/\\/g, "/").replace(/^\/+/, "").trim();
    if (!path) continue;
    map.set(path, f.content);
  }
  return Array.from(map.entries()).map(([path, content]) => ({ path, content }));
}

export async function POST(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }

  let body: PushBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const owner = body.owner?.trim();
  const repo = body.repo?.trim();
  const branch = body.branch?.trim();
  const message = body.message?.trim();
  if (!owner || !repo || !branch || !message) {
    return NextResponse.json({ error: "owner, repo, branch, and message are required." }, { status: 400 });
  }
  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
  }

  const files = uniquePaths(body.files);
  if (files.length === 0) {
    return NextResponse.json({ error: "No valid file paths." }, { status: 400 });
  }

  const skipped: string[] = [];
  const safeFiles = files.filter((f) => {
    const n = Buffer.byteLength(f.content, "utf8");
    if (n > MAX_FILE_BYTES) {
      skipped.push(`${f.path} (too large)`);
      return false;
    }
    return true;
  });

  if (safeFiles.length === 0) {
    return NextResponse.json({ error: "All files were skipped (too large for API push).", skipped }, { status: 400 });
  }

  try {
    let headSha: string;
    try {
      const refRes = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
      headSha = refRes.data.object.sha;
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      if (status !== 404 || !body.create_branch_if_missing) {
        const msg = (e as { message?: string }).message ?? "Branch not found.";
        return NextResponse.json({ error: msg }, { status: status === 404 ? 404 : 400 });
      }
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      const def = repoData.default_branch;
      const baseRef = await octokit.git.getRef({ owner, repo, ref: `heads/${def}` });
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: baseRef.data.object.sha,
      });
      const refRes = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
      headSha = refRes.data.object.sha;
    }

    const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: headSha });
    const baseTreeSha = commitData.tree.sha;

    const treeItems = await Promise.all(
      safeFiles.map(async (f) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(f.content, "utf8").toString("base64"),
          encoding: "base64",
        });
        return {
          path: f.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      }),
    );

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeItems,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [headSha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return NextResponse.json({
      sha: newCommit.sha,
      html_url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      files_pushed: safeFiles.length,
      skipped: skipped.length ? skipped : undefined,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    console.error("[github/push]", err);
    return NextResponse.json({ error: err.message ?? "Push failed." }, { status: 400 });
  }
}
