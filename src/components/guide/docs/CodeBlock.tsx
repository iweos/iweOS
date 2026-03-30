"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { DocCodeBlock } from "./types";

type CodeBlockProps = {
  block: DocCodeBlock;
};

export default function CodeBlock({ block }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900/90 bg-[#0b1020] shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          <span className="ml-2">{block.language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-slate-100">
        <code>{block.code}</code>
      </pre>
      {block.caption ? <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">{block.caption}</div> : null}
    </div>
  );
}
