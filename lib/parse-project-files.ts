import JSZip from "jszip";
import { isProbablyTextFile } from "@/lib/utils";

export async function parseProjectFiles(files: File[]) {
  const out: Array<{ path: string; content: string; language: string }> = [];
  const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));

  if (zipFile) {
    const zip = await JSZip.loadAsync(zipFile);
    const entries = Object.values(zip.files)
      .filter((e) => !e.dir)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (out.length >= 60) break;
      if (!isProbablyTextFile(entry.name)) continue;
      if (/node_modules|\.git|\.next|dist\/|build\/|\.cache/i.test(entry.name)) continue;
      const content = await entry.async("string");
      out.push({ path: entry.name, content, language: detectLanguage(entry.name) });
    }
    return out;
  }

  for (const file of files.slice(0, 60)) {
    if (!isProbablyTextFile(file.name)) continue;
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (/node_modules|\.git|\.next|dist\/|build\/|\.cache/i.test(relativePath)) continue;
    const content = await file.text();
    out.push({ path: relativePath, content, language: detectLanguage(file.name) });
  }
  return out;
}

export function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "txt";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", mjs: "javascript", cjs: "javascript",
    js: "javascript", jsx: "javascript", html: "html", htm: "html",
    css: "css", scss: "css", sass: "css", less: "css",
    json: "json", yaml: "yaml", yml: "yaml", md: "markdown",
    py: "python", go: "go", java: "java", php: "php",
    rb: "ruby", rs: "rust", kt: "kotlin", swift: "swift", dart: "dart",
    sql: "sql", sh: "bash", graphql: "graphql", prisma: "prisma",
    toml: "toml", env: "dotenv",
  };
  return map[ext] ?? "text";
}
