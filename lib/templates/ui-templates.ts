import type { Framework } from "@/types";

export type UITemplateCategory =
  | "Landing Page"
  | "Admin Dashboard"
  | "Analytics Dashboard"
  | "E-commerce Store"
  | "Portfolio"
  | "AI Tool Landing"
  | "Authentication"
  | "Blog"
  | "SaaS / Subscription"
  | "Weather App"
  | "Chat UI"
  | "Todo App"
  | "Notes App"
  | "Marketing Site";

export interface UITemplate {
  id: string;
  slug: string;
  name: string;
  category: UITemplateCategory;
  description: string;
  tags: string[];
  /** Preview card background */
  gradient: string;
  /** Injected as the core generation prompt */
  promptSnippet: string;
  frameworkHint: Framework;
}

const CATEGORIES: UITemplateCategory[] = [
  "Landing Page",
  "Admin Dashboard",
  "Analytics Dashboard",
  "E-commerce Store",
  "Portfolio",
  "AI Tool Landing",
  "Authentication",
  "Blog",
  "SaaS / Subscription",
  "Weather App",
  "Chat UI",
  "Todo App",
  "Notes App",
  "Marketing Site",
];

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
  "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  "linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f78ca0 0%, #f9748f 19%, #fd868c 60%, #fe9a8b 100%)",
  "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
  "linear-gradient(135deg, #37ecba 0%, #72afd3 100%)",
  "linear-gradient(135deg, #ebbba7 0%, #cfc7f8 100%)",
  "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)",
  "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
  "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #2af598 0%, #009efd 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

const CATEGORY_PROMPTS: Record<UITemplateCategory, string> = {
  "Landing Page":
    "Premium SaaS Landing Page: High-converting hero section with 3D illustration placeholder, glassmorphism navigation, interactive feature grid using hover effects, customer social proof (logos), tiered pricing table with 'Popular' tag, multi-column footer with newsletter signup. Fully responsive, WCAG AA compliant, modern typography.",
  "Admin Dashboard":
    "Professional CRM Admin Dashboard: Sidebar navigation with collapsible menus, global search bar, KPI cards (Leads, Revenue, Conversion) with sparkline charts, recent activities table with status badges, customer demographics chart (Pie/Bar), dark/light mode ready structure, dense and efficient layout.",
  "Analytics Dashboard":
    "Real-time Data Analytics Hub: Main area chart for traffic trends, comparison tiles for WoW/MoM growth, geo-distribution map placeholder, source breakdown table, date-range picker, export to CSV functionality, skeleton loading states for data components.",
  "E-commerce Store":
    "Modern Fashion Storefront: Mega-menu navigation, promotional banner carousel, product grid with hover-to-zoom images, price/rating display, wishlist/cart quick actions, newsletter footer, product filter sidebar (Size, Color, Price Range), mobile-optimized shopping experience.",
  "Portfolio":
    "Creative Developer Portfolio: Minimalist dark theme, hero section with typed-text effect, project showcase with masonry layout, tech stack icons (React, Node, etc.), experience timeline, contact form with validation, clean code-like aesthetics, smooth scroll navigation.",
  "AI Tool Landing":
    "AI Platform Landing Page: Prompt input field hero (simulated), model selection grid, capabilities list with animated icons, API documentation preview snippet, enterprise security trust section, credit-based pricing model, futuristic 'glow' UI elements.",
  "Authentication":
    "Secure Auth Center: Split-screen layout (Brand side + Form side), Login/Signup tab switcher, Social OAuth buttons (Google, GitHub), password strength meter, 'Forgot Password' flow, multi-factor authentication (MFA) placeholder screen, accessible form labels.",
  Blog:
    "Clean Editorial Blog: Featured post hero with large image, category filter chips, search bar, paginated article list with reading time estimates, sidebar with 'Popular Posts' and 'Newsletter', mobile-friendly typography, SEO-ready structure.",
  "SaaS / Subscription":
    "Subscription Management Dashboard: Active plan summary, billing history table with PDF download buttons, payment method management (Credit Card/PayPal), team member invitations, usage analytics (Seats/API calls), upgrade/downgrade modals.",
  "Weather App":
    "Dynamic Weather Interface: Current temperature with weather-specific background gradients, hourly forecast carousel, 7-day extended forecast list, wind/humidity/UV index cards, location search with history, responsive card-based layout.",
  "Chat UI":
    "Modern Team Chat Workspace: Channel/DM sidebar with online indicators, message thread with sender avatars and timestamps, reaction emojis, file attachment previews, typing indicators, mobile-responsive side-drawer navigation, clean and focused UI.",
  "Todo App":
    "Productivity Task Manager: Multi-list support (Work, Personal, Urgent), drag-and-drop ready list structure, priority level tagging, due-date picker, task search/filter, completion percentage bar, celebratory micro-interactions for finished tasks.",
  "Notes App":
    "Clean Writing Workspace: Folder-based note organization, markdown-style editor with preview toggle, pinned notes, tag management, full-text search, dark/light theme options, focus-mode toggle, minimalist distraction-free design.",
  "Marketing Site":
    "Digital Agency Marketing Site: Services overview grid, client case studies with big imagery, 'Our Process' steps with icons, team section with hover profiles, contact CTA with map placeholder, global footer with social links and certifications.",
};

const ADJ = [
  "Aurora",
  "Nebula",
  "Velvet",
  "Quantum",
  "Lumen",
  "Vertex",
  "Prism",
  "Echo",
  "Nova",
  "Zenith",
  "Atlas",
  "Pulse",
  "Cipher",
  "Flux",
  "Helix",
  "Orbit",
  "Summit",
  "Vantage",
  "Nimbus",
  "Radiant",
];
const NOUN = [
  "Commerce",
  "Studio",
  "Cloud",
  "Labs",
  "Forge",
  "Works",
  "Hub",
  "Layer",
  "Grid",
  "Stack",
  "Flow",
  "Signal",
  "Beacon",
  "Harbor",
  "Ridge",
  "Circuit",
  "Canvas",
  "Sphere",
  "Vector",
  "Matrix",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const UI_TEMPLATES: UITemplate[] = Array.from({ length: 100 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length]!;
  const adj = ADJ[i % ADJ.length]!;
  const noun = NOUN[(i + Math.floor(i / ADJ.length)) % NOUN.length]!;
  const name = `${adj} ${noun}`;
  const id = `uict-${String(i + 1).padStart(3, "0")}`;
  const fw: Framework =
    category.includes("Dashboard") || category === "SaaS / Subscription"
      ? "Next.js"
      : category === "Portfolio" || category === "Marketing Site"
        ? "Astro"
        : "Next.js";
  return {
    id,
    slug: `${slugify(name)}-${i + 1}`,
    name: `${name} — ${category}`,
    category,
    description: `Production-grade ${category.toLowerCase()} UI with layered styling, motion, and responsive breakpoints.`,
    tags: [category.split(/[\s/]/)[0] ?? "UI", "responsive", "animated", "accessible"],
    gradient: GRADIENTS[i % GRADIENTS.length]!,
    promptSnippet: CATEGORY_PROMPTS[category],
    frameworkHint: fw,
  };
});

const byId = new Map(UI_TEMPLATES.map((t) => [t.id, t]));

export function getTemplateById(id: string): UITemplate | undefined {
  return byId.get(id);
}

export function getTemplatesByCategory(category: UITemplateCategory): UITemplate[] {
  return UI_TEMPLATES.filter((t) => t.category === category);
}
