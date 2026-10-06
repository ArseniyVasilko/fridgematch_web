/** Helpers for the recipe results URL (/recipes?i=egg,rice&pantry=1&missing=2 ...). */

export type SearchParams = Record<string, string | string[] | undefined>;

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** "egg, rice,onion" -> ["egg", "rice", "onion"] (deduplicated, max 30). */
export function parseIngredientList(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v.join(",") : (v ?? "");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().replace(/\s+/g, " ").slice(0, 60);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 30) break;
  }
  return out;
}

/** "main,side" or ["main", "side"] -> the allowed values among them, deduplicated. */
export function parseList<T extends string>(v: string | string[] | undefined, allowed: readonly T[]): T[] {
  const values = (Array.isArray(v) ? v : [v ?? ""]).flatMap((s) => s.split(","));
  return allowed.filter((a) => values.includes(a));
}

export function recipesUrl(params: Record<string, string | number | boolean | null | undefined | string[]>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === false || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
    } else sp.set(k, v === true ? "1" : String(v));
  }
  const qs = sp.toString();
  return qs ? `/recipes?${qs}` : "/recipes";
}
