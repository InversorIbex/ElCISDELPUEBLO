import Link from "next/link";
import { TerritoryPage } from "@/components/TerritoryPage";
import {
  communities,
  municipalities,
  communityPath,
  displayName,
} from "@/lib/territories";
export const metadata = { title: "España · Directorio territorial" };
export default function Page() {
  return (
    <TerritoryPage
      name="España"
      kind="DIRECTORIO NACIONAL"
      municipalityCount={municipalities.length}
      breadcrumbs={[]}
    >
      <h2>Comunidades y ciudades autónomas</h2>
      <div className="province-cards">
        {communities.map((c) => (
          <Link key={c.code} href={communityPath(c)}>
            <span className="eyebrow">CÓDIGO {c.code}</span>
            <h3>{displayName(c.name)}</h3>
            <p>
              {municipalities
                .filter((m) => m.communityCode === c.code)
                .length.toLocaleString("es-ES", { useGrouping: "always" })}{" "}
              municipios <span>↗</span>
            </p>
          </Link>
        ))}
      </div>
    </TerritoryPage>
  );
}
