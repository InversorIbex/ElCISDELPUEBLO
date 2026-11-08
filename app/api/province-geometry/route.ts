import { NextResponse } from "next/server";
import { provinces } from "@/lib/territories";

// Public provincial polygons (Spanish government ArcGIS layer); the server, not the browser,
// retrieves and caches the external data. No location, vote or user identifiers are sent.
const SOURCE = "https://mapas.fomento.gob.es/arcgis/rest/services/SIU/ENTIDADES_TERRITORIALES_EGRN/MapServer/2/query";
type Geo = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
type GeoFeature = { type: "Feature"; properties?: Record<string, unknown>; geometry?: Geo };
function validRings(g: Geo | undefined): boolean {
  if (!g || !["Polygon", "MultiPolygon"].includes(g.type)) return false;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  if (!Array.isArray(polygons) || !polygons.length) return false;
  return polygons.every((poly) => Array.isArray(poly) && poly.every((ring: unknown) =>
    Array.isArray(ring) && ring.length >= 4 && ring.every((point: unknown) =>
      Array.isArray(point) && point.length >= 2 && typeof point[0] === "number" &&
      typeof point[1] === "number" && Number.isFinite(point[0]) && Number.isFinite(point[1])
    )
  ));
}
export async function GET() {
  const params = new URLSearchParams({
    where: "1=1", outFields: "CodINE,NAMEUNIT", returnGeometry: "true",
    outSR: "4326", f: "geojson", geometryPrecision: "3", maxAllowableOffset: "0.01"
  });
  try {
    const response = await fetch(`${SOURCE}?${params}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error("Official geometry endpoint unavailable");
    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object" || !("features" in raw) ||
        !Array.isArray(raw.features)) throw new Error("Invalid GeoJSON");
    const allowed = new Set(provinces.map(p => p.code));
    const seen = new Set<string>();
    const features = (raw.features as GeoFeature[]).flatMap(f => {
      const code = String(f?.properties?.CodINE ?? "").padStart(2, "0");
      if (!allowed.has(code) || seen.has(code) || !validRings(f.geometry)) return [];
      seen.add(code);
      return [{ code, name: String(f.properties?.NAMEUNIT ?? code), geometry: f.geometry }];
    });
    // If the upstream data is incomplete, never present it as a complete geographic map.
    if (features.filter(f => f.code !== "51" && f.code !== "52").length !== 50)
      throw new Error("Incomplete province boundaries");
    return NextResponse.json({ source: "Spanish government / IGN provincial boundaries", features },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ error: "La cartografía provincial no está disponible; utiliza el selector de circunscripciones." }, { status: 503 });
  }
}
