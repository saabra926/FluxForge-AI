import { Octokit } from "@octokit/rest";
import type { NextRequest } from "next/server";

export function githubTokenFromRequest(req: NextRequest): string | null {
  const h = req.headers.get("x-github-token");
  if (!h?.trim()) return null;
  return h.trim();
}

export function octokitFromRequest(req: NextRequest): Octokit | null {
  const token = githubTokenFromRequest(req);
  if (!token) return null;
  return new Octokit({ auth: token });
}
