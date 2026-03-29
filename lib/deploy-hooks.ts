/**
 * Server-side validation for deploy hook URLs (mitigates open SSRF).
 * Only HTTPS URLs on known provider hosts/path prefixes are allowed.
 */
export function isAllowedDeployHookUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();

    if (host === "api.vercel.com" && u.pathname.startsWith("/v1/integrations/deploy/")) {
      return true;
    }
    if (host === "api.netlify.com" && u.pathname.startsWith("/build_hooks/")) {
      return true;
    }
    if (host === "api.render.com" && u.pathname.startsWith("/deploy/")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Deep-link: import Git repo on Vercel (user completes project settings in their dashboard). */
export function vercelCloneImportUrl(owner: string, repo: string): string {
  const repositoryUrl = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  return `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repositoryUrl)}`;
}

/** Deep-link: start Netlify setup from a GitHub repo. */
export function netlifyNewRepoUrl(owner: string, repo: string): string {
  const repository = `https://github.com/${owner}/${repo}`;
  return `https://app.netlify.com/start/repos/new?repository=${encodeURIComponent(repository)}`;
}

export function githubRepoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}
