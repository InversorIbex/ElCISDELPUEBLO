export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function displayName(name: string) {
  const parts = name.split(", ");
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}
export function slugify(name: string) {
  return normalize(displayName(name)).replace(/ /g, "-");
}
export function municipalityPath(m: { code: string; name: string }) {
  return `/municipio/${m.code}/${slugify(m.name)}`;
}
