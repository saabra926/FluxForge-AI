import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FileEntry, Framework, GenerationConfig, QualityCheck } from "@/types";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function getFileExtension(framework?: Framework | string | null) {
  const key = framework ?? "HTML+CSS";
  const map: Record<string, string> = {
    "HTML+CSS": "html",
    "React.js": "jsx",
    "Next.js": "tsx",
    "Vite + React": "tsx",
    "Vite + React + Node.js": "tsx",
    "Vue.js": "vue",
    "Nuxt.js": "vue",
    "Angular": "ts",
    "Svelte": "svelte",
    "SvelteKit": "ts",
    "Astro": "astro",
    "Remix": "tsx",
    "React Native": "tsx",
    "Expo": "tsx",
    Flutter: "dart",
  };
  return map[key] ?? "html";
}

/**
 * Robustly strips ALL wrapping code-fence blocks.
 * Handles: standard fences, prose before/after a fence, multiple nested
 * fences, and the common model pattern of adding an explanation after ```.
 */
export function stripCodeFences(raw: string): string {
  if (!raw) return "";
  let result = raw.trim();

  // Repeatedly peel the outermost fence (up to 5 passes)
  for (let i = 0; i < 5; i++) {
    const m = result.match(/^```[\w\-.\s]*\r?\n([\s\S]*?)\n?```\s*$/);
    if (m) {
      result = m[1].trim();
    } else {
      break;
    }
  }

  // Model added prose after the closing fence – extract just the first block
  if (result.includes("```")) {
    const firstBlock = raw.match(/```[\w\-.\s]*\r?\n([\s\S]*?)\n?```/);
    if (firstBlock) {
      const candidate = firstBlock[1].trim();
      // Use extracted block only if it is more code-like than current result
      if (candidate.length > result.length) result = candidate;
    }
  }

  return result.trim();
}

function toDate(ts: number | string | Date): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === "number") return new Date(ts);
  const parsed = new Date(ts);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatTime(ts: number | string | Date) {
  return toDate(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ts: number | string | Date) {
  return toDate(ts).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function countLines(code: string) {
  return code.trim().length ? code.split("\n").length : 0;
}

const LANG_MAP: Record<string, string> = {
  ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  html: "html", htm: "html",
  css: "css", scss: "css", sass: "css", less: "css",
  json: "json", jsonc: "json",
  md: "markdown", mdx: "markdown",
  svg: "svg", png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  env: "dotenv", yaml: "yaml", yml: "yaml",
  py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
  php: "php", kt: "kotlin", swift: "swift", dart: "dart",
  sh: "bash", bash: "bash",
  sql: "sql", prisma: "prisma", graphql: "graphql",
  xml: "xml", toml: "toml", ini: "ini",
};

export function parseMultiFile(raw: string): Array<{ path: string; content: string; language: string }> {
  const files: Array<{ path: string; content: string; language: string }> = [];

  // Flexible pattern: handles \r\n, optional trailing spaces on marker lines,
  // and the model occasionally using single = instead of ===
  const pattern = /\/\/ ={1,3}FILE:\s*(.+?)={1,3}\r?\n([\s\S]*?)\/\/ ={1,3}END FILE={0,3}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    const path = match[1].trim();
    const fileContent = match[2].trim();
    if (!path) continue;
    const ext = path.split(".").pop()?.toLowerCase() ?? "txt";
    files.push({ path, content: fileContent, language: LANG_MAP[ext] ?? "text" });
  }

  if (files.length === 0 && raw.trim()) {
    // Single-file fallback: guess language from first line if it looks like a shebang or doctype
    const trimmed = raw.trim();
    const firstLine = trimmed.split("\n")[0].toLowerCase();
    let language = "html";
    if (firstLine.startsWith("import ") || firstLine.startsWith("const ") || firstLine.startsWith("export ")) language = "typescript";
    else if (firstLine.startsWith("<?php")) language = "php";
    else if (firstLine.startsWith("#!")) language = "bash";
    files.push({ path: "output.html", content: trimmed, language });
  }

  return files;
}

/**
 * Splits an audit response at the <<<REPORT>>> / <<<CODE>>> markers.
 * Falls back gracefully when the model omits one or both markers so that
 * callers always receive non-null strings.
 */
export function splitAuditResponse(raw: string): { report: string; code: string } {
  // Flexible match: handles both \n and \r\n, and trailing whitespace
  const reportMatch = raw.match(/<<<REPORT>>>\r?\n([\s\S]*?)\r?\n?<<<CODE>>>/);
  const codeMatch   = raw.match(/<<<CODE>>>\r?\n?([\s\S]*)$/);

  const report = reportMatch?.[1]?.trim() ?? "";
  // codeMatch[1] could be "" if the model put nothing after <<<CODE>>>
  const rawCode = codeMatch?.[1]?.trim();
  // If the code section is empty fall back to the full response so the
  // caller's `audit.code || responseText` safety net still triggers.
  const code = rawCode || raw.trim();

  return { report, code };
}

export function truncateProjectContent(content: string, maxChars = 12000) {
  const clean = content.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars)}\n\n[truncated ${clean.length - maxChars} characters]`;
}

export function isProbablyTextFile(path: string) {
  return /\.(tsx?|jsx?|mjs|cjs|json|mdx?|css|scss|sass|less|html?|xml|yml|yaml|env|txt|ini|toml|graphql|gql|sql|prisma|py|rb|go|java|kt|kts|cs|php|dart|rs|swift)$/i.test(path);
}

export async function compressImage(file: File, maxWidth = 1280, quality = 0.88) {
  return new Promise<{ base64: string; preview: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to initialize canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64: dataUrl.split(",")[1], preview: dataUrl });
      };
      img.onerror = reject;
      img.src = String(e.target?.result ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function syntaxHighlight(code: string) {
  const keywordRe = /\b(const|let|var|function|return|import|export|default|from|class|if|else|for|while|async|await|interface|type|extends|implements|new|this|try|catch|finally|throw|switch|case|break|continue|yield)\b/g;
  const literalRe = /\b(true|false|null|undefined|void)\b/g;
  const numberRe = /\b(\d+)\b/g;

  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\/\*([\s\S]*?)\*\//g, '<span style="color:#6272a4;font-style:italic">/*$1*/</span>')
    .replace(/\/\/.*?/g, '<span style="color:#6272a4;font-style:italic">$&</span>')
    .replace(/"([^"]*)"/g, '<span style="color:#f1fa8c">"$1"</span>')
    .replace(keywordRe, '<span style="color:#ff79c6">$1</span>')
    .replace(literalRe, '<span style="color:#bd93f9">$1</span>')
    .replace(numberRe, '<span style="color:#bd93f9">$1</span>')
    .replace(/&lt;(\/?)([\w-]+)/g, (_: string, sl: string, tag: string) => `&lt;${sl}<span style="color:#50fa7b">${tag}</span>`)
    .replace(/([\w-]+)=(?=&quot;|")/g, '<span style="color:#ffb86c">$1</span>=');
}

export function runLocalCodeChecks(code: string, files: FileEntry[], config: GenerationConfig): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const lower = code.toLowerCase();
  const multiFile = files.length > 1;
  const wantsMultiFile =
    config.projectType === "Full Project" ||
    config.projectType === "Full Stack" ||
    config.category === "Full Stack" ||
    config.category === "Backend";

  const add = (name: string, passed: boolean, message: string, severity: QualityCheck["severity"] = "info") => {
    checks.push({ name, passed, message, severity });
  };

  const semanticRe = /<header|<main|<section|<nav|<article|<footer|aria-|role=/;
  const responsiveRe = /@media|sm:|md:|lg:|xl:|grid|flex|clamp\(/;
  const accessibilityRe = /aria-|alt=|tabindex|tabIndex|focus-visible|role=/;
  const placeholderRe = /todo|fixme|lorem ipsum|placeholder/;

  const complexityRe = /function\s+\w+\s*\(.*?\)\s*{[\s\S]{500,}}|const\s+\w+\s*=\s*\(.*?\)\s*=>\s*{[\s\S]{500,}}/;
  const modularRe = wantsMultiFile ? files.length >= 3 : true;

  add("Non-empty output", code.trim().length > 0, code.trim().length > 0 ? "Code was generated." : "Generated output is empty.", "error");
  add("Structure markers", !wantsMultiFile || multiFile || !code.includes("// ===FILE:"), multiFile ? `${files.length} file(s) detected.` : "Single-file output detected.", wantsMultiFile && !multiFile ? "warning" : "info");
  add("Modularization", modularRe, modularRe ? "Project is properly modularized." : "Consider splitting logic into more files.", "warning");
  add("Function Complexity", !complexityRe.test(code), !complexityRe.test(code) ? "Functions appear focused and modular." : "Some functions are overly long; consider refactoring.", "warning");
  add("Semantic structure", semanticRe.test(lower), semanticRe.test(lower) ? "Semantic or accessible structure present." : "Add semantic regions and accessibility hooks.", semanticRe.test(lower) ? "info" : "warning");
  add("Responsive design", responsiveRe.test(lower), responsiveRe.test(lower) ? "Responsive patterns detected." : "Responsive breakpoints or layout strategies are limited.", responsiveRe.test(lower) ? "info" : "warning");
  add("Accessibility", accessibilityRe.test(lower), accessibilityRe.test(lower) ? "Accessibility hooks are present." : "No strong accessibility signals detected.", accessibilityRe.test(lower) ? "info" : "warning");
  add("No placeholder language", !placeholderRe.test(lower), !placeholderRe.test(lower) ? "No placeholder text found." : "Placeholder content found in output.", placeholderRe.test(lower) ? "error" : "info");
  add("Project completeness", !wantsMultiFile || files.some((f) => /readme|package\.json|app\.|src\//i.test(f.path)) || code.includes("package.json"), wantsMultiFile ? "Project structure appears complete." : "Single-file output is acceptable for this scope.", "info");

  return checks;
}

export function estimateQualityScore(code: string, files: FileEntry[] = [], config?: GenerationConfig) {
  const checks = runLocalCodeChecks(code, files, config ?? {
    framework: "HTML+CSS",
    styling: ["Custom CSS"],
    language: "TypeScript",
    projectType: "Component",
    a11y: "WCAG AA",
    mode: "balanced",
    includeHtml: true,
  });

  const passed = checks.filter((c) => c.passed).length;
  const warnings = checks.filter((c) => !c.passed && c.severity === "warning").length;
  const errors = checks.filter((c) => !c.passed && c.severity === "error").length;

  const score = Math.round(55 + passed * 6 - warnings * 4 - errors * 8);
  return Math.max(0, Math.min(100, score));
}

export function evaluateCodeQuality(code: string, files: FileEntry[], config: GenerationConfig) {
  const checks = runLocalCodeChecks(code, files, config);
  return { checks, score: estimateQualityScore(code, files, config) };
}

// ── Engineering stream markers (strip before showing code; extract plan for UI) ──

const UIGEN_PHASE_LINE =
  /<<<UIGEN:PHASE:\d+:(?:start:[^>]*|done)>>>\n?/g;
const UIGEN_PLAN_BLOCK =
  /<<<UIGEN:PLAN>>>\n([\s\S]*?)\n<<<UIGEN:END_PLAN>>>\n?/;

/** Remove phase lines and embedded engineering plan from streamed model output. */
export function stripEngineeringStreamMarkers(raw: string): string {
  return raw.replace(UIGEN_PLAN_BLOCK, "").replace(UIGEN_PHASE_LINE, "").trimStart();
}

/** Extract plan / engineering brief embedded in the stream (if present). */
export function extractEngineeringPlan(raw: string): string | null {
  const m = raw.match(UIGEN_PLAN_BLOCK);
  return m ? m[1].trim() : null;
}
