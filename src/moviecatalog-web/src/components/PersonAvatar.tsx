export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface PersonAvatarProps {
  name: string;
  profileUrl?: string | null;
  wikipediaUrl?: string | null;
  subtitle?: string | null;
}

/** Avatar di una persona (regista, attore, produttore...): foto reale se disponibile, altrimenti iniziali;
 * apre la pagina Wikipedia in una scheda se il link esiste. Usato ovunque compaia un credito nominale. */
export function PersonAvatar({ name, profileUrl, wikipediaUrl, subtitle }: PersonAvatarProps) {
  const content = (
    <>
      {profileUrl ? (
        <img className="cast-avatar cast-avatar--photo" src={profileUrl} alt={name} loading="lazy" />
      ) : (
        <div className="cast-avatar">{initials(name)}</div>
      )}
      <p style={{ fontSize: 12, marginTop: "0.4rem", fontWeight: 600 }}>{name}</p>
      {subtitle && <p className="muted" style={{ fontSize: 11 }}>{subtitle}</p>}
    </>
  );

  return wikipediaUrl ? (
    <a href={wikipediaUrl} target="_blank" rel="noreferrer" className="cast-member cast-member--link" style={{ textAlign: "center" }}>
      {content}
    </a>
  ) : (
    <div className="cast-member" style={{ textAlign: "center" }}>
      {content}
    </div>
  );
}
