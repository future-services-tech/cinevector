import type { CastMember, ClusterId, MovieCredits, SoundtrackTrack } from "../types/movie";

export interface HeroSeed {
  id: string;
  title: string;
  director: string;
  year: number;
  rating: number;
  clusterId: ClusterId;
  synopsis: string;
  tags: string[];
}

/** Film "hero": dati dashboard esatti dai due mockup HTML. Il dettaglio pesante (cast/tracce/crediti)
 * è procedurale per tutti tranne Blade Runner 2049, che ha il dettaglio completo cablato nel mockup
 * dettaglio_sfere3d/code.html (vedi BLADE_RUNNER_DETAIL sotto) — evita di attribuire cast/colonne sonore
 * "ufficiali" inventate a film reali per cui il mockup non specificava quei dati. */
export const HERO_SEEDS: HeroSeed[] = [
  {
    id: "blade-runner-2049",
    title: "Blade Runner 2049",
    director: "Denis Villeneuve",
    year: 2017,
    rating: 8.0,
    clusterId: "cyberpunk",
    synopsis:
      "In un futuro decadente, l'agente K della polizia di Los Angeles scopre un segreto sepolto da lungo tempo che potrebbe gettare la società nel caos totale. La sua indagine lo porta a rintracciare Rick Deckard, scomparso da oltre trent'anni.",
    tags: ["Intelligenza Artificiale", "Crisi d'Identità", "Fotografia Neo-Noir", "Distopia Urbana"],
  },
  {
    id: "the-matrix",
    title: "The Matrix",
    director: "Lana & Lilly Wachowski",
    year: 1999,
    rating: 8.7,
    clusterId: "cyberpunk",
    synopsis:
      "Un hacker scopre che la sua intera realtà è in verità una complessa simulazione digitale creata da macchine senzienti per schiavizzare la specie umana.",
    tags: ["Simulazione", "Cyberpunk", "Messia Tecnologico", "Arti Marziali"],
  },
  {
    id: "interstellar",
    title: "Interstellar",
    director: "Christopher Nolan",
    year: 2014,
    rating: 8.7,
    clusterId: "scifi",
    synopsis:
      "Un gruppo di esploratori attraversa un wormhole nei pressi di Saturno alla ricerca di un nuovo pianeta abitabile per garantire la sopravvivenza dell'umanità.",
    tags: ["Spazio-Tempo", "Esplorazione Spaziale", "Legame Familiare", "Relatività"],
  },
  {
    id: "inception",
    title: "Inception",
    director: "Christopher Nolan",
    year: 2010,
    rating: 8.8,
    clusterId: "scifi",
    synopsis:
      "Un ladro specializzato nell'estrazione di segreti dal subconscio durante il sogno riceve l'incarico opposto: impiantare un'idea nella mente di un bersaglio.",
    tags: ["Sogni Condivisi", "Subconscio", "Eist Eterna", "Realtà Multilivello"],
  },
  {
    id: "2001-odissea-nello-spazio",
    title: "2001: Odissea nello Spazio",
    director: "Stanley Kubrick",
    year: 1968,
    rating: 8.3,
    clusterId: "scifi",
    synopsis:
      "Dalla scoperta di un misterioso monolite sulla Luna a una missione verso Giove guidata da un'intelligenza artificiale, un viaggio filosofico sull'evoluzione umana.",
    tags: ["Intelligenza Artificiale", "Evoluzione", "Esplorazione Spaziale", "Cinema Filosofico"],
  },
  {
    id: "ghost-in-the-shell",
    title: "Ghost in the Shell",
    director: "Mamoru Oshii",
    year: 1995,
    rating: 7.9,
    clusterId: "cyberpunk",
    synopsis:
      "In un futuro cyberpunk, un'agente di polizia cibernetica dà la caccia a un misterioso hacker noto come Puppet Master, interrogandosi sulla propria coscienza.",
    tags: ["Coscienza Artificiale", "Cybernetica", "Anime Cyberpunk", "Identità"],
  },
  {
    id: "dune",
    title: "Dune",
    director: "Denis Villeneuve",
    year: 2021,
    rating: 8.5,
    clusterId: "scifi",
    synopsis:
      "L'erede di una nobile casata si ritrova al centro di una lotta interstellare per il controllo del pianeta desertico Arrakis e della preziosa Spezia.",
    tags: ["Politica Interstellare", "Pianeta Desertico", "Profezia", "Ecologia"],
  },
  {
    id: "pulp-fiction",
    title: "Pulp Fiction",
    director: "Quentin Tarantino",
    year: 1994,
    rating: 8.9,
    clusterId: "thriller",
    synopsis:
      "Le vite di due sicari, un pugile, un gangster e sua moglie si intrecciano in quattro storie di violenza e redenzione nella Los Angeles criminale.",
    tags: ["Narrazione Non Lineare", "Crimine", "Dialoghi Iconici", "Cinema Pulp"],
  },
  {
    id: "la-citta-incantata",
    title: "La Città Incantata",
    director: "Hayao Miyazaki",
    year: 2001,
    rating: 8.6,
    clusterId: "animation",
    synopsis:
      "Una bambina si ritrova intrappolata in un mondo abitato da spiriti e dèi, dove deve lavorare in una casa da bagno magica per salvare i suoi genitori trasformati in maiali.",
    tags: ["Mondo Fantastico", "Formazione", "Spiriti", "Animazione Giapponese"],
  },
  {
    id: "parasite",
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019,
    rating: 8.5,
    clusterId: "thriller",
    synopsis:
      "Una famiglia povera si infiltra gradualmente nella vita di una famiglia benestante, innescando una catena di eventi che ne rivela le disuguaglianze nascoste.",
    tags: ["Satira Sociale", "Disuguaglianza", "Suspense", "Cinema Coreano"],
  },
  {
    id: "her",
    title: "Her",
    director: "Spike Jonze",
    year: 2013,
    rating: 8.0,
    clusterId: "drama",
    synopsis:
      "Un uomo solitario sviluppa una relazione sentimentale con un sistema operativo dotato di intelligenza artificiale, capace di apprendere ed evolversi.",
    tags: ["Intelligenza Artificiale", "Solitudine", "Connessione Emotiva", "Futuro Prossimo"],
  },
  {
    id: "corsa-contro-il-sole",
    title: "Corsa Contro il Sole",
    director: "Rocco Ferrante",
    year: 2022,
    rating: 7.4,
    clusterId: "action",
    synopsis:
      "Un ex agente speciale ha ventiquattr'ore per sventare un attacco su una metropoli deserta, affrontando una rete di mercenari senza scrupoli.",
    tags: ["Inseguimento", "Contro il Tempo", "Mercenari", "Azione Urbana"],
  },
  {
    id: "il-matrimonio-perfetto-che-non-era",
    title: "Il Matrimonio Perfetto (Che Non Era)",
    director: "Ines Conti",
    year: 2023,
    rating: 6.9,
    clusterId: "comedy",
    synopsis:
      "Due famiglie agli antipodi si scontrano nel weekend che precede un matrimonio, tra equivoci, sorprese e un catering finito clamorosamente male.",
    tags: ["Equivoci", "Famiglia Disfunzionale", "Commedia Corale", "Matrimonio"],
  },
  {
    id: "la-veglia-di-hollow-creek",
    title: "La Veglia di Hollow Creek",
    director: "Anouk Baptiste",
    year: 2020,
    rating: 7.1,
    clusterId: "horror",
    synopsis:
      "In una casa isolata ai margini di Hollow Creek, una famiglia scopre che il rituale notturno tramandato dai vecchi proprietari non è mai stato solo una leggenda.",
    tags: ["Casa Infestata", "Rituale Antico", "Isolamento", "Presenza Soprannaturale"],
  },
];

export const BLADE_RUNNER_ID = "blade-runner-2049";

export const BLADE_RUNNER_CAST: CastMember[] = [
  { name: "Ryan Gosling", role: "Agente K / Joe", roleType: "principale", gradientFrom: "#22d3ee", gradientTo: "#3b82f6", initials: "RG" },
  { name: "Harrison Ford", role: "Rick Deckard", roleType: "principale", gradientFrom: "#fbbf24", gradientTo: "#f97316", initials: "HF" },
  { name: "Ana de Armas", role: "Joi", roleType: "olografica", gradientFrom: "#f472b6", gradientTo: "#a855f7", initials: "AA" },
  { name: "Sylvia Hoeks", role: "Luv", roleType: "supporto", gradientFrom: "#a855f7", gradientTo: "#6366f1", initials: "SH" },
  { name: "Robin Wright", role: "Tenente Joshi", roleType: "supporto", gradientFrom: "#3b82f6", gradientTo: "#22d3ee", initials: "RW" },
  { name: "Jared Leto", role: "Niander Wallace", roleType: "supporto", gradientFrom: "#34d399", gradientTo: "#14b8a6", initials: "JL" },
  { name: "Dave Bautista", role: "Sapper Morton", roleType: "supporto", gradientFrom: "#fb7185", gradientTo: "#ef4444", initials: "DB" },
];

export const BLADE_RUNNER_AWARDS_NOTE = "2 Premi Oscar® — Miglior Fotografia & Migliori Effetti Speciali";

export const BLADE_RUNNER_CREDITS: MovieCredits = {
  director: "Denis Villeneuve",
  cinematography: "Roger Deakins",
  cinematographyAward: "Premio Oscar",
  music: "Hans Zimmer & Benjamin Wallfisch",
  screenplay: "Hampton Fancher & Michael Green",
};

export const BLADE_RUNNER_TRACKS: SoundtrackTrack[] = [
  { id: "br-t1", num: 1, title: "2049", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "03:37", totalSec: 217 },
  { id: "br-t2", num: 2, title: "Sapper's Tree", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "01:36", totalSec: 96, styleTag: "Atmospheric Ambient" },
  { id: "br-t3", num: 3, title: "Flight to LAPD", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "01:47", totalSec: 107, styleTag: "Analog CS-80 Synth" },
  { id: "br-t4", num: 4, title: "Rain", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "02:26", totalSec: 146, styleTag: "Melancholy Piano & Strings" },
  { id: "br-t5", num: 5, title: "Mesa", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "03:10", totalSec: 190, styleTag: "Heavy Brass & Percussion" },
  { id: "br-t6", num: 6, title: "Tears in the Rain", artist: "Hans Zimmer & Benjamin Wallfisch", duration: "02:10", totalSec: 130, styleTag: "Vangelis Tribute Theme" },
];
