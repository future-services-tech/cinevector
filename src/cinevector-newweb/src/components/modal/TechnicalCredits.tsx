import type { MovieCredits } from "../../types/movie";

export function TechnicalCredits({ credits }: { credits: MovieCredits }) {
  const rows: { label: string; value?: string; award?: string }[] = [
    { label: "Regia", value: credits.director },
    { label: "Direttore Fotografia", value: credits.cinematography, award: credits.cinematographyAward },
    { label: "Colonna Sonora", value: credits.music },
    { label: "Sceneggiatura", value: credits.screenplay },
  ];
  const visibleRows = rows.filter((r): r is { label: string; value: string; award?: string } => Boolean(r.value));

  if (visibleRows.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-800/80 pt-4">
      {visibleRows.map((row) => (
        <div key={row.label} className="min-w-[160px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{row.label}</div>
          <div className="text-xs text-slate-200">
            {row.value}
            {row.award && <span className="ml-1.5 text-[10px] text-amber-300">({row.award})</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
