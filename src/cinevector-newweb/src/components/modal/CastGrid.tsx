import type { CastMember } from "../../types/movie";

const ROLE_LABEL: Record<CastMember["roleType"], string> = {
  principale: "Ruolo Principale",
  supporto: "Ruolo di Supporto",
  olografica: "Intelligenza Olografica",
};

export function CastGrid({ cast }: { cast: CastMember[] }) {
  return (
    <div data-purpose="cast-and-crew-section">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Cast Principale</div>
      {cast.length === 0 ? (
        <p className="text-xs text-slate-500">Cast non disponibile per questo film.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cast.map((member) => {
            const avatar = member.profileUrl ? (
              <img src={member.profileUrl} alt={member.name} className="mb-2 h-10 w-10 rounded-full object-cover" loading="lazy" />
            ) : (
              <div
                className="mb-2 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-ink"
                style={{ background: `linear-gradient(135deg, ${member.gradientFrom}, ${member.gradientTo})` }}
              >
                {member.initials}
              </div>
            );

            return (
              <div key={member.name} className="glass-card rounded-xl p-3">
                {member.wikipediaUrl ? (
                  <a
                    href={member.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Apri la pagina Wikipedia di ${member.name}`}
                    className="inline-block transition-opacity hover:opacity-80"
                  >
                    {avatar}
                  </a>
                ) : (
                  avatar
                )}
                <p className="truncate text-xs font-semibold text-ink">
                  {member.wikipediaUrl ? (
                    <a href={member.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 hover:underline">
                      {member.name}
                    </a>
                  ) : (
                    member.name
                  )}
                </p>
                <p className="truncate text-[11px] text-slate-400">{member.role}</p>
                <span className="mt-1 inline-block rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                  {ROLE_LABEL[member.roleType]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
