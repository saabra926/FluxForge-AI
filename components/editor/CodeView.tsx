"use client";
import { useAppStore } from "@/store/useAppStore";
import { getFileExtension, syntaxHighlight, countLines } from "@/lib/utils";

export function CodeView() {
  const { generatedCode, config } = useAppStore();

  if (!generatedCode) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: "var(--text3)", background: "var(--code-bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-20">{`{ }`}</div>
          <p className="text-[13px]">Generated code appears here</p>
        </div>
      </div>
    );
  }

  const ext = getFileExtension(config.framework);
  const highlighted = syntaxHighlight(generatedCode);
  const lines = countLines(generatedCode);
  const lineNums = Array.from({ length: lines }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--code-bg)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border2)", background: "var(--panel)" }}>
        {/* Traffic lights (decorative) */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "var(--blue)" }}>
          output.{ext}
        </span>
        <span className="ml-auto text-[11px] font-mono" style={{ color: "var(--text3)" }}>
          {lines} lines · {generatedCode.length.toLocaleString()} chars
        </span>
      </div>

      {/* Code area */}
      <div className="flex flex-1 overflow-auto">
        {/* Line numbers */}
        <div className="select-none py-4 pr-3 pl-4 text-right leading-[1.7] font-mono text-[12.5px] flex-shrink-0"
          style={{ color: "var(--text3)", borderRight: "1px solid var(--border)", minWidth: "48px", background: "var(--code-bg)" }}>
          {lineNums.map((n) => <div key={n}>{n}</div>)}
        </div>
        {/* Code */}
        <pre className="flex-1 py-4 px-5 leading-[1.7] font-mono text-[12.5px] overflow-x-auto m-0"
          style={{ color: "var(--text)", background: "var(--code-bg)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    </div>
  );
}
