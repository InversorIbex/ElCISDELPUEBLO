/**
 * Veda de publicación de sondeos (LOREG art. 69.7): prohibido difundir sondeos
 * electorales durante los cinco días anteriores a la votación. Se extiende
 * hasta el cierre del último colegio el 29-N (20:00 en Canarias = 21:00 en la
 * Península), para no difundir nada durante la jornada electoral.
 * Noviembre: Madrid = UTC+1.
 */
export const BLACKOUT_START = new Date("2026-11-23T23:00:00Z"); // 24-N 00:00 Madrid
export const BLACKOUT_END = new Date("2026-11-29T20:00:00Z"); // 29-N 21:00 Madrid
export function inPollBlackout(now = new Date()): boolean {
  return now >= BLACKOUT_START && now < BLACKOUT_END;
}
export const BLACKOUT_NOTICE =
  "Del 24 de noviembre al cierre de los colegios del 29 de noviembre la ley electoral prohíbe difundir sondeos. Los resultados vuelven a mostrarse a partir de las 21:00 (hora peninsular) del 29-N. Puedes seguir participando.";
