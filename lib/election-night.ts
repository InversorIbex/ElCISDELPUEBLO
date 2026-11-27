/**
 * Noche electoral del 29-N: programa de la jornada y formato del recuento.
 *
 * El recuento solo contiene datos oficiales del escrutinio provisional del
 * Ministerio del Interior. Lo carga el operador con `scripts/push-recuento.mjs`
 * (POST protegido a /api/recuento). Antes de las 21:00 peninsulares la API no
 * publica escaños ni votos, aunque se hayan cargado: solo la participación
 * oficial, que no es un sondeo.
 */
import { BLACKOUT_END } from "./electoral-blackout.ts";
import { PORRA_PARTIES, TOTAL_SEATS } from "./porra.ts";

export const NIGHT_PATH = "/noche-electoral";
export const RESULTS_SOURCE = { name: "Ministerio del Interior · Infoelectoral", url: "https://www.infoelectoral.interior.gob.es/" };
export const CENSUS_LOOKUP = { name: "Oficina del Censo Electoral (INE)", url: "https://www.ine.es/oficina_censo/" };

/** Momentos clave en hora peninsular (noviembre: UTC+1). */
export const NIGHT_SCHEDULE = [
  { at: "2026-11-29T08:00:00Z", time: "09:00", title: "Abren los colegios", text: "Las mesas se constituyen a las 8:00 y se vota de 9:00 a 20:00." },
  { at: "2026-11-29T13:00:00Z", time: "14:00", title: "Primer avance de participación", text: "Interior publica el porcentaje de participación a mediodía." },
  { at: "2026-11-29T17:00:00Z", time: "18:00", title: "Segundo avance de participación", text: "Comparación con la participación de 2023 a la misma hora." },
  { at: "2026-11-29T19:00:00Z", time: "20:00", title: "Cierran los colegios en la Península", text: "Empieza el escrutinio en cada mesa. En Canarias se vota una hora más." },
  { at: BLACKOUT_END.toISOString(), time: "21:00", title: "Cierra Canarias: arranca el recuento", text: "Fin de la veda. Escaños en directo, tu porra frente al resultado y lo que dijo el pueblo." },
  { at: "2026-11-29T23:00:00Z", time: "00:00", title: "Escrutinio casi completo", text: "Hemiciclo provisional, mayorías posibles y el ranking de tu porra." },
] as const;

export type RecuentoParty = { id: string; seats: number; votesPct: number | null };
export type RecuentoPayload = {
  updatedAt: string;
  /** Porcentaje escrutado (0–100). */
  scrutinized: number | null;
  /** Participación oficial final o del último avance (0–100). */
  turnout: number | null;
  /** Avances oficiales de participación de la jornada. */
  turnoutUpdates: { time: "14:00" | "18:00" | "20:00"; pct: number; pct2023: number | null }[];
  parties: RecuentoParty[];
  final: boolean;
};

export type RecuentoPublic = {
  status: "waiting" | "turnout" | "live" | "final";
  configured: boolean;
  resultsFrom: string;
  updatedAt: string | null;
  scrutinized: number | null;
  turnout: number | null;
  turnoutUpdates: RecuentoPayload["turnoutUpdates"];
  parties: (RecuentoParty & { name: string; color: string })[];
};

const pct = (v: unknown) => v === null || v === undefined ? null
  : typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100 ? Math.round(v * 100) / 100 : NaN;
const IDS = new Set(PORRA_PARTIES.map((p) => p.id));

/** Valida lo que envía el operador. Lanza un error con el campo problemático. */
export function parseRecuento(input: unknown): RecuentoPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_BODY");
  const b = input as Record<string, unknown>;
  const scrutinized = pct(b.scrutinized);
  const turnout = pct(b.turnout);
  if (Number.isNaN(scrutinized)) throw new Error("INVALID_SCRUTINIZED");
  if (Number.isNaN(turnout)) throw new Error("INVALID_TURNOUT");
  const updates = Array.isArray(b.turnoutUpdates) ? b.turnoutUpdates : [];
  if (updates.length > 3) throw new Error("INVALID_TURNOUT_UPDATES");
  const turnoutUpdates = updates.map((u) => {
    const x = (u ?? {}) as Record<string, unknown>;
    const p = pct(x.pct);
    const p23 = pct(x.pct2023);
    if (!["14:00", "18:00", "20:00"].includes(String(x.time)) || p === null || Number.isNaN(p) || Number.isNaN(p23))
      throw new Error("INVALID_TURNOUT_UPDATES");
    return { time: x.time as "14:00" | "18:00" | "20:00", pct: p, pct2023: p23 };
  });
  const rawParties = Array.isArray(b.parties) ? b.parties : [];
  if (rawParties.length > PORRA_PARTIES.length) throw new Error("INVALID_PARTIES");
  const seen = new Set<string>();
  const parties = rawParties.map((r) => {
    const x = (r ?? {}) as Record<string, unknown>;
    const id = String(x.id);
    const seats = x.seats;
    const votesPct = pct(x.votesPct);
    if (!IDS.has(id) || seen.has(id) || typeof seats !== "number" || !Number.isSafeInteger(seats) || seats < 0 || seats > TOTAL_SEATS || Number.isNaN(votesPct))
      throw new Error("INVALID_PARTIES");
    seen.add(id);
    return { id, seats, votesPct };
  });
  if (parties.reduce((s, p) => s + p.seats, 0) > TOTAL_SEATS) throw new Error("TOO_MANY_SEATS");
  const final = b.final === true;
  if (final && parties.reduce((s, p) => s + p.seats, 0) !== TOTAL_SEATS) throw new Error("FINAL_NEEDS_350");
  return { updatedAt: new Date().toISOString(), scrutinized, turnout, turnoutUpdates, parties, final };
}

/** Lo que ve el público. Antes de las 21:00 del 29-N no salen escaños ni votos. */
export function publicRecuento(payload: RecuentoPayload | null, configured: boolean, now = new Date()): RecuentoPublic {
  const empty: RecuentoPublic = {
    status: "waiting", configured, resultsFrom: BLACKOUT_END.toISOString(), updatedAt: null,
    scrutinized: null, turnout: null, turnoutUpdates: [], parties: [],
  };
  if (!payload) return empty;
  const open = now >= BLACKOUT_END;
  const parties = open
    ? payload.parties
      .filter((p) => p.seats > 0 || (p.votesPct ?? 0) > 0)
      .map((p) => ({ ...p, ...PORRA_PARTIES.find((x) => x.id === p.id)! }))
      .sort((a, b) => b.seats - a.seats || (b.votesPct ?? 0) - (a.votesPct ?? 0))
    : [];
  const status = open && payload.final ? "final" : open && parties.length ? "live"
    : payload.turnoutUpdates.length || payload.turnout !== null ? "turnout" : "waiting";
  return {
    ...empty,
    status,
    updatedAt: payload.updatedAt,
    scrutinized: open ? payload.scrutinized : null,
    turnout: payload.turnout,
    turnoutUpdates: payload.turnoutUpdates,
    parties,
  };
}
