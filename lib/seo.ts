/**
 * SEO: dominio canónico, palabras clave y datos estructurados (schema.org).
 * Nunca presentamos el sondeo como encuesta oficial ni lo asociamos al CIS.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.laopiniondelpueblo.eu").replace(/\/$/, "");
export const SITE_NAME = "El Pueblo Opina";
export const ELECTION_DATE = "2026-11-29";
export const ELECTION_NAME = "Elecciones generales 2026";

export const KEYWORDS = [
  "elecciones generales 2026", "elecciones 29 noviembre 2026", "encuesta elecciones generales",
  "sondeo elecciones 2026", "sondeo electoral", "encuesta online elecciones", "intención de voto",
  "votar online sondeo", "a quién votarías", "candidaturas Congreso 2026", "partidos políticos 2026",
  "listas electorales", "escaños Congreso", "hemiciclo", "D'Hondt", "resultados por provincia",
  "circunscripciones", "PP", "PSOE", "Vox", "Sumar", "Podemos", "Frente Amplio", "SALF",
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
  endDate: `${ELECTION_DATE}T20:00:00+01:00`,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: { "@type": "Country", name: "España" },
  organizer: { "@type": "GovernmentOrganization", name: "Junta Electoral Central", url: "https://www.juntaelectoralcentral.es" },
  description: "Elecciones a Cortes Generales convocadas por el Real Decreto 806/2026 (BOE de 6 de octubre de 2026). 350 diputados en 52 circunscripciones.",
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
