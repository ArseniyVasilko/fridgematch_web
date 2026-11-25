/** Helpers for the recipe results URL (/recipes?i=egg,rice&pantry=1&missing=2 ...). */

import { LIMITS } from "./constants";

export type SearchParams = Record<string, string | string[] | undefined>;

/** List value for "turned off for this search" when the profile has saved values (diet=none). */
export const NONE = "none";

/**
 * The filter form's fields as a tidy query: the browser sends a checkbox's
 * hidden fallback ("basics=0&basics=1") and NONE next to real values
 * ("diet=none&diet=vegan"). Keeps "1" over "0", drops NONE when there are
 * other values, drops empty fields and joins repeats with commas, which the
 * page reads the same way.
 */
export function cleanQuery(entries: Iterable<[string, FormDataEntryValue]>): URLSearchParams {
  const byKey = new Map<string, string[]>();
  for (const [key, value] of entries) {
    if (typeof value !== "string" || value === "") continue;
    const values = byKey.get(key) ?? [];
    if (!values.includes(value)) values.push(value);
    byKey.set(key, values);
  }
  const out = new URLSearchParams();
  for (const [key, all] of byKey) {
    let values = all.includes("1") && all.includes("0") ? all.filter((v) => v !== "0") : all;
    if (values.length > 1) values = values.filter((v) => v !== NONE);
    out.set(key, values.join(","));
  }
  return out;
}

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** "egg, rice,onion" -> ["egg", "rice", "onion"] (deduplicated, at most `max`). */
export function parseIngredientList(v: string | string[] | undefined, max: number = LIMITS.ingredientsPerList): string[] {
  const raw = Array.isArray(v) ? v.join(",") : (v ?? "");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().replace(/\s+/g, " ").slice(0, LIMITS.ingredientNameLength);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= max) break;
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
