/**
 * Brújula electoral: 18 afirmaciones sobre tres ejes (economía, sociedad y
 * modelo territorial). Sitúa a cada persona en el mapa político, pero NO la
 * empareja con partidos: no hemos verificado las posiciones de los programas
 * y asignarlas a mano sería editorializar. Las respuestas no salen del
 * navegador: no se envían ni se guardan en el servidor.
 *
 * Cada eje tiene 3 afirmaciones en cada sentido, para que «estar de acuerdo
 * con todo» no empuje hacia un lado.
 */
export const BRUJULA_PATH = "/brujula-electoral";

export type Axis = "economia" | "sociedad" | "territorio";
export type Statement = { id: string; axis: Axis; text: string; /** +1: estar de acuerdo empuja a la derecha/conservador/centralista. */ dir: 1 | -1 };

export const AXES: Record<Axis, { name: string; low: string; high: string }> = {
  economia: { name: "Economía", low: "Más Estado", high: "Más mercado" },
  sociedad: { name: "Sociedad", low: "Progresista", high: "Conservador" },
  territorio: { name: "Territorio", low: "Más autogobierno", high: "Más Estado central" },
};

export const STATEMENTS: readonly Statement[] = [
  { id: "e1", axis: "economia", dir: -1, text: "El Estado debería poner un tope al precio del alquiler en las zonas más tensionadas." },
  { id: "s1", axis: "sociedad", dir: 1, text: "La inmigración debería estar más limitada que ahora." },
  { id: "t1", axis: "territorio", dir: -1, text: "Las comunidades autónomas deberían tener más competencias que ahora." },
  { id: "e2", axis: "economia", dir: 1, text: "Bajar impuestos a las empresas crea más empleo que aumentar el gasto público." },
  { id: "s2", axis: "sociedad", dir: -1, text: "La eutanasia regulada es un derecho que debe mantenerse." },
  { id: "t2", axis: "territorio", dir: 1, text: "Algunas competencias, como la educación, deberían volver al Estado central." },
  { id: "e3", axis: "economia", dir: -1, text: "Las grandes fortunas deberían pagar un impuesto específico sobre su patrimonio." },
  { id: "s3", axis: "sociedad", dir: 1, text: "Las penas de cárcel deberían endurecerse en general." },
  { id: "t3", axis: "territorio", dir: -1, text: "Cataluña o el País Vasco deberían poder votar en referéndum su independencia." },
  { id: "e4", axis: "economia", dir: 1, text: "La gestión privada dentro de la sanidad pública mejora el servicio." },
  { id: "s4", axis: "sociedad", dir: -1, text: "La educación afectivo-sexual debería ser obligatoria en los colegios." },
  { id: "t4", axis: "territorio", dir: 1, text: "Todas las comunidades deberían financiarse igual, sin regímenes especiales." },
  { id: "e5", axis: "economia", dir: -1, text: "El salario mínimo debería seguir subiendo aunque algunas empresas lo noten." },
  { id: "s5", axis: "sociedad", dir: 1, text: "La tauromaquia es patrimonio cultural y debería recibir apoyo público." },
  { id: "t5", axis: "territorio", dir: -1, text: "El catalán, el euskera y el gallego deberían poder usarse con normalidad en el Congreso." },
  { id: "e6", axis: "economia", dir: 1, text: "Hay que reducir el tamaño del sector público aunque eso suponga recortar algunos servicios." },
  { id: "s6", axis: "sociedad", dir: -1, text: "El aborto debe seguir siendo libre durante las primeras semanas." },
  { id: "t6", axis: "territorio", dir: 1, text: "Un Gobierno central fuerte funciona mejor que uno repartido entre autonomías." },
];

/** −2 muy en desacuerdo … +2 muy de acuerdo. null = sin opinión (no cuenta). */
export type Answer = -2 | -1 | 0 | 1 | 2 | null;
export const ANSWER_OPTIONS: { value: Exclude<Answer, null>; label: string }[] = [
  { value: -2, label: "Muy en desacuerdo" },
  { value: -1, label: "En desacuerdo" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "De acuerdo" },
  { value: 2, label: "Muy de acuerdo" },
];

/** Posición por eje entre −1 y +1. null si no se ha contestado nada en ese eje. */
export function scoreAxes(answers: Record<string, Answer>): Record<Axis, number | null> {
  const out = {} as Record<Axis, number | null>;
  for (const axis of Object.keys(AXES) as Axis[]) {
    const items = STATEMENTS.filter((s) => s.axis === axis && answers[s.id] !== null && answers[s.id] !== undefined);
    out[axis] = items.length ? items.reduce((sum, s) => sum + (answers[s.id] as number) * s.dir, 0) / (2 * items.length) : null;
  }
  return out;
}

export function profileLabel(score: Record<Axis, number | null>): { title: string; text: string } {
  const e = score.economia ?? 0;
  const s = score.sociedad ?? 0;
  const near = (v: number) => Math.abs(v) < 0.2;
  if (near(e) && near(s)) return { title: "Centro", text: "Tus respuestas se reparten sin inclinarse claramente a ningún lado en economía ni en sociedad." };
  if (e < 0 && s <= 0) return { title: "Izquierda progresista", text: "Prefieres más intervención pública en la economía y posiciones progresistas en lo social." };
  if (e >= 0 && s > 0) return { title: "Derecha conservadora", text: "Prefieres más mercado en la economía y posiciones conservadoras en lo social." };
  if (e < 0 && s > 0) return { title: "Izquierda conservadora", text: "Quieres más Estado en la economía, pero en lo social te inclinas por posiciones conservadoras." };
  return { title: "Liberal", text: "Prefieres más mercado en la economía y posiciones progresistas en lo social." };
}

export function territoryLabel(v: number | null) {
  if (v === null) return "Sin respuesta";
  if (v <= -0.33) return "Más autogobierno";
  if (v >= 0.33) return "Más Estado central";
  return "Cerca del modelo actual";
}
