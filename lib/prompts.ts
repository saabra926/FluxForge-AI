// ============================================================
// lib/prompts.ts — Production-grade prompt builders
// ============================================================
import type { BackendGenRequest, ExtraLibraryEntry, FileEntry, GenerationConfig } from "@/types";
import { isProbablyTextFile, truncateProjectContent } from "@/lib/utils";
import { needsBackendStackFields } from "@/lib/generation-config";

// ─────────────────────────────────────────────────────────────
// Shared rules
// ─────────────────────────────────────────────────────────────

const OUTPUT_FORMAT_RULES = `
OUTPUT FORMAT — follow exactly:
- Return raw code only. NEVER wrap output in markdown code fences (\`\`\`).
- NEVER add prose, headings, explanations, or commentary before or after code.
- Multi-file projects: emit every file using EXACTLY this marker format:
    // ===FILE: path/to/file===
    <file content here>
    // ===END FILE===
- Single-file projects: return just the raw file contents with no wrapper.
- When in doubt between single-file and multi-file, use multi-file for anything with more than one logical concern.
`.trim();

const FULL_PROJECT_STRUCTURE_RULES = `
FULL PROJECT REQUIREMENTS:
- Always include: package.json (with all dependencies), README.md, .env.example.
- Use a proper directory structure (src/, components/, pages/ or app/, lib/, hooks/, types/, public/).
- Every component in its own file. No mega-files over 400 lines.
- Include a root index/layout file that ties everything together.
- All imports must be resolvable within the generated file set.
- tsconfig.json with strict mode enabled (when TypeScript is requested).
`.trim();

// ─────────────────────────────────────────────────────────────
// System prompts
// ─────────────────────────────────────────────────────────────

const FRONTEND_SYSTEM_RULES = `
You are an elite senior product engineer generating production-grade frontend code.

ZERO-TOLERANCE POLICY:
- NO "TODO" comments. Implement every feature requested.
- NO "lorem ipsum" or placeholder text. Use context-aware real copy.
- NO empty components, sections, or styles. Everything must be functional.
- NO truncated code. If a file is large, emit it in its entirety.

ENGINEERING PRINCIPLES:
- Production-Grade: Write code a principal engineer would be proud to ship. Use clean architecture and robust patterns.
- Semantic & Accessible: Use landmarks, ARIA labels, and focus management (WCAG AA minimum).
- Performance: Optimize bundle size, use lazy loading where appropriate, and ensure 60fps animations.
- Error Resilience: Implement robust error boundaries, empty states, and loading skeletons.
- Mobile-First: All layouts must be responsive (320px to 1440px+).
- Clean Imports: Every import must be resolvable and used. No circular dependencies.
- Modular Design: Keep functions small (cyclomatic complexity < 10). Split large components into smaller, reusable pieces.

VISUAL & UX EXCELLENCE:
- Polished Design: Use consistent spacing, premium typography, and subtle micro-interactions.
- State Management: Use context or state libraries correctly. No "prop drilling" past 3 levels.

${OUTPUT_FORMAT_RULES}
`.trim();

const FEATURE_ENHANCEMENT_SYSTEM_RULES = `
You are an elite senior engineer adding features and making improvements to an existing codebase.

PRINCIPLES:
- Study the uploaded codebase thoroughly before making any changes.
- Understand the existing architecture, patterns, naming conventions, and code style.
- Match the existing code style exactly — same indentation, same naming patterns, same import style.
- Make the smallest correct change set that fulfills the user's request.
- Do NOT refactor or rewrite code that the user did not ask to change.
- Do NOT remove any existing features or functionality.
- All new code must integrate seamlessly with the existing codebase.
- All new imports must be compatible with existing dependencies.
- If adding a new dependency is absolutely necessary, add it to package.json too.
- Return ONLY the files that were modified or created — not the entire project.

SELF-CHECK (perform silently before outputting):
1. Does every changed file still compile correctly with the existing codebase?
2. Are all new imports resolvable in the existing dependency tree?
3. Did I preserve all existing functionality?
4. Is the code style consistent with the existing files?
5. Are the changes complete — nothing is half-implemented?

${OUTPUT_FORMAT_RULES}
`.trim();

const BACKEND_SYSTEM_RULES = `
You are an elite senior backend engineer generating production-ready server code.

ZERO-TOLERANCE POLICY:
- NO "TODO" or placeholder handlers. Every endpoint must be fully functional.
- NO hard-coded secrets or credentials. Use environment variables exclusively.
- NO swallowed exceptions. Every catch block must log and handle errors correctly.

ENGINEERING PRINCIPLES:
- Secure by Design: Implement input validation (Zod/Joi), CORS, rate limiting, and security headers (Helmet).
- Architecture: Use service-layer separation (Controller -> Service -> Model). Implement Dependency Injection where practical.
- Reliability: Include a /health endpoint, request logging (Morgan/Winston), and structured JSON error responses.
- Database Excellence: Use migrations (if applicable), proper indexing, and optimized queries.
- API Standards: Use correct HTTP status codes and RESTful/GraphQL best practices.
- Types: If using TypeScript, no "any". Use strict types and interfaces for all data.
- Modularization: Keep business logic separated from transport layers. Ensure cyclomatic complexity < 10.

${OUTPUT_FORMAT_RULES}
`.trim();

const MOBILE_SYSTEM_RULES = `
You are an elite senior mobile engineer generating production-ready mobile application code.

ZERO-TOLERANCE POLICY:
- NO "TODO" comments. All navigation and screens must be fully implemented.
- NO placeholder widgets. Use real UI elements and context-aware copy.
- NO truncated files. Every file must be complete and syntactically correct.

ENGINEERING PRINCIPLES:
- Clean Architecture: Strictly separate Presentation (UI), Domain (Business Logic), and Data (API/Storage) layers.
- Native Performance: Optimize list rendering (FlatList/ListView), image caching, and avoid unnecessary re-renders.
- Robust Navigation: Use deep-linking ready navigation (Expo Router / GoRouter).
- Error Handling: Global error handlers, offline support hints, and retry mechanisms.
- State Management: Use Provider, Riverpod, or Bloc correctly. No monolithic state objects.

FRAMEWORK SPECIFICS:
- React Native (Expo): Use Expo SDK 50+ patterns, functional components with hooks, and Expo Router. Use NativeWind or React Native Paper if specified.
- Flutter: Use latest stable Dart, null-safe code, const widgets, and Material 3 / Cupertino theming.

${OUTPUT_FORMAT_RULES}
`.trim();

// ─────────────────────────────────────────────────────────────
// Stack hint builders
// ─────────────────────────────────────────────────────────────

export function userLibraryDependencyRules(libs: ExtraLibraryEntry[] | undefined): string {
  const trimmed = (libs ?? []).filter((l) => l.name?.trim());
  if (!trimmed.length) {
    return [
      "ADDITIONAL NPM DEPENDENCIES:",
      "- Do not add packages beyond what the selected framework/stack minimally requires.",
      "- Do not add optional UI kits, analytics, or helpers unless indispensable for the stack itself.",
    ].join("\n");
  }
  return [
    "USER-REQUESTED NPM LIBRARIES (exclusive):",
    ...trimmed.map((l) => `- ${l.name.trim()}: ${(l.purpose || "").trim()}`),
    "",
    "- Include these in package.json only when needed for the implementation.",
    "- Do NOT add any other npm packages, CDNs, or dependencies beyond the stack minimum plus the list above.",
  ].join("\n");
}

function strictStackRules(config: GenerationConfig): string {
  const primaryStyling = config.styling[0] ?? "Custom CSS";
  return [
    "STRICT TECHNOLOGY SCOPE (non-negotiable):",
    "- Implement ONLY what appears in STACK CONFIGURATION. Do not add extra npm packages, CSS frameworks, ORMs, databases, or APIs unless they are strictly required by the selected framework and unavoidable.",
    "- Do not substitute technologies (for example: no Vue in a React project, no extra ORMs or databases beyond the selected stack).",
    primaryStyling === "Custom CSS"
      ? "- Styling: Use plain CSS files or <style> only. Do NOT use Tailwind, Bootstrap, or other utility/CSS frameworks."
      : primaryStyling === "Tailwind CSS"
        ? "- Styling: Tailwind CSS utilities only for styling. Do NOT add Bootstrap, Bulma, or parallel global CSS frameworks."
        : primaryStyling === "Bootstrap"
          ? "- Styling: Bootstrap only. Do NOT add Tailwind or other CSS frameworks."
          : primaryStyling === "Three.js"
            ? "- Styling: Use three.js for 3D/WebGL where needed; use plain minimal CSS for chrome/layout. Do not add Babylon.js, A-Frame, or other 3D runtimes."
            : primaryStyling === "Shadcn/ui"
              ? "- Styling: Shadcn/ui + Tailwind as required by shadcn. Do not add Bootstrap or parallel component libraries."
              : `- Styling: Follow "${primaryStyling}" exclusively for presentation.`,
    config.includeHtml
      ? "- HTML: Deliver real semantic HTML (or JSX/SFC output that renders semantic HTML). No canvas-only UIs unless Three.js is selected for 3D."
      : "- HTML: (configuration should have required HTML — still output semantic structure.)",
    needsBackendStackFields(config.category, config.projectType) && config.apiStyle === "GraphQL"
      ? "- APIs: GraphQL only — no parallel REST surface unless explicitly required for health checks."
      : needsBackendStackFields(config.category, config.projectType) && config.apiStyle === "REST"
        ? "- APIs: REST/HTTP JSON only — no GraphQL schema or resolvers."
        : "",
    needsBackendStackFields(config.category, config.projectType) && config.dataStoreKind === "SQL"
      ? "- Database: SQL only — use the selected SQL database; do not add MongoDB or other NoSQL stores."
      : needsBackendStackFields(config.category, config.projectType) && config.dataStoreKind === "NoSQL"
        ? "- Database: NoSQL only — use the selected store; do not add PostgreSQL/MySQL/SQLite."
        : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function frontendStackHint(config: GenerationConfig): string {
  const lines = [
    `Category:          ${config.category ?? "Frontend"}`,
    `Framework:         ${config.framework}`,
    `Language:          ${config.language}`,
    `Styling:           ${config.styling.join(", ")}`,
    `Project type:      ${config.projectType}`,
    `Accessibility:     ${config.a11y}`,
    `Generation mode:   ${config.mode}`,
    `HTML required:     ${config.includeHtml ? "yes" : "no"}`,
  ];

  const isFullProject =
    config.projectType === "Full Stack" ||
    config.projectType === "Full Project" ||
    config.category === "Full Stack";

  if (config.framework === "HTML+CSS" && config.styling.includes("Custom CSS") && !isFullProject) {
    lines.push("Project shape:     Simple static HTML + CSS only — no bundler unless project type is Full Project.");
  } else if (isFullProject) {
    lines.push(
      "Project shape:     Create a root folder with frontend/ and backend/ subdirectories, plus README.md and .env.example.",
      FULL_PROJECT_STRUCTURE_RULES
    );
  } else if (config.projectType === "Full Page") {
    lines.push("Project shape:     Single page with complete layout — header, main content, footer, all sections.");
  } else {
    lines.push("Project shape:     Self-contained component or minimal multi-file module.");
  }

  if (config.framework === "React.js" || config.framework === "Next.js" || config.framework === "Remix" || config.framework === "Vite + React" || config.framework === "Vite + React + Node.js") {
    lines.push("Component style:   Functional components with hooks only. No class components.");
  }

  if (config.framework === "Next.js") {
    const full = config.projectType === "Full Stack" || config.category === "Full Stack";
    lines.push(
      full
        ? "Next.js scope:     App Router full-stack — use Route Handlers / server actions matching the selected API style and database; no extra backend stack unless STACK lists it."
        : "Next.js scope:     App Router frontend only — pages/ UI; no separate backend services unless project type is Full Stack."
    );
  }

  if (config.framework === "Vite + React") {
    lines.push("Vite scope:        Vite + React SPA only — no Node backend unless you switch project/framework to full-stack.");
  }
  if (config.framework === "Vite + React + Node.js") {
    lines.push("Vite + Node scope: Vite dev server for frontend/ + Node.js backend/ — wire with selected REST or GraphQL only.");
  }

  if (config.styling.includes("Tailwind CSS")) {
    lines.push("Tailwind:          Utility classes for styling layers where Tailwind is selected.");
  }
  if (config.styling.includes("Shadcn/ui")) {
    lines.push("Shadcn/ui:         Import from @/components/ui/*. Do not redefine shadcn primitives inline.");
  }
  if (config.framework === "Flutter") {
    lines.push(
      "Flutter:           Use null-safe Dart, const widgets where possible, Material 3 / Cupertino theming, and scalable lib/ or feature-first folders."
    );
  }

  if (needsBackendStackFields(config.category, config.projectType)) {
    lines.push(
      `Backend framework: ${config.backendFramework}`,
      `Data store:        ${config.dataStoreKind}`,
      `Database:          ${config.database}`,
      `API style:         ${config.apiStyle}`,
    );
  }

  return lines.join("\n");
}

function backendStackHint(config: Omit<BackendGenRequest, "description">): string {
  return [
    `Backend framework: ${config.backendFramework}`,
    `Language:          ${config.language}`,
    `Database:          ${config.database}`,
    `Auth required:     ${config.includeAuth ? "yes — include JWT-based auth middleware and route guards" : "no"}`,
    `Tests required:    ${config.includeTests ? "yes — include unit tests with a popular test runner for the chosen framework" : "no"}`,
    `Endpoints:         ${(config.endpoints ?? []).length
      ? (config.endpoints ?? []).join(", ")
      : "derive sensible RESTful CRUD endpoints from the description"}`,
  ].join("\n");
}

function projectManifest(files: FileEntry[]): string {
  return files
    .map((file, i) => {
      const content = isProbablyTextFile(file.path)
        ? truncateProjectContent(file.content, 8_000)
        : "[binary or unsupported file omitted]";
      return `--- File ${i + 1}: ${file.path} ---\n${content}`;
    })
    .join("\n\n");
}

// ─────────────────────────────────────────────────────────────
// Public prompt builders
// ─────────────────────────────────────────────────────────────

export function buildFrontendSystemPrompt(config: GenerationConfig, extraLibraries?: ExtraLibraryEntry[]): string {
  if (config.category === "Project Audit") {
    return buildProjectAuditSystemPrompt(config, extraLibraries);
  }
  const isMobile = config.category === "React Native Application" || config.category === "Flutter Application" || config.framework === "React Native" || config.framework === "Expo" || config.framework === "Flutter";
  const systemRules = isMobile ? MOBILE_SYSTEM_RULES : FRONTEND_SYSTEM_RULES;
  return `${systemRules}\n\n--- STACK CONFIGURATION ---\n${frontendStackHint(config)}\n\n--- STRICT STACK RULES ---\n${strictStackRules(config)}\n\n--- DEPENDENCY POLICY ---\n${userLibraryDependencyRules(extraLibraries)}`;
}

export function buildProjectAuditSystemPrompt(config: GenerationConfig, extraLibraries?: ExtraLibraryEntry[]): string {
  const isMobile = config.category === "React Native Application" || config.category === "Flutter Application" || config.framework === "React Native" || config.framework === "Expo" || config.framework === "Flutter";
  const systemRules = isMobile ? MOBILE_SYSTEM_RULES : FRONTEND_SYSTEM_RULES;
  return `
${systemRules}

--- AUDIT MODE ---
You are performing a deep project audit. Your job is to:
1. Read ALL provided files carefully before drawing conclusions.
2. Identify bugs, runtime errors, compile errors, logic issues, security holes, and accessibility gaps.
3. Prioritise findings by severity: CRITICAL > HIGH > MEDIUM > LOW.
4. For each finding: state the file, line (if determinable), root cause, and exact fix.
5. After the report, emit ONLY the corrected files — do not rewrite files that have no issues.
6. Never invent files that are not present unless a missing file is essential for the fix.

--- STACK CONFIGURATION ---
${frontendStackHint(config)}

--- STRICT STACK RULES ---
${strictStackRules(config)}

--- DEPENDENCY POLICY ---
${userLibraryDependencyRules(extraLibraries)}
`.trim();
}

export function buildFeatureEnhancementSystemPrompt(config: GenerationConfig, extraLibraries?: ExtraLibraryEntry[]): string {
  const isMobile = config.category === "React Native Application" || config.category === "Flutter Application" || config.framework === "React Native" || config.framework === "Expo" || config.framework === "Flutter";
  const systemRules = isMobile ? MOBILE_SYSTEM_RULES : FEATURE_ENHANCEMENT_SYSTEM_RULES;
  return `${systemRules}\n\n--- STACK CONFIGURATION ---\n${frontendStackHint(config)}\n\n--- STRICT STACK RULES ---\n${strictStackRules(config)}\n\n--- DEPENDENCY POLICY ---\n${userLibraryDependencyRules(extraLibraries)}`;
}

export function buildFrontendUserMessage(
  prompt: string,
  imageBase64: string | undefined,
  config: GenerationConfig,
  projectFiles: FileEntry[] = []
): string {
  if (config.category === "Project Audit" && projectFiles.length > 0) {
    return buildProjectAuditUserMessage(prompt, projectFiles, config);
  }

  const isMobile = config.category === "React Native Application" || config.category === "Flutter Application" || config.framework === "React Native" || config.framework === "Expo" || config.framework === "Flutter";
  const experienceLabel = isMobile ? "GENERATE MOBILE APPLICATION:" : "GENERATE FRONTEND EXPERIENCE:";

  const imageHint = imageBase64
    ? [
        "A reference screenshot is attached.",
        "Recreate the visible UI with high fidelity — match layout, spacing, typography, and colour palette.",
        "Polish and improve rough edges while preserving the overall intent.",
      ].join(" ")
    : "No screenshot attached. Generate purely from the textual description.";

  const isFullProject =
    config.projectType === "Full Stack" ||
    config.projectType === "Full Project" ||
    config.category === "Full Stack";

  return [
    experienceLabel,
    imageHint,
    "",
    "=== USER REQUEST ===",
    prompt?.trim() || "(no description provided — generate a sensible, complete, impressive example)",
    "",
    "=== IMPLEMENTATION CONSTRAINTS ===",
    frontendStackHint(config),
    "",
    isFullProject ? [
      "=== FULL PROJECT REQUIREMENTS ===",
      "Generate a complete, runnable project with:",
      "- All source files (components, pages, layouts, hooks, types, utils)",
      "- package.json with all required dependencies pinned to stable versions",
      "- tsconfig.json with strict settings",
      "- README.md with setup instructions",
      "- .env.example with all required environment variables",
      "- No placeholder files — every file must be fully implemented",
      "",
    ].join("\n") : "",
    "=== MANDATORY PRE-OUTPUT CHECKLIST ===",
    "Before emitting your answer, silently confirm:",
    "1. Output format matches project type (single-file vs multi-file with correct markers).",
    "2. All imports are correct and resolvable.",
    "3. No JSX/HTML syntax errors — all tags opened and closed.",
    "4. Responsive behaviour is implemented at mobile and desktop breakpoints.",
    "5. Accessibility attributes are present on all interactive and image elements.",
    "6. Output is complete — nothing is truncated, stubbed, or left as a placeholder.",
    "",
    "Output the final code now.",
  ].filter(Boolean).join("\n");
}

export function buildProjectAuditUserMessage(
  prompt: string,
  projectFiles: FileEntry[],
  config: GenerationConfig
): string {
  const visible = projectFiles.slice(0, 60);
  const manifest = visible.length
    ? projectManifest(visible)
    : "(no files were extracted from the upload)";

  return [
    "The user uploaded a project for a thorough audit and bug-fix pass.",
    "",
    "=== USER REQUEST ===",
    prompt?.trim() || "Trace all bugs, explain their root causes, and produce corrected code for every affected file.",
    "",
    `Total files extracted: ${projectFiles.length} | Files in context: ${visible.length}`,
    "",
    "=== STACK CONFIGURATION ===",
    frontendStackHint(config),
    "",
    "=== PROJECT FILES ===",
    manifest,
    "",
    "=== REQUIRED RESPONSE FORMAT ===",
    "<<<REPORT>>>",
    "Write a structured bug report with these severity sections:",
    "  CRITICAL: Crashes, data loss, broken builds",
    "  HIGH:     Broken core features, missing route handlers, invalid types",
    "  MEDIUM:   Logic errors, performance issues, accessibility gaps",
    "  LOW:      Code style, minor improvements, dead code",
    "Format each finding as: [File] [Line if known] — Root cause → Fix",
    "<<<CODE>>>",
    "Emit only the corrected files using the required // ===FILE: path=== markers.",
    "If no files need changes, write a short note inside the code section.",
  ].join("\n");
}

export function buildFeatureEnhancementUserMessage(
  prompt: string,
  projectFiles: FileEntry[],
  config: GenerationConfig
): string {
  const visible = projectFiles.slice(0, 60);
  const manifest = visible.length
    ? projectManifest(visible)
    : "(no project files were provided)";

  return [
    "The user has provided an existing codebase and wants features added or improved.",
    "Study the code carefully before making any changes. Match existing patterns and style.",
    "",
    "=== FEATURE REQUEST ===",
    prompt?.trim() || "Review the codebase and suggest + implement the most impactful improvements.",
    "",
    `Total files extracted: ${projectFiles.length} | Files in context: ${visible.length}`,
    "",
    "=== STACK CONFIGURATION ===",
    frontendStackHint(config),
    "",
    "=== EXISTING CODEBASE ===",
    manifest,
    "",
    "=== INSTRUCTIONS ===",
    "1. Implement the requested feature(s) by modifying only the files that need to change.",
    "2. Return ONLY the modified and newly created files — not unchanged files.",
    "3. Preserve all existing functionality and code style.",
    "4. Ensure all new code integrates cleanly with the existing architecture.",
    "5. If a new package is needed, update package.json too.",
    "",
    "=== MANDATORY PRE-OUTPUT CHECKLIST ===",
    "1. Did I understand the existing architecture before making changes?",
    "2. Are all changed files syntactically valid and import-complete?",
    "3. Did I preserve all existing features?",
    "4. Is my implementation complete — no half-done sections?",
    "",
    "Output only the changed/new files now.",
  ].join("\n");
}

export function buildMixedUploadUserMessage(
  prompt: string,
  projectFiles: FileEntry[],
  imageBase64: string,
  config: GenerationConfig
): string {
  const visible = projectFiles.slice(0, 60);
  const manifest = visible.length
    ? projectManifest(visible)
    : "(no project files were provided)";

  void imageBase64; // base64 is passed separately to the API as a vision message

  return [
    "The user has uploaded BOTH a screenshot reference AND an existing codebase.",
    "Your job is to implement what is shown in the screenshot into the existing codebase.",
    "",
    "=== USER REQUEST ===",
    prompt?.trim() || "Implement the design shown in the screenshot into the existing codebase. Match the layout, components, and visual style precisely.",
    "",
    `Total files extracted: ${projectFiles.length} | Files in context: ${visible.length}`,
    "",
    "=== STACK CONFIGURATION ===",
    frontendStackHint(config),
    "",
    "=== EXISTING CODEBASE ===",
    manifest,
    "",
    "=== INSTRUCTIONS ===",
    "1. Study the screenshot carefully — identify all UI elements, layout, colors, typography.",
    "2. Study the existing codebase — understand the architecture, patterns, and style.",
    "3. Implement the design from the screenshot into the existing codebase.",
    "4. Match the existing code style exactly.",
    "5. Return only the files that need to be created or modified.",
    "6. Ensure all changes integrate cleanly with the existing architecture.",
    "",
    "=== MANDATORY PRE-OUTPUT CHECKLIST ===",
    "1. Does the implementation faithfully represent what is shown in the screenshot?",
    "2. Does it integrate cleanly with the existing codebase?",
    "3. Are all imports correct?",
    "4. Is the implementation complete?",
    "",
    "Output only the changed/new files now.",
  ].join("\n");
}

export function buildRefinementSystemPrompt(config: GenerationConfig): string {
  return `
${FRONTEND_SYSTEM_RULES}

--- REFINEMENT MODE ---
You are making a targeted, surgical change to existing code.
Rules:
- Apply ONLY what the user asks for. Do not refactor unrelated sections.
- Preserve all existing functionality, structure, and style choices.
- Do not add features that were not requested.
- Do not remove working code unless explicitly asked.
- The output must be the COMPLETE updated file(s) — not a diff or a snippet.

--- STACK CONFIGURATION ---
${frontendStackHint(config)}
`.trim();
}

export function buildRefinementUserPrompt(
  refinePrompt: string,
  currentCode: string,
  config: GenerationConfig
): string {
  return [
    "Apply the following refinement to the code below.",
    "Make the smallest safe change that fully satisfies the request.",
    "Return the COMPLETE updated code — not a snippet or a diff.",
    "",
    "=== REFINEMENT REQUEST ===",
    refinePrompt.trim(),
    "",
    "=== CURRENT CODE ===",
    currentCode,
    "",
    "=== STACK CONFIGURATION ===",
    frontendStackHint(config),
    "",
    "Output the complete revised code now.",
  ].join("\n");
}

export function buildBackendSystemPrompt(config: BackendGenRequest): string {
  return `${BACKEND_SYSTEM_RULES}\n\n--- STACK CONFIGURATION ---\n${backendStackHint({
    backendFramework: config.backendFramework,
    database: config.database,
    language: config.language,
    includeAuth: config.includeAuth,
    includeTests: config.includeTests,
    endpoints: config.endpoints ?? [],
  })}\n\n--- DEPENDENCY POLICY ---\n${userLibraryDependencyRules(config.extraLibraries)}`;
}

export function buildBackendUserMessage(config: BackendGenRequest): string {
  return [
    "Build a complete, production-ready backend from this requirement.",
    "",
    "=== DESCRIPTION ===",
    config.description.trim(),
    "",
    "=== STACK CONFIGURATION ===",
    backendStackHint({
      backendFramework: config.backendFramework,
      database: config.database,
      language: config.language,
      includeAuth: config.includeAuth,
      includeTests: config.includeTests,
      endpoints: config.endpoints ?? [],
    }),
    "",
    "=== FULL PROJECT REQUIREMENTS ===",
    "Always include:",
    "- package.json with all production and dev dependencies",
    "- tsconfig.json (if TypeScript)",
    "- .env.example with all required environment variables",
    "- README.md with setup and run instructions",
    "- Proper directory structure: src/routes/, src/middleware/, src/models/, src/services/, src/utils/",
    "",
    "=== MANDATORY PRE-OUTPUT CHECKLIST ===",
    "1. All routes have complete handler implementations.",
    "2. Validation, error handling, and security middleware are included.",
    "3. Environment variable names are consistent across all files.",
    "4. Auth and tests included ONLY if requested.",
    "5. The project is complete — no stubs, no truncated files, no placeholder routes.",
    "",
    "Output production-ready code now.",
  ].join("\n");
}

export function buildQualityAnalysisPrompt(code: string, config: GenerationConfig): string {
  return [
    "Assess the generated code for correctness, accessibility, responsiveness, structure, and production readiness.",
    "Return a concise internal-style assessment only.",
    `Framework: ${config.framework}`,
    `Language: ${config.language}`,
    `Project type: ${config.projectType}`,
    `Category: ${config.category ?? "Frontend"}`,
    "Code:",
    code,
  ].join("\n");
}
