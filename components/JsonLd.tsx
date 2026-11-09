import { ldJson, type JsonLd as Node } from "@/lib/seo";
/** Datos estructurados schema.org para buscadores. */
export function JsonLd({ nodes }: { nodes: Node[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(...nodes) }} />;
}
