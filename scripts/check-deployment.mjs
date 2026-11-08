import assert from "node:assert/strict";
const origin = "https://elcisdelpueblo.vercel.app";
async function get(path, expected = 200, method = "GET") {
  const response = await fetch(origin + path, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(25000),
  });
  assert.equal(response.status, expected, `${method} ${path}`);
  assert.equal(
    response.headers.get("set-cookie"),
    null,
    `No emitir credenciales en consulta/cierre: ${path}`,
  );
  return response;
}
const home = await (await get("/")).text();
assert.match(home, /EDICIÓN PÚBLICA INFORMATIVA/);
assert.ok(!home.includes("Participa ahora"));
assert.ok(home.includes("Ver mi circunscripción"));
const paths = [
  "/participar?comunidad=12",
  "/participar?provincia=27",
  "/resultados?provincia=27",
  "/ayuda",
  "/contacto",
  "/aviso-legal",
  "/privacidad",
  "/metodologia",
  "/fuentes",
  "/simulador",
  "/mapa",
  "/candidaturas?provincia=27",
];
for (const path of paths) {
  await get(path);
  console.log(`200 ${path}`);
}
const css = home.match(/href="([^" ]+\.css[^" ]*)"/)?.[1];
assert.ok(css?.startsWith("/_next/"));
assert.match((await get(css)).headers.get("content-type"), /text\/css/);
const image = await get("/opengraph-image");
assert.match(image.headers.get("content-type"), /image\/png/);
const bytes = new Uint8Array(await image.arrayBuffer());
assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
const status = await (await get("/api/participaciones")).json();
assert.equal(status.enabled, false);
const closed = await (await get("/api/participaciones", 423, "POST")).json();
assert.equal(closed.enabled, false);
const candidates = await (await get("/api/candidaturas?provincia=27")).json();
assert.equal(candidates.candidacies.length, 8);
assert.equal(candidates.participationEnabled, false);
assert.ok(candidates.candidacies.every((c) => c.provinceCode === "27"));
console.log(
  "Portada, rutas, CSS, imagen social PNG y cierre de participación verificados por HTTP. No sustituye pruebas de navegador.",
);

const ballot = await (await get("/participar?provincia=27")).text();
assert.ok(ballot.includes("Lugo"));
assert.ok(ballot.includes("VOTACIÓN TODAVÍA NO ABIERTA"));
assert.ok(ballot.includes("/logos/"));
assert.ok(ballot.includes("/resultados?provincia=27"));
const resultPage = await (await get("/resultados?provincia=27")).text();
assert.ok(resultPage.includes("SONDEO CIUDADANO"));
assert.ok(resultPage.includes("RESULTADO OFICIAL 2023"));
const legal = await (await get("/aviso-legal")).text();
assert.ok(legal.includes("Inversor_Ibex"));
assert.ok(!legal.includes("Manuel Lopez"));
console.log(
  "Flujo territorial, logos locales, alias público y separación de histórico/sondeo verificados.",
);
