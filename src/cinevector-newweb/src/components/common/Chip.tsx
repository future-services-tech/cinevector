import type { ReactNode } from "react";

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={`glass-pill inline-flex items-center rounded-full px-2.5 py-1 text-[11px] text-slate-300 transition ${
        onClick ? "cursor-pointer hover:border-cyan-400/40 hover:text-cyan-200" : ""
      } ${active ? "border-cyan-400/60 text-cyan-200" : ""}`}
    >
      {children}
    </Tag>
  );
}
