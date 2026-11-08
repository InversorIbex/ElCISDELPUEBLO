"use client";
import { useState } from "react";
import { SeatSimulator } from "./SeatSimulator";
import { Hemicycle, type SeatGroup } from "./Hemicycle";
import {
  aggregateManualScenarios,
  type ManualDistrictScenario,
} from "@/lib/parliament";
type Constituency = {
  provinceCode: string;
  name: string;
  seats: number;
  system: string;
};
const colors = [
  "#476d7a",
  "#b57953",
  "#7a8e61",
  "#8d7798",
  "#a48c49",
  "#677f89",
  "#a06a79",
  "#77947d",
  "#756e62",
  "#506a83",
  "#8b9952",
  "#9b7d64",
];
export function ParliamentLab({
  constituencies,
  previousGroups,
}: {
  constituencies: Constituency[];
  previousGroups: SeatGroup[];
}) {
  const [scenarios, setScenarios] = useState<ManualDistrictScenario[]>([]);
  const [history, setHistory] = useState<
    { coverage: number; assigned: number; allocation: Record<string, number> }[]
  >([]);
  const current = aggregateManualScenarios(scenarios, constituencies);
  const groups = Object.entries(current.allocation)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, seats]) => ({
      id,
      name: `Hipótesis ${id}`,
      seats,
      color: colors[id.charCodeAt(0) - 65],
    }));
  function save(scenario: ManualDistrictScenario) {
    setScenarios((previous) => {
      const next = [
        ...previous.filter((s) => s.provinceCode !== scenario.provinceCode),
        scenario,
      ];
      aggregateManualScenarios(next, constituencies);
      return next;
    });
  }
  return (
    <>
      <div className="prose">
        <h2>Modeliza cada circunscripción.</h2>
        <p>
          Calcula una provincia y añádela al escenario nacional. Las letras A,
          B… son alternativas hipotéticas comunes a tu escenario; no se vinculan
          automáticamente a partidos reales. El resto de escaños permanece sin
          modelizar. No se extrapolan provincias sin cifras.
        </p>
        <p>
          El escenario y sus puntos se conservan solo en la memoria de esta
          página. Se pierden al recargar y no son respuestas al sondeo.
        </p>
      </div>
      <SeatSimulator constituencies={constituencies} onSaveScenario={save} />
      <section className="parliament-comparison">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              ESCENARIO MANUAL / COMPARACIÓN HISTÓRICA
            </div>
            <h2>La composición, con contexto.</h2>
            <p>
              {current.coverage} de 52 circunscripciones modelizadas ·{" "}
              {current.assigned} escaños calculados
            </p>
          </div>
          <button
            type="button"
            className="text-button"
            disabled={!scenarios.length}
            onClick={() => {
              setScenarios([]);
              setHistory([]);
            }}
          >
            Vaciar escenario nacional
          </button>
        </div>
        <div className="parliament-pair">
          <div className="parliament-panel">
            <span className="pill">
              HIPÓTESIS MANUAL ·{" "}
              {current.complete ? "COBERTURA COMPLETA" : "COBERTURA INCOMPLETA"}
            </span>
            <Hemicycle
              groups={groups}
              unassigned={current.unassigned}
              label="Tu escenario hipotético por circunscripción"
            />
          </div>
          <div className="parliament-panel">
            <span className="pill">RESULTADO OFICIAL · 23 JULIO 2023</span>
            <Hemicycle
              groups={previousGroups}
              label="Resultado electoral de 2023; candidaturas del BOE"
            />
          </div>
        </div>
        <p className="denominator-note">
          Los dos gráficos tienen 350 puntos para comparar estructuras. Las
          hipótesis A/B no equivalen a los partidos de 2023. No se atribuyen
          subidas o bajadas a partidos sin una correspondencia explícita y
          revisada.
        </p>
        <div className="modeled-districts">
          {scenarios.map((s) => (
            <span key={s.provinceCode}>
              {
                constituencies.find((c) => c.provinceCode === s.provinceCode)
                  ?.name
              }
              <button
                type="button"
                aria-label={`Quitar ${constituencies.find((c) => c.provinceCode === s.provinceCode)?.name} del escenario`}
                onClick={() =>
                  setScenarios((previous) =>
                    previous.filter((p) => p.provinceCode !== s.provinceCode),
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="scenario-history">
          <div className="section-head">
            <div>
              <h2>Evolución de tus escenarios.</h2>
              <p>Puntos manuales, no una serie histórica del sondeo.</p>
            </div>
            <button
              type="button"
              className="button"
              disabled={!scenarios.length || history.length >= 12}
              onClick={() =>
                setHistory((h) => [
                  ...h,
                  {
                    coverage: current.coverage,
                    assigned: current.assigned,
                    allocation: { ...current.allocation },
                  },
                ])
              }
            >
              Guardar punto de escenario →
            </button>
          </div>
          {history.length < 2 ? (
            <p className="chart-empty">
              Guarda al menos dos puntos de tus escenarios para comparar los
              escaños calculados de cada hipótesis. No se generan valores de
              ejemplo.
            </p>
          ) : (
            <>
              <svg
                viewBox="0 0 720 280"
                className="scenario-line-chart"
                role="img"
                aria-label="Evolución de escaños de escenarios introducidos manualmente"
              >
                {[0, 100, 200, 300, 350].map((n) => (
                  <g key={n}>
                    <line
                      x1="45"
                      y1={240 - (n / 350) * 205}
                      x2="690"
                      y2={240 - (n / 350) * 205}
                      stroke="#dce0dc"
                    />
                    <text x="8" y={244 - (n / 350) * 205}>
                      {n}
                    </text>
                  </g>
                ))}
                {Array.from(
                  new Set(history.flatMap((h) => Object.keys(h.allocation))),
                )
                  .sort()
                  .map((id) => (
                    <polyline
                      key={id}
                      fill="none"
                      stroke={colors[id.charCodeAt(0) - 65]}
                      strokeWidth="3"
                      points={history
                        .map(
                          (h, i) =>
                            `${45 + (i / (history.length - 1)) * 645},${240 - ((h.allocation[id] ?? 0) / 350) * 205}`,
                        )
                        .join(" ")}
                    >
                      <title>Hipótesis {id}</title>
                    </polyline>
                  ))}
                {history.map((_, i) => (
                  <text
                    key={i}
                    x={45 + (i / (history.length - 1)) * 645}
                    y="267"
                    textAnchor="middle"
                  >
                    {i + 1}
                  </text>
                ))}
              </svg>
              <div className="table-scroll">
                <table>
                  <caption>
                    Alternativa textual de los escenarios manuales; los cambios
                    de cobertura también afectan a las cifras
                  </caption>
                  <thead>
                    <tr>
                      <th>Punto</th>
                      <th>Provincias</th>
                      <th>Escaños modelizados</th>
                      <th>Reparto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{h.coverage}/52</td>
                        <td>{h.assigned}</td>
                        <td>
                          {Object.entries(h.allocation)
                            .map(([id, n]) => `${id}: ${n}`)
                            .join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
