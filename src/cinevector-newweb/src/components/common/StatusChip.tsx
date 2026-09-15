import type { ReactNode } from "react";

const TONE_CLASS: Record<string, string> = {
  emerald: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
  purple: "text-purple-300 border-purple-400/30 bg-purple-500/10",
  rose: "text-rose-300 border-rose-400/30 bg-rose-500/10",
  amber: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  slate: "text-slate-300 border-slate-700 bg-slate-800",
};

const DOT_CLASS: Record<string, string> = {
  emerald: "bg-emerald-400",
  purple: "bg-purple-400",
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  slate: "bg-slate-500",
};

/** Mappa gli stati dei crawl job (Running/Paused/Failed/Cancelled/Pending/Completed) sugli stessi token
 * colore neon del design system — riusabile per qualunque badge di stato futuro. */
export function crawlStatusTone(status: string): keyof typeof TONE_CLASS {
  switch (status) {
    case "Running":
      return "emerald";
    case "Paused":
      return "purple";
    case "Failed":
      return "rose";
    case "Cancelled":
      return "amber";
    default:
      return "slate";
  }
}

export function StatusChip({ tone, children }: { tone: keyof typeof TONE_CLASS; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${TONE_CLASS[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[tone]}`} />
      {children}
    </span>
  );
}
