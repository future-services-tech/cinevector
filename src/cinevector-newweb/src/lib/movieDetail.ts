import type { MovieDto } from "../api/types";
import { CAST_FIRST_NAMES, CAST_LAST_NAMES, TRACK_TITLE_FRAGMENTS } from "../data/lexicon";
import { hashStringToSeed, mulberry32, pick, randInt, type Rng } from "../data/seedRandom";
import type { CastMember, CreditPerson, MovieCredits, MovieDetail, MovieNode, RoleType, SoundtrackTrack } from "../types/movie";

const QUALITY_BADGE_POOL = ["4K UHD", "Dolby Atmos", "HDR10+", "Dolby Vision", "IMAX Enhanced"];

const CAST_GRADIENTS: [string, string][] = [
  ["#22d3ee", "#3b82f6"],
  ["#fbbf24", "#f97316"],
  ["#a855f7", "#6366f1"],
  ["#34d399", "#14b8a6"],
  ["#fb7185", "#ef4444"],
  ["#f472b6", "#a855f7"],
];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapCast(dto: MovieDto): CastMember[] {
  return dto.cast.map((member, i) => {
    const [gradientFrom, gradientTo] = CAST_GRADIENTS[i % CAST_GRADIENTS.length];
    const roleType: RoleType = member.billingOrder <= 1 ? "principale" : "supporto";
    return {
      name: member.name,
      role: member.character ?? "Ruolo non specificato",
      roleType,
      gradientFrom,
      gradientTo,
      initials: initialsOf(member.name),
      profileUrl: member.profileUrl ?? undefined,
    };
  });
}

function findCrew(dto: MovieDto, pattern: RegExp): CreditPerson | undefined {
  const match = dto.crew.find((c) => pattern.test(c.role));
  return match ? { name: match.name, profileUrl: match.profileUrl ?? undefined } : undefined;
}

function generateTracks(rng: Rng, composer: string): SoundtrackTrack[] {
  const count = randInt(rng, 5, 7);
  const tracks: SoundtrackTrack[] = [];
  for (let i = 0; i < count; i++) {
    const totalSec = randInt(rng, 95, 245);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    tracks.push({
      id: `t${i + 1}-${Math.round(rng() * 1e6)}`,
      num: i + 1,
      title: `${pick(rng, TRACK_TITLE_FRAGMENTS)} ${["I", "II", "III", "IV", "V", "VI", "VII"][i] ?? i + 1}`,
      artist: composer,
      duration: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      totalSec,
    });
  }
  return tracks;
}

/** Combina il film "leggero" già noto (posizione/colore/cluster sulla sfera) con il dettaglio reale
 * dal backend (GET /api/movies/{id}): sinossi/cast/crediti/poster sono reali, trailer/colonna sonora/
 * runtime restano sintetici (seed = id reale del film) perché il backend non li possiede. */
export function buildMovieDetail(node: MovieNode, dto: MovieDto): MovieDetail {
  const seed = hashStringToSeed(`${node.id}:detail`);
  const rng = mulberry32(seed);

  const composerCredit = findCrew(dto, /music|score|composer/i);
  const composer = composerCredit?.name ?? `${pick(rng, CAST_FIRST_NAMES)} ${pick(rng, CAST_LAST_NAMES)}`;
  const directorDto = dto.directors[0];
  const director = directorDto?.name ?? "Regista non specificato";

  const credits: MovieCredits = {
    director: { name: director, profileUrl: directorDto?.profileUrl ?? undefined },
    cinematography: findCrew(dto, /photography/i),
    music: composerCredit,
    screenplay: findCrew(dto, /screenplay|writer/i),
  };

  return {
    ...node,
    director,
    synopsis: dto.overview ?? "Sinossi non disponibile per questo film.",
    qualityBadges: [pick(rng, QUALITY_BADGE_POOL), pick(rng, QUALITY_BADGE_POOL)].filter((v, i, arr) => arr.indexOf(v) === i),
    runtimeMinutes: randInt(rng, 88, 168),
    poster: dto.posterUrl ?? dto.backdropUrl ?? `https://picsum.photos/seed/${node.id}/960/540`,
    album: {
      title: `${dto.title} — Original Score`,
      composer,
      format: [pick(rng, ["FLAC 24-bit / 96kHz", "Dolby Atmos Hi-Res", "Spatial Audio"])],
    },
    tracks: generateTracks(rng, composer),
    cast: mapCast(dto),
    credits,
  };
}

/** Nodo "leggero" di riserva per film raggiunti da ricerca/deep-link ma non presenti nel set caricato
 * dalla sfera (es. non ancora clusterizzati/senza embedding) — il modal deve comunque funzionare. */
export function buildFallbackNode(dto: MovieDto): MovieNode {
  return {
    id: String(dto.id),
    vectorId: `V-${String(dto.id).padStart(5, "0")}`,
    title: dto.title,
    year: dto.year ?? 0,
    rating: dto.rating ?? 0,
    clusterId: dto.clusterId ?? -1,
    clusterLabel: dto.clusterLabel ?? "Non clusterizzato",
    color: "#64748b",
    affinity: Math.round(40 + ((dto.rating ?? 5) / 10) * 55),
    tags: dto.genres,
    isKey: false,
    size: 1,
    position: [0, 1, 0],
  };
}
