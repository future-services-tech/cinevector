import type { CreditPerson, MovieCredits } from "../../types/movie";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CreditAvatar({ person }: { person: CreditPerson }) {
  const avatar = person.profileUrl ? (
    <img src={person.profileUrl} alt={person.name} className="h-7 w-7 rounded-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[10px] font-bold text-white">
      {initialsOf(person.name)}
    </div>
  );

  if (!person.wikipediaUrl) {
    return avatar;
  }

  return (
    <a
      href={person.wikipediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Apri la pagina Wikipedia di ${person.name}`}
      className="inline-block transition-opacity hover:opacity-80"
    >
      {avatar}
    </a>
  );
}

export function TechnicalCredits({ credits }: { credits: MovieCredits }) {
  const rows: { label: string; value?: CreditPerson; award?: string }[] = [
    { label: "Regia", value: credits.director },
    { label: "Direttore Fotografia", value: credits.cinematography, award: credits.cinematographyAward },
    { label: "Colonna Sonora", value: credits.music },
    { label: "Sceneggiatura", value: credits.screenplay },
  ];
  const visibleRows = rows.filter((r): r is { label: string; value: CreditPerson; award?: string } => Boolean(r.value));

  if (visibleRows.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-800/80 pt-4">
      {visibleRows.map((row) => (
        <div key={row.label} className="flex min-w-[160px] items-center gap-2.5">
          <CreditAvatar person={row.value} />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{row.label}</div>
            <div className="text-xs text-slate-200">
              {row.value.wikipediaUrl ? (
                <a href={row.value.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 hover:underline">
                  {row.value.name}
                </a>
              ) : (
                row.value.name
              )}
              {row.award && <span className="ml-1.5 text-[10px] text-amber-300">({row.award})</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
