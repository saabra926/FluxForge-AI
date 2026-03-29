import { NextRequest, NextResponse } from "next/server";
import { octokitFromRequest } from "../_shared";

export async function GET(req: NextRequest) {
  const octokit = octokitFromRequest(req);
  if (!octokit) {
    return NextResponse.json({ error: "Missing x-github-token header." }, { status: 401 });
  }
  const per = Math.min(Number(req.nextUrl.searchParams.get("per_page")) || 30, 100);
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: per,
      sort: "updated",
      affiliation: "owner,collaborator,organization_member",
    });
    return NextResponse.json({
      repos: data.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        default_branch: r.default_branch,
        html_url: r.html_url,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to list repos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
