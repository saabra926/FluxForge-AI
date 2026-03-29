import { getFileExtension } from "@/lib/utils";
import type { FileEntry, Framework } from "@/types";

function normalizePath(p: string) {
  return p.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function sanitizeBasename(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
}

/**
 * Files to push from the current app: uploaded project + generated output.
 * Generated paths override the same path in uploaded project.
 */
export function mergeWorkspaceFiles(opts: {
  projectName: string;
  projectFiles: FileEntry[];
  generatedFiles: FileEntry[];
  generatedCode: string;
  framework: Framework | undefined;
}): FileEntry[] {
  const map = new Map<string, FileEntry>();

  for (const f of opts.projectFiles) {
    const p = normalizePath(f.path);
    if (!p) continue;
    map.set(p, { ...f, path: p });
  }

  for (const f of opts.generatedFiles) {
    const p = normalizePath(f.path);
    if (!p) continue;
    map.set(p, { ...f, path: p });
  }

  if (!opts.generatedFiles.length && opts.generatedCode.trim()) {
    const ext = getFileExtension(opts.framework ?? "HTML+CSS");
    const base = sanitizeBasename(opts.projectName || "generated");
    const path = `${base}.${ext}`;
    map.set(path, {
      path,
      content: opts.generatedCode,
      language: ext === "tsx" || ext === "ts" ? "typescript" : ext === "jsx" || ext === "js" ? "javascript" : ext,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}
