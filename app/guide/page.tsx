import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "User guide | UI→Code Pro",
  description: "How to use the AI builder, SEO tools, GitHub, deployment, and prompts effectively.",
};

const sections = [
  { id: "prompts", title: "Writing effective prompts" },
  { id: "seo", title: "SEO & PageSpeed" },
  { id: "github", title: "GitHub integration" },
  { id: "deploy", title: "Deployment" },
  { id: "frontend", title: "Frontend in this tool" },
  { id: "backend", title: "Backend in this tool" },
  { id: "guest", title: "Guest vs signed-in" },
] as const;

export default function GuidePage() {
  return (
    <div
      data-app-scroll-root
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
      style={{ background: "var(--bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-40 app-backdrop" aria-hidden />

      <header
        className="sticky top-0 z-30 glass glass-strong border-b px-4 py-3 md:px-8"
        style={{ borderColor: "var(--border2)" }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-[12px] font-semibold hover:underline"
            style={{ color: "var(--blue)" }}
          >
            <ArrowLeft size={14} aria-hidden />
            Back to home
          </Link>
          <div className="flex items-center gap-2 sm:justify-end">
            <div className="rounded-lg p-2" style={{ background: "var(--blue-dim)" }}>
              <BookOpen size={18} style={{ color: "var(--blue)" }} aria-hidden />
            </div>
            <div>
              <p className="font-heading text-[13px] font-bold leading-tight" style={{ color: "var(--text)" }}>
                User guide
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--text3)" }}>
                Documentation
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-[1] mx-auto w-full max-w-3xl px-4 py-8 pb-12 md:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold" style={{ color: "var(--text)" }}>
            User guide
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text2)" }}>
            How to get the best results from UI→Code Pro
          </p>
        </div>

        <nav
          className="mb-10 rounded-2xl border p-4"
          style={{ borderColor: "var(--border2)", background: "var(--panel)" }}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
            On this page
          </p>
          <ul className="space-y-1.5 text-[13px]">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:underline" style={{ color: "var(--blue)" }}>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose-guide space-y-12 text-[14px] leading-relaxed" style={{ color: "var(--text2)" }}>
          <section id="prompts">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              Writing effective prompts
            </h2>
            <p className="mb-3">
              This tool runs a structured pipeline: it analyzes your request, plans the stack, then generates code. Help it by being explicit and ordered.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <strong style={{ color: "var(--text)" }}>State the product and audience</strong> — e.g. “Admin dashboard for photographers.”
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>List must-have UI pieces</strong> — navigation, tables, forms, charts, not just “a nice page.”
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Specify interactions</strong> — hover, mobile menu, modals, loading states.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Match the sidebar category</strong> — Website vs React Native vs Flutter changes frameworks and output shape; pick the right path first.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Use the config tab</strong> — framework, styling, project type, and accessibility level are injected into the system prompt; they beat vague text.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Optional libraries</strong> — before generating, add only npm packages you want (name + purpose). If you leave this empty, the model avoids extra dependencies beyond your stack.
              </li>
            </ol>
          </section>

          <section id="seo">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              SEO &amp; analytics (PageSpeed)
            </h2>
            <p className="mb-3">
              The <strong style={{ color: "var(--text)" }}>SEO</strong> tab analyzes your live or deployed URL with Lighthouse-style metrics (performance, accessibility, best practices, SEO). You need to be <strong>signed in</strong> to use it.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Deploy or run your generated site so it has a public <code className="rounded px-1 text-[12px]" style={{ background: "var(--code-bg)" }}>https://</code> URL (or use the URL the tool can reach).</li>
              <li>
                Open <strong style={{ color: "var(--text)" }}>SEO &amp; Analytics</strong> in the sidebar.
              </li>
              <li>Paste the page URL and run the analysis.</li>
              <li>Read the scores and recommendations; fix issues in the editor or with a refinement prompt.</li>
            </ol>
            <p className="mt-3 text-[13px]">
              The server must have <code className="rounded px-1 text-[12px]" style={{ background: "var(--code-bg)" }}>GOOGLE_PAGESPEED_API_KEY</code> set for full API access — see the{" "}
              <code className="rounded px-1 text-[12px]" style={{ background: "var(--code-bg)" }}>docs/ENVIRONMENT_AND_INTEGRATION.md</code> file in your project copy.
            </p>
          </section>

          <section id="github">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              GitHub integration
            </h2>
            <p className="mb-3">You must be <strong style={{ color: "var(--text)" }}>signed in</strong>. Guests cannot use GitHub sync.</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Link GitHub via <strong style={{ color: "var(--text)" }}>Continue with GitHub</strong> at login, or connect GitHub from your <strong style={{ color: "var(--text)" }}>Account</strong> page.
              </li>
              <li>
                Click <strong style={{ color: "var(--text)" }}>GitHub</strong> in the top bar to open the sync modal.
              </li>
              <li>
                Use the <strong style={{ color: "var(--text)" }}>Connect</strong> / token flow in the modal to authorize push access (follow the on-screen steps and paste a token if required).
              </li>
              <li>
                In the <strong style={{ color: "var(--text)" }}>Push</strong> tab, choose an existing repository or create one, then push your generated files.
              </li>
              <li>Resolve any errors shown in the modal; the app surfaces them as toasts.</li>
            </ol>
          </section>

          <section id="deploy">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              Deployment (Vercel / Netlify)
            </h2>
            <p className="mb-3">
              <strong style={{ color: "var(--text)" }}>Signed-in</strong> users can use the <strong style={{ color: "var(--text)" }}>Deploy</strong> button (same modal as GitHub). Guests cannot deploy from the tool.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Generate your project and download the ZIP (requires sign-in).</li>
              <li>Push to GitHub from the modal, or upload the repo manually.</li>
              <li>
                Open the <strong style={{ color: "var(--text)" }}>Deploy</strong> tab and connect Vercel or Netlify as guided.
              </li>
              <li>
                Set environment variables on the host (see <code className="text-[12px]">NEXTAUTH_URL</code>, API keys, database URLs).
              </li>
              <li>Trigger a deploy and verify the production URL.</li>
            </ol>
          </section>

          <section id="frontend">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              Frontend development guide (inside this tool)
            </h2>
            <p className="mb-3">
              Use <strong style={{ color: "var(--text)" }}>Website development → Frontend</strong> or <strong style={{ color: "var(--text)" }}>Application development</strong> for mobile stacks. Pick category, then set framework, styling, and project type in the <strong style={{ color: "var(--text)" }}>Config</strong> tab.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong style={{ color: "var(--text)" }}>Full page vs component</strong> — “Full page” yields a whole screen; “Component” yields a focused module.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Preview</strong> — check the Preview tab for HTML/React output.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Refine</strong> — small follow-up edits without regenerating everything.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Pipeline</strong> — watch analysis and planning phases when you need transparency.
              </li>
            </ul>
          </section>

          <section id="backend">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              Backend development guide (inside this tool)
            </h2>
            <p className="mb-3">
              Open <strong style={{ color: "var(--text)" }}>Backend</strong> from the sidebar (under Website or Application). Describe your API: resources, auth, database, and endpoints.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Choose framework (Express, Fastify, NestJS, Hono) and database in the workspace.</li>
              <li>List endpoints you care about; the generator will scaffold routes, validation, and structure.</li>
              <li>Optional libraries: add rows under “Optional npm libraries” on the main input tab before generating; they apply to frontend and backend requests.</li>
              <li>Output appears in the backend panel; use the Code tab for multi-file review.</li>
            </ul>
          </section>

          <section id="guest">
            <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--text)" }}>
              Guest vs signed-in
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong style={{ color: "var(--text)" }}>Guests</strong> can generate and preview code but cannot use GitHub, Deploy, SEO tools, ZIP downloads, or saved history.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Signed-in</strong> users get history, downloads, SEO, and integrations.
              </li>
            </ul>
          </section>
        </article>

        <p className="mt-12 text-[12px]" style={{ color: "var(--text3)" }}>
          Full key reference: repository file{" "}
          <code className="text-[11px]" style={{ color: "var(--text2)" }}>
            docs/ENVIRONMENT_AND_INTEGRATION.md
          </code>
        </p>

        <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--border2)" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-semibold hover:underline"
            style={{ color: "var(--blue)" }}
          >
            <ArrowLeft size={14} aria-hidden />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
