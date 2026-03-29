import type { BackendFramework, GenerationCategory, Language, ProjectType, StylingOption, Framework, GenerationConfig } from "@/types";

export const GENERATION_CATEGORIES: Array<{ id: GenerationCategory; title: string; description: string; badge: string }> = [
  { id: "Website Development", title: "Website Development", description: "Landing pages, marketing sites, dashboards, and business websites.", badge: "Web" },
  { id: "React Native Application", title: "React Native App", description: "Mobile apps with native-first layouts and app store ready structure.", badge: "Mobile" },
  { id: "Flutter Application", title: "Flutter App", description: "Cross-platform UI with Material / Cupertino widgets and Dart.", badge: "Flutter" },
  { id: "Frontend", title: "Frontend", description: "Component systems, UI-heavy apps, admin panels, and rich interfaces.", badge: "UI" },
  { id: "Backend", title: "Backend", description: "APIs, services, authentication, database, and production server structure.", badge: "API" },
  { id: "Full Stack", title: "Full Stack", description: "Frontend + backend delivered as a folder-based multi-file project.", badge: "Zip" },
  { id: "Prompt Enhancement", title: "Prompt Enhancement", description: "Build stronger, more detailed prompts before generation begins.", badge: "Prompt" },
  { id: "Project Audit", title: "Project Audit", description: "Upload a zip or folder to trace bugs, surface errors, and generate fixes.", badge: "Audit" },
];

export const POPULAR_LANGUAGES: Language[] = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C#",
  "PHP",
  "Go",
  "Rust",
  "Dart",
  "Kotlin",
];

export const WEBSITE_FRAMEWORKS: Framework[] = [
  "HTML+CSS",
  "React.js",
  "Next.js",
  "Vite + React",
  "Vite + React + Node.js",
  "Vue.js",
  "Nuxt.js",
  "Angular",
  "Svelte",
  "SvelteKit",
  "Astro",
  "Remix",
];
export const MOBILE_FRAMEWORKS: Framework[] = ["React Native", "Expo"];
export const FLUTTER_FRAMEWORKS: Framework[] = ["Flutter"];

export const WEB_STYLING: StylingOption[] = ["Tailwind CSS", "Custom CSS", "Bootstrap", "Shadcn/ui", "Three.js"];
export const MOBILE_STYLING: StylingOption[] = ["NativeWind", "React Native Paper", "Custom CSS"];
export const FLUTTER_STYLING: StylingOption[] = ["Custom CSS"];

export const BACKEND_FRAMEWORKS: BackendFramework[] = ["Express.js", "Fastify", "NestJS", "Hono"];

export const PROMPT_ENHANCEMENT_PRESETS = [
  "Make it production-grade with reusable components, polished spacing, and strong hierarchy.",
  "Add accessibility, responsive behavior, loading states, and empty states.",
  "Upgrade the design with premium visual detail, modern shadows, and subtle motion.",
  "Break the UI into clean sections with clear component responsibilities and scalable structure.",
  "Ask the model to think like a senior engineer and silently self-check the output before answering.",
];

export function getFrameworksForCategory(category?: GenerationCategory): Framework[] {
  switch (category) {
    case "React Native Application":
      return MOBILE_FRAMEWORKS;
    case "Flutter Application":
      return FLUTTER_FRAMEWORKS;
    case "Backend":
      return ["Next.js", "React.js", "HTML+CSS"];
    case "Full Stack":
      return ["Next.js", "Vite + React + Node.js", "React.js", "HTML+CSS", "Vue.js", "SvelteKit"];
    case "Prompt Enhancement":
      return ["Next.js", "React.js", "HTML+CSS"];
    case "Project Audit":
      return ["Next.js", "React.js", "HTML+CSS", "Vue.js", "SvelteKit"];
    case "Website Development":
    case "Frontend":
    default:
      return WEBSITE_FRAMEWORKS;
  }
}

export function getStylingForCategory(category?: GenerationCategory): StylingOption[] {
  if (category === "React Native Application") return MOBILE_STYLING;
  if (category === "Flutter Application") return FLUTTER_STYLING;
  return WEB_STYLING;
}

export function getLanguageHintForCategory(category?: GenerationCategory): Language[] {
  switch (category) {
    case "React Native Application":
      return ["TypeScript", "JavaScript", "Dart"];
    case "Flutter Application":
      return ["Dart", "TypeScript"];
    case "Backend":
      return ["TypeScript", "JavaScript", "Python", "Go", "Java"];
    case "Full Stack":
      return POPULAR_LANGUAGES;
    case "Prompt Enhancement":
      return ["TypeScript", "JavaScript", "Python"];
    case "Project Audit":
      return ["TypeScript", "JavaScript", "Python", "Go", "PHP", "Java"];
    default:
      return ["TypeScript", "JavaScript", "Python", "PHP", "Go", "Java"];
  }
}

export function getProjectTypesForCategory(category?: GenerationCategory): ProjectType[] {
  switch (category) {
    case "React Native Application":
      return ["Mobile App", "Full Project"];
    case "Flutter Application":
      return ["Mobile App", "Full Project"];
    case "Backend":
      return ["Backend API", "Full Project"];
    case "Full Stack":
      return ["Full Stack", "Full Project"];
    case "Project Audit":
      return ["Full Project"];
    default:
      return ["Component", "Full Page", "Full Project"];
  }
}

/** Intentionally empty — users must choose stack options manually (no pre-selected defaults). */
export function getCategoryDefaults(_category?: GenerationCategory): Partial<GenerationConfig> {
  return {};
}

export function buildEnhancedPromptDraft(prompt: string, category?: GenerationCategory) {
  const base = prompt.trim();
  const categoryLine = category ? `Category: ${category}` : "Category: Frontend";

  const productionRules = [
    "Objective: create a premium, production-ready experience.",
    "Zero-Tolerance: No TODOs, no placeholders, no truncated files.",
    "Architecture: Use Clean Architecture principles, proper separation of concerns, and scalable folder structures.",
    "Performance: Optimize for speed, efficient rendering, and minimal bundle size.",
    "Security: Implement robust input validation, secure data handling, and standard protection measures.",
    "Accessibility: Ensure WCAG AA compliance with proper ARIA labels and semantic markup.",
  ];

  const auditRules = [
    "Objective: trace bugs, identify errors, explain root causes, and deliver corrected code or file-level fixes.",
    "Methodology: Deep code analysis, logic tracing, and cross-file dependency verification.",
  ];

  const rules = category === "Project Audit" ? auditRules : productionRules;

  return [
    `# PROMPT ENHANCEMENT — ${categoryLine}`,
    ...rules.map(r => `- ${r}`),
    "",
    "## CORE REQUEST",
    base ? base : "Describe the full UI, business logic, and desired behavior in detail.",
    "",
    "## DELIVERABLES",
    category === "Full Stack"
      ? "- Multi-file folder structure with frontend/ and backend/ directories."
      : "- Complete, production-ready code in the most suitable structure for the stack.",
    "- Fully implemented files (no placeholders).",
    "- Integration-ready components and services.",
    "",
    "## FINAL CHECK",
    "- Silently validate the design and code against engineering best practices before responding.",
  ].join("\n");
}
