import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "cyan" | "amber" }) {
  const toneClass =
    tone === "cyan"
      ? "text-cyan-300 border-cyan-400/30 bg-cyan-500/10"
      : tone === "amber"
        ? "text-amber-300 border-amber-400/30 bg-amber-500/10"
        : "text-slate-300 border-slate-700 bg-slate-800";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${toneClass}`}>
      {children}
    </span>
  );
}
