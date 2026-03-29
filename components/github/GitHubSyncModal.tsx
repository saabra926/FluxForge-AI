"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  X,
  Github,
  GitBranch,
  GitCompare,
  FolderOpen,
  Sparkles,
  Loader2,
  ExternalLink,
  KeyRound,
  Plus,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";
import { mergeWorkspaceFiles } from "@/lib/workspace-files";
import { parseProjectFiles } from "@/lib/parse-project-files";
import { cn } from "@/lib/utils";
import {
  isAllowedDeployHookUrl,
  vercelCloneImportUrl,
  netlifyNewRepoUrl,
  githubRepoUrl,
} from "@/lib/deploy-hooks";
import type { FileEntry } from "@/types";

const TOKEN_KEY = "ui-codegen-github-pat";
const DEPLOY_HOOK_KEY = "ui-codegen-deploy-hook";
const AUTO_DEPLOY_KEY = "ui-codegen-auto-deploy";

export type GitHubModalTabId = "connect" | "push" | "deploy" | "branches" | "diff";

type TabId = GitHubModalTabId;

type GitHubUser = { login: string; name: string | null; avatar_url: string; html_url: string };

type RepoRow = { name: string; full_name: string; private: boolean; default_branch: string; html_url: string };

type BranchRow = { name: string; sha: string };

type CompareFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
};

async function ghFetch<T = unknown>(path: string, token: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: {
      ...(!(init?.method === "GET" || init?.method === "HEAD") ? { "Content-Type": "application/json" } : {}),
      "x-github-token": token,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(j.error || `${r.status} ${r.statusText}`);
  return j as T;
}

export function GitHubSyncModal({
  onClose,
  onToast,
  initialTab,
}: {
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
  initialTab?: GitHubModalTabId;
}) {
  const { projectFiles, projectName, generatedFiles, generatedCode, config } = useAppStore();
  const { data: session, status: sessionStatus } = useSession();

  const [tab, setTab] = useState<TabId>(() => initialTab ?? "connect");
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedFullName, setSelectedFullName] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPrivate, setCreatePrivate] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [useNewRepo, setUseNewRepo] = useState(false);

  const [source, setSource] = useState<"live" | "local">("live");
  const [localFiles, setLocalFiles] = useState<FileEntry[] | null>(null);
  const [localLabel, setLocalLabel] = useState("");

  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [targetBranch, setTargetBranch] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  const [commitMessage, setCommitMessage] = useState("Update from UI Code Generator");
  const [pushing, setPushing] = useState(false);

  const [diffBase, setDiffBase] = useState("");
  const [diffHead, setDiffHead] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareFiles, setCompareFiles] = useState<CompareFile[]>([]);
  const [compareMeta, setCompareMeta] = useState<{ ahead_by: number; behind_by: number; html_url?: string } | null>(
    null,
  );
  const [expandedPatch, setExpandedPatch] = useState<string | null>(null);

  const [deployHookUrl, setDeployHookUrl] = useState("");
  const [autoTriggerAfterPush, setAutoTriggerAfterPush] = useState(false);
  const [triggeringHook, setTriggeringHook] = useState(false);
  const [lastPush, setLastPush] = useState<{
    owner: string;
    repo: string;
    sha: string;
    html_url: string;
  } | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (saved) {
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.githubLinked) return;
    if (token) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/account/github/token");
        const j = (await r.json()) as { token?: string | null };
        if (cancelled || !j.token) return;
        setToken(j.token);
        setTokenInput(j.token);
        localStorage.setItem(TOKEN_KEY, j.token);
        const u = await ghFetch<GitHubUser>("/api/github/user", j.token);
        setUser(u);
      } catch {
        /* PAT may still be entered manually */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, session?.user?.githubLinked, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = localStorage.getItem(DEPLOY_HOOK_KEY);
    const a = localStorage.getItem(AUTO_DEPLOY_KEY);
    if (h) setDeployHookUrl(h);
    if (a === "1") setAutoTriggerAfterPush(true);
  }, []);

  const ownerRepo = useMemo(() => {
    const full = useNewRepo ? `${user?.login}/${createName.trim()}`.replace(/\/+$/, "") : selectedFullName.trim();
    const parts = full.split("/");
    if (parts.length < 2) return { owner: user?.login ?? "", repo: "" };
    return { owner: parts[0]!, repo: parts.slice(1).join("/") };
  }, [user, selectedFullName, createName, useNewRepo]);

  const workspaceSnapshot = useMemo(() => {
    if (source === "local") return localFiles ?? [];
    return mergeWorkspaceFiles({
      projectName,
      projectFiles,
      generatedFiles,
      generatedCode,
      framework: config.framework,
    });
  }, [source, localFiles, projectName, projectFiles, generatedFiles, generatedCode, config.framework]);

  const verifyToken = useCallback(async () => {
    const t = tokenInput.trim();
    if (!t) {
      onToast("Paste a GitHub personal access token first.", "error");
      return;
    }
    setVerifying(true);
    try {
      const u = await ghFetch<GitHubUser>("/api/github/user", t);
      setUser(u);
      setToken(t);
      localStorage.setItem(TOKEN_KEY, t);
      onToast(`Connected as ${u.login}`);
      setTab("push");
    } catch (e) {
      setUser(null);
      onToast((e as Error).message, "error");
    } finally {
      setVerifying(false);
    }
  }, [tokenInput, onToast]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setTokenInput("");
    setUser(null);
    setRepos([]);
    onToast("Disconnected GitHub token.");
  }, [onToast]);

  const loadRepos = useCallback(async () => {
    if (!token) return;
    setReposLoading(true);
    try {
      const data = await ghFetch<{ repos: RepoRow[] }>("/api/github/repos?per_page=50", token);
      setRepos(data.repos);
      setSelectedFullName((prev) => prev || data.repos[0]?.full_name || "");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setReposLoading(false);
    }
  }, [token, onToast]);

  useEffect(() => {
    if (token && tab === "push" && repos.length === 0 && !reposLoading) void loadRepos();
  }, [token, tab, repos.length, reposLoading, loadRepos]);

  const loadBranches = useCallback(async () => {
    if (!token || !ownerRepo.owner || !ownerRepo.repo) return;
    setBranchLoading(true);
    try {
      const data = await ghFetch<{ branches: BranchRow[] }>(
        `/api/github/branches?owner=${encodeURIComponent(ownerRepo.owner)}&repo=${encodeURIComponent(ownerRepo.repo)}`,
        token,
      );
      setBranches(data.branches);
      setTargetBranch((prev) => {
        const names = new Set(data.branches.map((b) => b.name));
        if (prev && names.has(prev)) return prev;
        const def = repos.find((r) => r.full_name === selectedFullName)?.default_branch;
        return data.branches.find((b) => b.name === def)?.name ?? data.branches[0]?.name ?? "";
      });
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setBranchLoading(false);
    }
  }, [token, ownerRepo.owner, ownerRepo.repo, onToast, repos, selectedFullName]);

  useEffect(() => {
    if (tab === "push" || tab === "branches" || tab === "diff") {
      if (token && ownerRepo.owner && ownerRepo.repo && !useNewRepo) void loadBranches();
    }
  }, [tab, token, ownerRepo.owner, ownerRepo.repo, useNewRepo, loadBranches]);

  const handleCreateRepo = async () => {
    const name = createName.trim().replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^-+|-+$/g, "");
    if (!name || !token) {
      onToast("Enter a repository name.", "error");
      return;
    }
    setCreatingRepo(true);
    try {
      const created = await ghFetch<RepoRow>("/api/github/repo", token, {
        method: "POST",
        body: JSON.stringify({ name, private: createPrivate, description: "Pushed from UI Code Generator Pro" }),
      });
      onToast(`Created ${created.full_name}`);
      setUseNewRepo(false);
      setSelectedFullName(created.full_name);
      setCreateName("");
      await loadRepos();
      setTab("push");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleCreateBranch = async () => {
    const name = newBranchName.trim().replace(/[^a-zA-Z0-9._/-]/g, "-").replace(/^-+|-+$/g, "");
    if (!name || !token || !ownerRepo.owner || !ownerRepo.repo) return;
    setCreatingBranch(true);
    try {
      await ghFetch("/api/github/branch", token, {
        method: "POST",
        body: JSON.stringify({
          owner: ownerRepo.owner,
          repo: ownerRepo.repo,
          name,
          from_branch: targetBranch || undefined,
        }),
      });
      onToast(`Branch ${name} created`);
      setNewBranchName("");
      await loadBranches();
      setTargetBranch(name);
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setCreatingBranch(false);
    }
  };

  const saveDeploySettings = useCallback(() => {
    const t = deployHookUrl.trim();
    if (t && !isAllowedDeployHookUrl(t)) {
      onToast(
        "Use a deploy hook URL from Vercel, Netlify, or Render (HTTPS links shown in their dashboards).",
        "error",
      );
      return;
    }
    if (t) localStorage.setItem(DEPLOY_HOOK_KEY, t);
    else localStorage.removeItem(DEPLOY_HOOK_KEY);
    localStorage.setItem(AUTO_DEPLOY_KEY, autoTriggerAfterPush ? "1" : "0");
    onToast("Deploy settings saved");
  }, [deployHookUrl, autoTriggerAfterPush, onToast]);

  const triggerDeployHookNow = useCallback(async () => {
    const t = deployHookUrl.trim();
    if (!t) {
      onToast("Paste your deploy hook URL first.", "error");
      return;
    }
    if (!isAllowedDeployHookUrl(t)) {
      onToast("This URL is not allowed. Copy the hook from Vercel / Netlify / Render only.", "error");
      return;
    }
    setTriggeringHook(true);
    try {
      const tr = await fetch("/api/deploy/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hookUrl: t }),
      });
      const data = (await tr.json().catch(() => ({}))) as { error?: string };
      if (!tr.ok) throw new Error(data.error || `HTTP ${tr.status}`);
      onToast("Deploy started — check your hosting provider dashboard.");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setTriggeringHook(false);
    }
  }, [deployHookUrl, onToast]);

  const handlePush = async () => {
    if (!token || !user) {
      onToast("Connect GitHub first.", "error");
      return;
    }
    let owner = ownerRepo.owner;
    let repo = ownerRepo.repo;
    if (useNewRepo) {
      const name = createName.trim();
      if (!name) {
        onToast("Create or select a repository first.", "error");
        return;
      }
      owner = user.login;
      repo = name;
    }
    if (!owner || !repo) {
      onToast("Select or create a repository.", "error");
      return;
    }
    if (!workspaceSnapshot.length) {
      onToast("No files to push. Generate code, upload a project, or pick a local folder.", "error");
      return;
    }
    const branch = targetBranch.trim();
    if (!branch) {
      onToast("Choose a branch.", "error");
      return;
    }

    setPushing(true);
    try {
      const res = await ghFetch<{ sha: string; html_url: string; files_pushed: number; skipped?: string[] }>(
        "/api/github/push",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            owner,
            repo,
            branch,
            message: commitMessage.trim() || "Update from UI Code Generator",
            create_branch_if_missing: true,
            files: workspaceSnapshot.map((f) => ({ path: f.path, content: f.content })),
          }),
        },
      );
      const extra = res.skipped?.length ? ` · skipped: ${res.skipped.join(", ")}` : "";
      setLastPush({ owner, repo, sha: res.sha, html_url: res.html_url });
      onToast(`Pushed ${res.files_pushed} file(s) · ${res.sha.slice(0, 7)}${extra}`);

      if (autoTriggerAfterPush && deployHookUrl.trim()) {
        setTriggeringHook(true);
        try {
          const tr = await fetch("/api/deploy/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hookUrl: deployHookUrl.trim() }),
          });
          const data = (await tr.json().catch(() => ({}))) as { error?: string };
          if (!tr.ok) throw new Error(data.error || `Deploy hook: HTTP ${tr.status}`);
          onToast("Deploy hook fired after push.");
        } catch (e) {
          onToast(`Push OK, but deploy hook failed: ${(e as Error).message}`, "error");
        } finally {
          setTriggeringHook(false);
        }
      }
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setPushing(false);
    }
  };

  const handleCompare = async () => {
    if (!token || !ownerRepo.owner || !ownerRepo.repo) {
      onToast("Select a repository.", "error");
      return;
    }
    const base = diffBase.trim();
    const head = diffHead.trim();
    if (!base || !head) {
      onToast("Enter base and head branch names.", "error");
      return;
    }
    setCompareLoading(true);
    setCompareFiles([]);
    setCompareMeta(null);
    try {
      const data = await ghFetch<{
        files: CompareFile[];
        ahead_by: number;
        behind_by: number;
        html_url?: string;
      }>(
        `/api/github/compare?owner=${encodeURIComponent(ownerRepo.owner)}&repo=${encodeURIComponent(
          ownerRepo.repo,
        )}&base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`,
        token,
      );
      setCompareFiles(data.files ?? []);
      setCompareMeta({ ahead_by: data.ahead_by, behind_by: data.behind_by, html_url: data.html_url });
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setCompareLoading(false);
    }
  };

  const onPickLocalFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = async () => {
      const list = Array.from(input.files ?? []);
      if (!list.length) return;
      try {
        const parsed = await parseProjectFiles(list);
        if (!parsed.length) {
          onToast("No readable text files in that folder.", "error");
          return;
        }
        setLocalFiles(parsed);
        setLocalLabel(list[0]?.webkitRelativePath?.split("/")[0] ?? "folder");
        onToast(`Loaded ${parsed.length} files from disk`);
      } catch {
        onToast("Failed to read folder.", "error");
      }
    };
    input.click();
  };

  const onPickLocalZip = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const parsed = await parseProjectFiles([f]);
        if (!parsed.length) {
          onToast("No readable text files in that zip.", "error");
          return;
        }
        setLocalFiles(parsed);
        setLocalLabel(f.name.replace(/\.zip$/i, ""));
        onToast(`Loaded ${parsed.length} files from ${f.name}`);
      } catch {
        onToast("Failed to read zip.", "error");
      }
    };
    input.click();
  };

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "connect", label: "Connect", icon: <KeyRound size={14} /> },
    { id: "push", label: "Push", icon: <Github size={14} /> },
    { id: "deploy", label: "Deploy", icon: <Rocket size={14} /> },
    { id: "branches", label: "Branches", icon: <GitBranch size={14} /> },
    { id: "diff", label: "Compare", icon: <GitCompare size={14} /> },
  ];

  const deployOwner = useNewRepo ? (user?.login ?? "") : ownerRepo.owner;
  const deployRepo = useNewRepo ? createName.trim().replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^-+|-+$/g, "") : ownerRepo.repo;
  const canShowRepoLinks = Boolean(deployOwner && deployRepo);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-sync-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--panel)", border: "1px solid var(--border2)" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border2)" }}
        >
          <Github size={18} style={{ color: "var(--text)" }} />
          <h2 id="github-sync-title" className="font-syne font-bold text-[15px]" style={{ color: "var(--text)" }}>
            GitHub &amp; Deploy
          </h2>
          <p className="text-[11px] ml-1" style={{ color: "var(--text2)" }}>
            Push · host · hooks
          </p>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "var(--text2)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-0.5 px-3 pt-2 flex-shrink-0 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
              )}
              style={{
                color: tab === t.id ? "var(--blue)" : "var(--text2)",
                background: tab === t.id ? "var(--blue-dim)" : "transparent",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]" style={{ color: "var(--text)" }}>
          {tab === "connect" && (
            <div className="space-y-3">
              <p style={{ color: "var(--text2)" }}>
                Use a{" "}
                <a
                  href="https://github.com/settings/personal-access-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: "var(--blue)" }}
                >
                  GitHub token
                </a>{" "}
                with <strong className="text-[var(--text)]">repo</strong> scope. The token stays in your browser
                (localStorage) and is sent only to this app&apos;s API routes — not to third parties.
              </p>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                  Personal access token
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="github_pat_… or ghp_…"
                  className="w-full rounded-xl px-3 py-2 outline-none font-mono text-[11px]"
                  style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void verifyToken()}
                  disabled={verifying}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold"
                  style={{ background: "var(--blue)", color: "#fff" }}
                >
                  {verifying ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Save & verify
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={disconnect}
                    className="px-3 py-2 rounded-xl text-[11px] font-semibold border"
                    style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
              {user && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}
                >
                  <Image
                    src={user.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{user.login}</div>
                    {user.name && <div style={{ color: "var(--text2)" }}>{user.name}</div>}
                    <a href={user.html_url} target="_blank" rel="noreferrer" className="text-[11px]" style={{ color: "var(--blue)" }}>
                      Profile <ExternalLink size={10} className="inline" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "push" && (
            <div className="space-y-4">
              {!user && (
                <p style={{ color: "var(--amber)" }}>Connect your token on the Connect tab to enable push.</p>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                  File source
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSource("live")}
                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border")}
                    style={{
                      borderColor: source === "live" ? "var(--blue)" : "var(--border2)",
                      background: source === "live" ? "var(--blue-dim)" : "transparent",
                    }}
                  >
                    <Sparkles size={12} /> Live workspace ({workspaceSnapshot.length} files)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSource("local");
                      onPickLocalFolder();
                    }}
                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border")}
                    style={{
                      borderColor: source === "local" ? "var(--green)" : "var(--border2)",
                      background: source === "local" ? "var(--green-dim)" : "transparent",
                    }}
                  >
                    <FolderOpen size={12} /> Local folder / zip…
                  </button>
                </div>
                {source === "local" && (
                  <div className="flex flex-wrap items-center gap-2" style={{ color: "var(--text2)" }}>
                    <p>
                      {localFiles ? (
                        <>
                          Loaded <strong>{localFiles.length}</strong> from <strong>{localLabel}</strong>
                        </>
                      ) : (
                        "Choose a folder (text files, max 60) or a .zip — same rules as project upload."
                      )}
                    </p>
                    {localFiles && (
                      <>
                        <button
                          type="button"
                          onClick={onPickLocalFolder}
                          className="text-[11px] underline font-semibold"
                          style={{ color: "var(--blue)" }}
                        >
                          Reselect folder
                        </button>
                        <button
                          type="button"
                          onClick={onPickLocalZip}
                          className="text-[11px] underline font-semibold"
                          style={{ color: "var(--blue)" }}
                        >
                          ZIP
                        </button>
                      </>
                    )}
                  </div>
                )}
                {source === "live" && (
                  <p style={{ color: "var(--text2)" }}>
                    Merges uploaded project files with AI-generated files (generated paths win on conflict). Single-file
                    output uses your framework extension when there is only <code className="text-[11px]">generatedCode</code>.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                    <input type="checkbox" checked={useNewRepo} onChange={(e) => setUseNewRepo(e.target.checked)} />
                    Create new repository
                  </label>
                </div>
                {useNewRepo ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="repo-name"
                      className="rounded-xl px-3 py-2 text-[12px] outline-none"
                      style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                    />
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" checked={createPrivate} onChange={(e) => setCreatePrivate(e.target.checked)} />
                      Private
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleCreateRepo()}
                      disabled={creatingRepo || !user}
                      className="flex items-center justify-center gap-1 sm:col-span-2 py-2 rounded-xl text-[11px] font-bold"
                      style={{ background: "var(--violet)", color: "#fff" }}
                    >
                      {creatingRepo ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Create on GitHub
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <select
                        value={selectedFullName}
                        onChange={(e) => setSelectedFullName(e.target.value)}
                        className="flex-1 rounded-xl px-2 py-2 text-[11px] outline-none min-w-0"
                        style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                      >
                        <option value="">— Select repository —</option>
                        {repos.map((r) => (
                          <option key={r.full_name} value={r.full_name}>
                            {r.full_name} {r.private ? "(private)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void loadRepos()}
                        disabled={reposLoading}
                        className="p-2 rounded-xl border"
                        style={{ borderColor: "var(--border2)" }}
                        title="Refresh list"
                      >
                        <RefreshCw size={14} className={reposLoading ? "animate-spin" : ""} />
                      </button>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text3)" }}>
                      Target: <span className="font-mono">{ownerRepo.owner}/{ownerRepo.repo}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text3)" }}>
                    Branch
                  </span>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    disabled={!ownerRepo.repo || branchLoading}
                    className="w-full rounded-xl px-2 py-2 text-[11px] outline-none"
                    style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text3)" }}>
                    Commit message
                  </span>
                  <input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full rounded-xl px-2 py-2 text-[11px] outline-none"
                    style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handlePush()}
                disabled={pushing || triggeringHook || !user}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold"
                style={{ background: "var(--green)", color: "#fff" }}
              >
                {pushing || triggeringHook ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                Push {workspaceSnapshot.length} file(s) in one commit
              </button>

              {lastPush && (
                <div
                  className="rounded-xl p-3 space-y-2 text-[11px]"
                  style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}
                >
                  <p className="font-semibold" style={{ color: "var(--text)" }}>
                    Last push
                  </p>
                  <p className="font-mono break-all" style={{ color: "var(--text2)" }}>
                    {lastPush.owner}/{lastPush.repo}@{lastPush.sha.slice(0, 7)}
                  </p>
                  <a
                    href={lastPush.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold"
                    style={{ color: "var(--blue)" }}
                  >
                    View commit <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          )}

          {tab === "deploy" && (
            <div className="space-y-4">
              <p style={{ color: "var(--text2)" }}>
                Push code to GitHub from the <strong>Push</strong> tab, then deploy: connect the same repo to{" "}
                <strong>Vercel</strong>, <strong>Netlify</strong>, or <strong>Render</strong> once. After that,
                optional <em>deploy hooks</em> let this app trigger a new production build right after each push.
              </p>

              {canShowRepoLinks ? (
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    Open setup (imports GitHub repo)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={vercelCloneImportUrl(deployOwner, deployRepo)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold"
                      style={{ background: "#000", color: "#fff" }}
                    >
                      Deploy on Vercel <ExternalLink size={10} />
                    </a>
                    <a
                      href={netlifyNewRepoUrl(deployOwner, deployRepo)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold"
                      style={{ background: "#00AD9F", color: "#fff" }}
                    >
                      Deploy on Netlify <ExternalLink size={10} />
                    </a>
                    <a
                      href={githubRepoUrl(deployOwner, deployRepo)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold border"
                      style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                    >
                      Open repo <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text3)" }}>
                    Private repos require signing in on the provider; hooks only work after the project is linked.
                  </p>
                </div>
              ) : (
                <p style={{ color: "var(--amber)" }}>
                  Select or name a repository on the <strong>Push</strong> tab to enable one-click Vercel/Netlify links.
                </p>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                  Deploy hook (optional)
                </p>
                <input
                  type="password"
                  autoComplete="off"
                  value={deployHookUrl}
                  onChange={(e) => setDeployHookUrl(e.target.value)}
                  placeholder="https://api.vercel.com/v1/integrations/deploy/… or https://api.netlify.com/build_hooks/…"
                  className="w-full rounded-xl px-3 py-2 outline-none font-mono text-[11px]"
                  style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                />
                <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTriggerAfterPush}
                    onChange={(e) => setAutoTriggerAfterPush(e.target.checked)}
                  />
                  Trigger this hook automatically after a successful GitHub push
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveDeploySettings()}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold border"
                    style={{ borderColor: "var(--border2)", color: "var(--text)" }}
                  >
                    Save deploy settings
                  </button>
                  <button
                    type="button"
                    onClick={() => void triggerDeployHookNow()}
                    disabled={triggeringHook || !deployHookUrl.trim()}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold"
                    style={{ background: "var(--violet)", color: "#fff" }}
                  >
                    {triggeringHook ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                    Trigger deploy now
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "var(--text3)" }}>
                  Create a hook in your dashboard:{" "}
                  <a
                    href="https://vercel.com/docs/deployments/deployment-methods#deploy-hooks"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: "var(--blue)" }}
                  >
                    Vercel deploy hooks
                  </a>
                  {" · "}
                  <a
                    href="https://docs.netlify.com/configure-builds/build-hooks/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: "var(--blue)" }}
                  >
                    Netlify build hooks
                  </a>
                  {" · "}
                  <a
                    href="https://render.com/docs/deploy-hook"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: "var(--blue)" }}
                  >
                    Render deploy hooks
                  </a>
                  . The URL is stored only in your browser.
                </p>
              </div>
            </div>
          )}

          {tab === "branches" && (
            <div className="space-y-4">
              <p style={{ color: "var(--text2)" }}>
                Repository: <span className="font-mono">{ownerRepo.owner}/{ownerRepo.repo || "?"}</span> — use{" "}
                <strong>Push</strong> tab to select a repo if empty.
              </p>
              <button
                type="button"
                onClick={() => void loadBranches()}
                disabled={branchLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold border"
                style={{ borderColor: "var(--border2)" }}
              >
                <RefreshCw size={14} className={branchLoading ? "animate-spin" : ""} />
                Refresh branches
              </button>
              <ul className="rounded-xl overflow-hidden border max-h-48 overflow-y-auto" style={{ borderColor: "var(--border2)" }}>
                {branches.map((b) => (
                  <li
                    key={b.name}
                    className="px-3 py-2 text-[11px] font-mono flex justify-between gap-2"
                    style={{ borderBottom: "1px solid var(--border2)" }}
                  >
                    <span>{b.name}</span>
                    <span style={{ color: "var(--text3)" }}>{b.sha.slice(0, 7)}</span>
                  </li>
                ))}
                {!branches.length && (
                  <li className="px-3 py-4 text-center" style={{ color: "var(--text3)" }}>
                    No branches loaded
                  </li>
                )}
              </ul>
              <div className="flex flex-wrap gap-2 items-end">
                <label className="flex-1 min-w-[140px] space-y-1">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text3)" }}>
                    New branch from &quot;{targetBranch || "main"}&quot;
                  </span>
                  <input
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="feature/my-change"
                    className="w-full rounded-xl px-2 py-2 text-[11px] outline-none font-mono"
                    style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleCreateBranch()}
                  disabled={creatingBranch || !newBranchName.trim()}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold"
                  style={{ background: "var(--blue)", color: "#fff" }}
                >
                  {creatingBranch ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
                  Create
                </button>
              </div>
            </div>
          )}

          {tab === "diff" && (
            <div className="space-y-4">
              <p style={{ color: "var(--text2)" }}>
                Compare two branches (or tags / SHAs). Uses GitHub&apos;s compare API — same idea as{" "}
                <code className="text-[10px]">git diff base...head</code>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text3)" }}>
                    Base
                  </span>
                  <input
                    value={diffBase}
                    onChange={(e) => setDiffBase(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-xl px-2 py-2 text-[11px] outline-none font-mono"
                    style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text3)" }}>
                    Head
                  </span>
                  <input
                    value={diffHead}
                    onChange={(e) => setDiffHead(e.target.value)}
                    placeholder="develop"
                    className="w-full rounded-xl px-2 py-2 text-[11px] outline-none font-mono"
                    style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleCompare()}
                disabled={compareLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold"
                style={{ background: "var(--violet)", color: "#fff" }}
              >
                {compareLoading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
                Load diff
              </button>
              {compareMeta && (
                <div className="text-[11px] space-y-1" style={{ color: "var(--text2)" }}>
                  <div>
                    Ahead: <strong style={{ color: "var(--text)" }}>{compareMeta.ahead_by}</strong> · Behind:{" "}
                    <strong style={{ color: "var(--text)" }}>{compareMeta.behind_by}</strong>
                  </div>
                  {compareMeta.html_url && (
                    <a href={compareMeta.html_url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                      Open on GitHub <ExternalLink size={10} className="inline" />
                    </a>
                  )}
                </div>
              )}
              <ul className="space-y-2">
                {compareFiles.map((f) => (
                  <li key={f.filename} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border2)" }}>
                    <button
                      type="button"
                      onClick={() => setExpandedPatch((p) => (p === f.filename ? null : f.filename))}
                      className="w-full text-left px-3 py-2 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ background: "var(--bg2)" }}
                    >
                      <span className="font-mono flex-1 min-w-0 break-all">{f.filename}</span>
                      <span style={{ color: "var(--green)" }}>+{f.additions}</span>
                      <span style={{ color: "#f87171" }}>-{f.deletions}</span>
                      <span className="px-1.5 rounded text-[10px]" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>
                        {f.status}
                      </span>
                    </button>
                    {expandedPatch === f.filename && f.patch && (
                      <pre
                        className="p-2 text-[10px] overflow-x-auto max-h-64 overflow-y-auto m-0 font-mono whitespace-pre-wrap"
                        style={{ background: "var(--code-bg)", color: "var(--text)" }}
                      >
                        {f.patch}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
              {!compareLoading && compareMeta && !compareFiles.length && (
                <p style={{ color: "var(--text2)" }}>No file changes between these refs.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
