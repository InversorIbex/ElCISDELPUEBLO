/**
 * SEO: dominio canónico, palabras clave y datos estructurados (schema.org).
 * Nunca presentamos el sondeo como encuesta oficial ni lo asociamos al CIS.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.laopiniondelpueblo.eu").replace(/\/$/, "");
export const SITE_NAME = "El Pueblo Opina";
export const ELECTION_DATE = "2026-11-29";
export const ELECTION_NAME = "Elecciones generales 2026";

export const KEYWORDS = [
  // Noche electoral y resultados (búsquedas del 28 y 29-N; actualizadas el 2026-11-28).
  "resultados elecciones generales 2026", "resultados elecciones 29 noviembre", "resultados elecciones 29N",
  "elecciones generales 2026 en directo", "recuento elecciones en directo", "escrutinio elecciones generales",
  "noche electoral", "elecciones mañana", "elecciones domingo 29 noviembre", "a qué hora cierran los colegios electorales",
  "a qué hora se saben los resultados de las elecciones", "quién ha ganado las elecciones", "quién ganará las elecciones", "participación elecciones 2026",
  "mayoría absoluta 176", "escaños Congreso 2026", "hemiciclo", "D'Hondt",
  // Porra y predicción.
  "porra elecciones", "porra elecciones generales 2026", "clasificación porra elecciones", "predicción elecciones 2026", "pronóstico elecciones",
  // Herramientas de la jornada de reflexión.
  "jornada de reflexión", "dónde voto", "mi colegio electoral", "horario colegios electorales",
  "qué documento necesito para votar", "mi papeleta", "candidaturas por provincia", "listas electorales",
  "cuánto vale mi voto", "habitantes por escaño", "valor del voto por provincia",
  "brújula electoral", "test político", "a quién votar",
  // Base.
  "elecciones generales 2026", "elecciones 29 noviembre 2026", "encuesta elecciones generales", "sondeo elecciones 2026",
  "intención de voto", "candidaturas Congreso 2026", "partidos políticos 2026", "resultados por provincia",
  "circunscripciones", "PP", "PSOE", "Vox", "Frente Amplio", "Podemos", "SALF", "Compromís",
  "Pedro Sánchez", "Alberto Núñez Feijóo", "Santiago Abascal", "Ada Colau",
];

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export type JsonLd = Record<string, unknown>;

export const organizationLd: JsonLd = {
  "@type": "Organization",
  "@id": abs("/#organizacion"),
  name: SITE_NAME,
  url: abs("/"),
  logo: abs("/icon.svg"),
  description: "Observatorio ciudadano independiente: candidaturas oficiales, simulador de escaños y sondeo voluntario de intención de voto. Sin vínculo con el CIS ni con organismos electorales.",
};

export const websiteLd: JsonLd = {
  "@type": "WebSite",
  "@id": abs("/#web"),
  name: SITE_NAME,
  alternateName: ["La Opinión del Pueblo", "laopiniondelpueblo.eu"],
  url: abs("/"),
  inLanguage: "es-ES",
  publisher: { "@id": abs("/#organizacion") },
};

export const electionEventLd: JsonLd = {
  "@type": "Event",
  "@id": abs("/#elecciones-2026"),
  name: "Elecciones generales de España 2026 (Congreso y Senado)",
  startDate: `${ELECTION_DATE}T09:00:00+01:00`,
  endDate: `${ELECTION_DATE}T21:00:00+01:00`, // cierre en Canarias (20:00 hora canaria)
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: { "@type": "Country", name: "España" },
  organizer: { "@type": "GovernmentOrganization", name: "Junta Electoral Central", url: "https://www.juntaelectoralcentral.es" },
  description: "Elecciones a Cortes Generales convocadas por el Real Decreto 806/2026 (BOE de 6 de octubre de 2026). 350 diputados en 52 circunscripciones.",
};

/** Debate a cuatro del 26-N: cada candidato con su partido. */
export const debateEventLd: JsonLd = {
  "@type": "Event",
  "@id": abs("/quien-gano-el-debate#debate"),
  name: "Debate electoral a cuatro de las elecciones generales 2026",
  description:
    "Último debate de la campaña de las elecciones generales del 29 de noviembre de 2026, entre Pedro Sánchez (PSOE), Alberto Núñez Feijóo (PP), Santiago Abascal (Vox) y Ada Colau (Frente Amplio). Temas: vivienda; economía y fiscalidad; políticas sociales y servicios públicos; corrupción y regeneración democrática; migración y política exterior.",
  startDate: "2026-11-26T22:00:00+01:00",
  endDate: "2026-11-27T00:00:00+01:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: { "@type": "VirtualLocation", url: "https://www.rtve.es/play/" },
  inLanguage: "es-ES",
  image: abs("/debate/og-debate.jpg"),
  url: abs("/quien-gano-el-debate"),
  superEvent: { "@id": abs("/#elecciones-2026") },
  performer: [
    ["Pedro Sánchez", "Partido Socialista Obrero Español", "PSOE"],
    ["Alberto Núñez Feijóo", "Partido Popular", "PP"],
    ["Santiago Abascal", "Vox", "Vox"],
    ["Ada Colau", "Frente Amplio", "FA"],
  ].map(([name, party, short]) => ({
    "@type": "Person",
    name,
    affiliation: { "@type": "Organization", name: party, alternateName: short },
  })),
};

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function faqLd(qa: readonly (readonly [string, string])[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Serializa varios nodos en un único @graph, escapando "<" para no romper el <script>. */
export function ldJson(...nodes: JsonLd[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
