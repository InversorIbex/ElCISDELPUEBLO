import { hemicyclePoints } from "@/lib/parliament";
export type SeatGroup = {
  id: string;
  name: string;
  seats: number;
  color: string;
};
export function Hemicycle({
  groups,
  unassigned = 0,
  label,
}: {
  groups: SeatGroup[];
  unassigned?: number;
  label: string;
}) {
  const assigned = groups.reduce((n, g) => n + g.seats, 0);
  if (assigned + unassigned !== 350)
    throw new Error("El hemiciclo debe sumar 350 escaños.");
  const colors = [
    ...groups.flatMap((g) => Array.from({ length: g.seats }, () => g)),
    ...Array.from({ length: unassigned }, () => ({
      id: "unassigned",
      name: "Sin modelizar",
      color: "#dce2d7",
      seats: unassigned,
    })),
  ];
  return (
    <figure className="hemicycle">
      <svg
        viewBox="0 0 420 250"
        role="img"
        aria-label={`${label}. ${assigned} escaños asignados y ${unassigned} sin modelizar.`}
      >
        {hemicyclePoints(350).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4.1} fill={colors[i].color}>
            <title>{colors[i].name}</title>
          </circle>
        ))}
        <text x="210" y="200" textAnchor="middle" className="hemicycle-number">
          {assigned}
        </text>
        <text x="210" y="222" textAnchor="middle" className="hemicycle-caption">
          DE 350 ESCAÑOS
        </text>
      </svg>
      <figcaption>{label}</figcaption>
      <div className="hemicycle-key">
        {groups
          .filter((g) => g.seats > 0)
          .map((g) => (
            <div key={g.id}>
              <span
                className="seat-color"
                style={{ background: g.color }}
                aria-hidden="true"
              />
              <span>{g.name}</span>
              <strong>{g.seats}</strong>
            </div>
          ))}
        {unassigned > 0 && (
          <div>
            <span
              className="seat-color"
              style={{ background: "#dce2d7" }}
              aria-hidden="true"
            />
            <span>Sin modelizar</span>
            <strong>{unassigned}</strong>
          </div>
        )}
      </div>
    </figure>
  );
}
