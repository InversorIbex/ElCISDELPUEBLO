"use client";
import { useState } from "react";
import {
  allocateSeats,
  parseManualWeight,
  type AllocationResult,
} from "@/lib/electoral";
type Constituency = {
  provinceCode: string;
  name: string;
  seats: number;
  system: string;
};
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function SeatSimulator({
  constituencies,
}: {
  constituencies: Constituency[];
}) {
  const [province, setProvince] = useState("27");
  const [mode, setMode] = useState<"votes" | "percent">("votes");
  const [values, setValues] = useState(["", "", "", ""]);
  const [blank, setBlank] = useState("");
  const [invalid, setInvalid] = useState("");
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [error, setError] = useState("");
  const [drawWinners, setDrawWinners] = useState<Record<string, string>>({});
  const selected = constituencies.find((c) => c.provinceCode === province)!;
  function clearResult() {
    setResult(null);
    setError("");
    setDrawWinners({});
  }
  function calculate(decisions: Record<string, string> = {}) {
    try {
      const candidates = values.map((value, i) => ({
        id: alphabet[i],
        votes: parseManualWeight(value, mode),
      }));
      const blankVotes = parseManualWeight(blank, mode),
        nullVotes = parseManualWeight(invalid, mode);
      if (
        mode === "percent" &&
        candidates.reduce((s, c) => s + c.votes, blankVotes + nullVotes) !==
          10000
      )
        throw new Error(
          "Los porcentajes de alternativas, blanco y nulo deben sumar exactamente 100 %.",
        );
      const outcome = allocateSeats({
        candidates,
        blank: blankVotes,
        nullVotes,
        seats: selected.seats,
        system: selected.system as "dhondt" | "plurality",
        drawWinners: decisions,
      });
      setResult(outcome);
      setDrawWinners(decisions);
      setError("");
    } catch (e) {
      setResult(null);
      setError(
        e instanceof Error ? e.message : "No se pudo calcular el reparto.",
      );
    }
  }
  function reset() {
    setValues(["", "", "", ""]);
    setBlank("");
    setInvalid("");
    clearResult();
  }
  const fmt = (n: number) =>
    n.toLocaleString("es-ES", {
      useGrouping: "always",
      maximumFractionDigits: 2,
    });
  return (
    <div className="simulator">
      <div className="simulation-config">
        <div className="eyebrow">MODO A / ESCENARIO MANUAL</div>
        <h2>Construye una hipótesis.</h2>
        <p>
          Alternativas hipotéticas, sin relación con candidaturas registradas.
          Se calcula en tu navegador y no se guarda ni se envía.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            calculate();
          }}
        >
          <div className="simulation-controls">
            <div>
              <label htmlFor="sim-province">Circunscripción del Congreso</label>
              <select
                id="sim-province"
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  clearResult();
                }}
              >
                {constituencies.map((c) => (
                  <option key={c.provinceCode} value={c.provinceCode}>
                    {c.name} · {c.seats} escaño{c.seats === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sim-unit">Introduce</label>
              <select
                id="sim-unit"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as "votes" | "percent");
                  reset();
                }}
              >
                <option value="votes">Número de votos</option>
                <option value="percent">Porcentajes (2 decimales)</option>
              </select>
            </div>
          </div>
          <div className="simulation-votes">
            {values.map((value, i) => (
              <div className="simulation-input-row" key={i}>
                <label htmlFor={`sim-${i}`}>
                  <span className={`candidate-chip c${i % 6}`}>
                    {alphabet[i]}
                  </span>
                  Hipótesis {alphabet[i]}
                </label>
                <input
                  id={`sim-${i}`}
                  inputMode={mode === "votes" ? "numeric" : "decimal"}
                  autoComplete="off"
                  maxLength={14}
                  value={value}
                  placeholder="0"
                  onChange={(e) => {
                    setValues((v) =>
                      v.map((x, j) => (j === i ? e.target.value : x)),
                    );
                    clearResult();
                  }}
                />
                <span>{mode === "percent" ? "%" : "votos"}</span>
              </div>
            ))}
          </div>
          <div className="simulation-row-actions">
            <button
              type="button"
              className="text-button"
              disabled={values.length >= 12}
              onClick={() => {
                setValues((v) => [...v, ""]);
                clearResult();
              }}
            >
              + Añadir alternativa
            </button>
            <button
              type="button"
              className="text-button"
              disabled={values.length <= 2}
              onClick={() => {
                setValues((v) => v.slice(0, -1));
                clearResult();
              }}
            >
              − Quitar última
            </button>
          </div>
          <div className="simulation-other">
            <div>
              <label htmlFor="sim-blank">Voto en blanco</label>
              <input
                id="sim-blank"
                inputMode="decimal"
                autoComplete="off"
                maxLength={14}
                placeholder="0"
                value={blank}
                onChange={(e) => {
                  setBlank(e.target.value);
                  clearResult();
                }}
              />
            </div>
            <div>
              <label htmlFor="sim-null">Voto nulo (excluido del válido)</label>
              <input
                id="sim-null"
                inputMode="decimal"
                autoComplete="off"
                maxLength={14}
                placeholder="0"
                value={invalid}
                onChange={(e) => {
                  setInvalid(e.target.value);
                  clearResult();
                }}
              />
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button className="button" type="submit">
              Calcular reparto <span>→</span>
            </button>
            <button className="text-button" type="button" onClick={reset}>
              Vaciar escenario
            </button>
          </div>
          <p className="selector-footnote">
            {selected.system === "plurality"
              ? "Ceuta y Melilla: un diputado para la alternativa con más votos."
              : "Reparto D’Hondt. Umbral del 3 % sobre votos válidos, incluido el blanco."}{" "}
            No introduzcas abstención o indecisión como votos válidos.
          </p>
        </form>
      </div>
      <div className="simulation-output" aria-live="polite">
        <div className="panel-head">
          <h3>Reparto de {selected.name}</h3>
          <span>
            {selected.seats} escaño{selected.seats === 1 ? "" : "s"}
          </span>
        </div>
        {result ? (
          <div className="simulation-result">
            <span className="pill">
              ESCENARIO HIPOTÉTICO · NO ES UNA PREDICCIÓN
            </span>
            {result.status === "empty" ? (
              <>
                <h3>Sin votos asignables</h3>
                <p>
                  No hay alternativas con votos que cumplan las condiciones del
                  reparto.
                </p>
              </>
            ) : (
              <>
                <h3>
                  {result.status === "tie"
                    ? "Reparto pendiente de desempate"
                    : "El reparto de tu escenario"}
                </h3>
                {result.status === "tie" && result.tie && (
                  <div className="tie-message">
                    <p>
                      Empate en el escaño {result.tie.seat} entre{" "}
                      {result.tie.candidates
                        .map((id) => `Hipótesis ${id}`)
                        .join(" y ")}
                      . No asignamos un ganador arbitrario.
                    </p>
                    {result.tie.manualDecisionSupported ? (
                      <>
                        <p>
                          Para explorar el escenario, indica quién ganaría el
                          primer sorteo. Los sucesivos empates de esta pareja se
                          alternarán. Esta elección manual no es un sorteo
                          electoral oficial.
                        </p>
                        <div className="tie-buttons">
                          {result.tie.candidates.map((id) => (
                            <button
                              key={id}
                              type="button"
                              className="text-button"
                              onClick={() =>
                                calculate({
                                  ...drawWinners,
                                  [result.tie!.key]: id,
                                })
                              }
                            >
                              Suponer ganador {id} →
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p>
                        Este empate requiere resolución externa. No se completa
                        automáticamente el reparto.
                      </p>
                    )}
                  </div>
                )}
                <div className="seat-bars">
                  {values.map((_, i) => {
                    const id = alphabet[i],
                      seats = result.allocation[id] ?? 0;
                    return (
                      <div className="seat-row" key={id}>
                        <span className={`candidate-chip c${i % 6}`}>{id}</span>
                        <span>
                          Hipótesis {id}
                          {result.excluded.includes(id) && (
                            <small>Sin votos o bajo umbral</small>
                          )}
                        </span>
                        <div className="seat-track">
                          <div
                            className={`seat-fill c${i % 6}`}
                            style={{
                              width: `${(seats / selected.seats) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>{seats}</strong>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(drawWinners).length > 0 && (
                  <p className="scenario-warning">
                    Incluye un supuesto manual de desempate. No es un resultado
                    oficial.
                  </p>
                )}
                <p className="denominator-note">
                  {mode === "percent"
                    ? `${fmt(result.validVotes / 100)} % del total introducido son votos válidos.`
                    : `Denominador legal: ${fmt(result.validVotes)} votos válidos.`}{" "}
                  El nulo no se incluye.{" "}
                  {result.status === "tie"
                    ? "Las barras muestran únicamente los escaños ya resueltos."
                    : ""}
                </p>
                <details className="quotient-details">
                  <summary>
                    Ver los cocientes adjudicados ({result.trace.length})
                  </summary>
                  <div className="table-scroll">
                    <table>
                      <caption>Pasos del reparto matemático</caption>
                      <thead>
                        <tr>
                          <th>Escaño</th>
                          <th>Alternativa</th>
                          <th>Divisor</th>
                          <th>
                            Cociente{mode === "percent" ? " (peso ×100)" : ""}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trace.map((row) => (
                          <tr key={row.seat}>
                            <td>{row.seat}</td>
                            <td>Hipótesis {row.candidate}</td>
                            <td>{row.divisor}</td>
                            <td>{fmt(row.quotient)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </div>
        ) : (
          <div className="simulation-empty">
            <span aria-hidden="true">Σ</span>
            <h3>Las reglas, a la vista.</h3>
            <p>
              Introduce un escenario para ver cómo se distribuyen los escaños de
              esta circunscripción.
            </p>
            <p>
              Los datos de entrada son tuyos; el número de escaños procede del
              anexo del RD 806/2026.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
