import { logoForCandidacy } from "@/lib/candidacies/logos";
import type { Candidacy } from "@/lib/candidacies/registry";
export function CandidacyList({ list }: { list: readonly Candidacy[] }) {
  return (
    <div className="candidacy-grid">
      {list.map((c) => {
        const logo = logoForCandidacy(c.officialName);
        return (
          <article className="candidacy-card" key={c.id}>
            <div className="candidacy-card-top">
              <span className="eyebrow">
                N.º {String(c.order).padStart(2, "0")} · CONGRESO
              </span>
              <span className="candidacy-status">Proclamada</span>
            </div>
            <div
              className={`candidacy-logo ${logo?.background === "dark" ? "logo-dark" : ""}`}
            >
              {logo ? (
                <img
                  src={logo.path}
                  width={200}
                  height={70}
                  alt={`Logotipo identificativo de ${c.officialName}`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="logo-missing">
                  Logo pendiente de verificación
                </span>
              )}
            </div>
            <h3>{c.officialName}</h3>
            <div className="candidacy-links">
              <a href={c.sourceUrl}>Consultar BOE ↗</a>
              {logo && <a href={logo.sourcePage}>Fuente del logo ↗</a>}
            </div>
            {c.correctionApplied && (
              <p className="candidacy-correction">
                Denominación corregida por el BOE del 7/11/2026.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
