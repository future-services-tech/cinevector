import type { ClusterId } from "../types/movie";

/** Pool di parole/nomi per la generazione procedurale — nessun dataset esterno, solo combinazioni
 * pescate deterministicamente da qui (vedi generateMockData.ts). */

export const TITLE_FRAGMENTS: Record<ClusterId, { adjectives: string[]; nouns: string[] }> = {
  scifi: {
    adjectives: ["Quantum", "Eterno", "Distante", "Silente", "Infinito", "Orbitale", "Glaciale", "Primordiale"],
    nouns: ["Nebula", "Singolarità", "Orizzonte", "Void", "Costellazione", "Deriva", "Eclissi", "Frontiera"],
  },
  cyberpunk: {
    adjectives: ["Neon", "Sintetico", "Digitale", "Corrotto", "Ibrido", "Fantasma", "Cablato", "Criptato"],
    nouns: ["Circuito", "Rete", "Impianto", "Megalopoli", "Firmware", "Protocollo", "Avatar", "Server"],
  },
  thriller: {
    adjectives: ["Silenzioso", "Ultimo", "Spezzato", "Nascosto", "Freddo", "Inseguito", "Sospeso", "Oscuro"],
    nouns: ["Indizio", "Complotto", "Ombra", "Testimone", "Verdetto", "Dossier", "Alibi", "Sospetto"],
  },
  drama: {
    adjectives: ["Fragile", "Perduto", "Interrotto", "Lontano", "Intimo", "Sospeso", "Sincero", "Ultimo"],
    nouns: ["Ricordo", "Distanza", "Promessa", "Ritorno", "Silenzio", "Confine", "Eredità", "Attesa"],
  },
  animation: {
    adjectives: ["Incantato", "Fantastico", "Minuscolo", "Luminoso", "Segreto", "Volante", "Magico", "Curioso"],
    nouns: ["Giardino", "Villaggio", "Foresta", "Portale", "Lanterna", "Viaggio", "Nuvola", "Regno"],
  },
  action: {
    adjectives: ["Spietato", "Estremo", "Letale", "Ribelle", "Corazzato", "Infuocato", "Implacabile", "Disperato"],
    nouns: ["Assalto", "Bersaglio", "Riscatto", "Fuga", "Vendetta", "Contratto", "Frontiera", "Missione"],
  },
  comedy: {
    adjectives: ["Assurdo", "Imprevedibile", "Goffo", "Fortunato", "Improbabile", "Caotico", "Bizzarro", "Sgangherato"],
    nouns: ["Weekend", "Matrimonio", "Vicino", "Appuntamento", "Equivoco", "Piano", "Rimborso", "Trasloco"],
  },
  horror: {
    adjectives: ["Silente", "Maledetto", "Sepolto", "Notturno", "Malato", "Antico", "Infestato", "Spezzato"],
    nouns: ["Sussurro", "Ombra", "Rituale", "Presenza", "Cantina", "Specchio", "Veglia", "Sipario"],
  },
};

export const DIRECTOR_FIRST_NAMES = [
  "Alina", "Marco", "Yuki", "Soren", "Elena", "Kofi", "Priya", "Lukas", "Noor", "Ivo",
  "Camille", "Tomas", "Freya", "Dario", "Mei", "Anders", "Zara", "Rocco", "Ines", "Bjorn",
];

export const DIRECTOR_LAST_NAMES = [
  "Voss", "Bianchi", "Takahashi", "Moretti", "Kaur", "Larsen", "Novak", "Adeyemi", "Ferrante", "Lindqvist",
  "Okafor", "Rousseau", "Havel", "Sorensen", "Marchetti", "Stromberg", "Delacroix", "Weiss", "Conti", "Nakamura",
];

export const SYNOPSIS_TEMPLATES: Record<ClusterId, string[]> = {
  scifi: [
    "In un futuro in cui {protagonist} scopre un segnale proveniente da {setting}, un viaggio ai confini della realtà mette alla prova {conflict}.",
    "Quando {setting} viene minacciato da un'anomalia dello spazio-tempo, {protagonist} deve affrontare {conflict} prima che sia troppo tardi.",
  ],
  cyberpunk: [
    "In {setting}, dominata da megacorporazioni e reti neurali, {protagonist} scopre {conflict} che potrebbe riscrivere le regole del potere.",
    "Un hacker noto come {protagonist} si infiltra in {setting} per svelare {conflict} nascosto nei server della città.",
  ],
  thriller: [
    "{protagonist} indaga su {conflict} che collega {setting} a una cospirazione ben più ampia di quanto immaginasse.",
    "Dopo un evento inspiegabile a {setting}, {protagonist} deve ricostruire {conflict} prima che la verità venga insabbiata.",
  ],
  drama: [
    "{protagonist} torna a {setting} dopo anni di silenzio, costretto ad affrontare {conflict} rimasto irrisolto.",
    "Tra le mura di {setting}, {protagonist} scopre che {conflict} ha segnato più di una generazione della propria famiglia.",
  ],
  animation: [
    "{protagonist} scopre un passaggio segreto verso {setting}, dove {conflict} attende solo chi crede ancora nella magia.",
    "In {setting}, {protagonist} intraprende un viaggio straordinario per risolvere {conflict} insieme a nuovi amici inaspettati.",
  ],
  action: [
    "{protagonist} ha poche ore per fermare {conflict} prima che {setting} cada nel caos totale.",
    "Braccato attraverso {setting}, {protagonist} deve usare ogni risorsa per sventare {conflict}.",
  ],
  comedy: [
    "Quando {protagonist} finisce coinvolto in {conflict} a {setting}, niente andrà come previsto — per fortuna.",
    "Un weekend a {setting} si trasforma nel disastro perfetto quando {protagonist} affronta {conflict}.",
  ],
  horror: [
    "Da quando si è trasferito a {setting}, {protagonist} percepisce una presenza legata a {conflict} che nessuno vuole nominare.",
    "{protagonist} scopre che {setting} nasconde {conflict}, un segreto sepolto da generazioni e ora tornato a bussare.",
  ],
};

export const PROTAGONISTS = [
  "un'agente in fuga", "una scienziata isolata", "un pilota silenzioso", "una detective scettica",
  "un giovane apprendista", "una fotoreporter", "un ex militare", "una curatrice di archivi",
  "un chirurgo insonne", "una hacker solitaria", "un capitano in disgrazia", "una violinista prodigio",
];

export const SETTINGS = [
  "una stazione orbitale abbandonata", "i quartieri sommersi di una metropoli", "un villaggio costiero dimenticato",
  "un archivio sotterraneo", "una colonia ai confini del sistema", "un teatro chiuso da decenni",
  "un'isola artificiale", "una biblioteca infinita", "un treno notturno transcontinentale", "un ospedale dismesso",
];

export const CONFLICTS = [
  "un segreto di famiglia mai raccontato", "una verità che il potere vuole insabbiare",
  "un'entità che sfida ogni spiegazione", "un errore del passato mai perdonato",
  "una scoperta capace di cambiare tutto", "un patto stretto troppo tempo fa",
];

export const TAG_POOL: Record<ClusterId, string[]> = {
  scifi: ["viaggio nel tempo", "intelligenza artificiale", "esplorazione spaziale", "distopia", "primo contatto", "singolarità tecnologica", "colonizzazione", "realtà simulata"],
  cyberpunk: ["intelligenza artificiale", "distopia urbana", "impianti neurali", "megacorporazioni", "hacking", "crisi d'identità", "fotografia neo-noir", "cybernetica"],
  thriller: ["cospirazione", "doppio gioco", "indagine", "tensione psicologica", "colpo di scena", "corsa contro il tempo", "segreto di stato"],
  drama: ["famiglia", "perdita", "redenzione", "memoria", "identità", "seconda possibilità", "eredità"],
  animation: ["avventura", "amicizia", "mondo fantastico", "crescita", "magia", "viaggio iniziatico"],
  action: ["inseguimento", "vendetta", "missione impossibile", "arti marziali", "eroe riluttante", "contro il tempo"],
  comedy: ["equivoci", "commedia romantica", "satira sociale", "amicizia", "famiglia disfunzionale"],
  horror: ["casa infestata", "rituale antico", "sopravvivenza", "presenza soprannaturale", "isolamento", "maledizione"],
};

export const CAST_FIRST_NAMES = [
  "Elio", "Naomi", "Kaito", "Selene", "Idris", "Freya", "Mateo", "Aiko", "Otto", "Lucia",
  "Amir", "Sofia", "Bruno", "Nadia", "Felix", "Yara", "Leon", "Mira", "Tobias", "Anouk",
];

export const CAST_LAST_NAMES = [
  "Reyes", "Holm", "Fontaine", "Abara", "Winter", "Castellano", "Brandt", "Solheim", "Duval", "Okonkwo",
  "Vasquez", "Lindberg", "Moreau", "Halvorsen", "Petrov", "Carrasco", "Eriksen", "Baptiste",
];

export const TRACK_TITLE_FRAGMENTS = [
  "Sequenza", "Notturno", "Riflesso", "Frequenza", "Deriva", "Cadenza", "Eco", "Traiettoria", "Frammento", "Soglia",
];
