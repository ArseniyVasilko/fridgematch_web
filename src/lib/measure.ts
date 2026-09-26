/**
 * Very small parser for TheMealDB "measure" strings ("2 cloves", "1/2 cup",
 * "200g", "1 ½ tbsp"). Measures are free text, so this deliberately only
 * understands the common cases and returns null for anything else
 * ("to taste", "pinch", "handful"). Unparseable measures are simply treated
 * as "have it / don't have it" by the matcher.
 */

export type BaseUnit = "g" | "ml" | "tsp" | "count";

export interface Amount {
  value: number;
  unit: BaseUnit;
}

const UNIT_TABLE: Record<string, { unit: BaseUnit; factor: number }> = {
  g: { unit: "g", factor: 1 },
  gram: { unit: "g", factor: 1 },
  grams: { unit: "g", factor: 1 },
  gr: { unit: "g", factor: 1 },
  kg: { unit: "g", factor: 1000 },
  kilogram: { unit: "g", factor: 1000 },
  kilograms: { unit: "g", factor: 1000 },
  lb: { unit: "g", factor: 453.6 },
  lbs: { unit: "g", factor: 453.6 },
  oz: { unit: "g", factor: 28.35 },
  ml: { unit: "ml", factor: 1 },
  l: { unit: "ml", factor: 1000 },
  litre: { unit: "ml", factor: 1000 },
  litres: { unit: "ml", factor: 1000 },
  liter: { unit: "ml", factor: 1000 },
  liters: { unit: "ml", factor: 1000 },
  cup: { unit: "ml", factor: 240 },
  cups: { unit: "ml", factor: 240 },
  tsp: { unit: "tsp", factor: 1 },
  teaspoon: { unit: "tsp", factor: 1 },
  teaspoons: { unit: "tsp", factor: 1 },
  tbsp: { unit: "tsp", factor: 3 },
  tbs: { unit: "tsp", factor: 3 },
  tablespoon: { unit: "tsp", factor: 3 },
  tablespoons: { unit: "tsp", factor: 3 },
  pcs: { unit: "count", factor: 1 },
  pc: { unit: "count", factor: 1 },
  piece: { unit: "count", factor: 1 },
  pieces: { unit: "count", factor: 1 },
  x: { unit: "count", factor: 1 },
};

/** Units offered in the pantry form. */
export const PANTRY_UNITS = ["pcs", "g", "kg", "ml", "l", "tbsp", "tsp", "cup"] as const;

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅛": 0.125,
};

/** Parses the leading number: "1", "1.5", "1/2", "1 1/2", "1½", "½". */
function parseLeadingNumber(s: string): { value: number; rest: string } | null {
  // whole part (optional, not followed by "/"), then fraction, then unicode fraction
  const m = s.match(/^(\d+(?:[.,]\d+)?(?![\d/]))?\s*(?:(\d+)\/(\d+))?\s*([½⅓⅔¼¾⅛])?/);
  if (!m || (!m[1] && !m[2] && !m[4])) return null;
  let value = 0;
  if (m[1] && m[2]) {
    // "1 1/2"
    value = parseFloat(m[1].replace(",", ".")) + Number(m[2]) / Number(m[3]);
  } else if (m[2]) {
    value = Number(m[2]) / Number(m[3]);
  } else if (m[1]) {
    value = parseFloat(m[1].replace(",", "."));
  }
  if (m[4]) value += UNICODE_FRACTIONS[m[4]];
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, rest: s.slice(m[0].length).trim() };
}

/** Convert a quantity + unit (as typed in the pantry form) to a base amount. */
export function toBaseAmount(quantity: number, unit: string | null | undefined): Amount | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const key = (unit ?? "").trim().toLowerCase();
  if (!key) return { value: quantity, unit: "count" };
  const u = UNIT_TABLE[key];
  if (!u) return null;
  return { value: quantity * u.factor, unit: u.unit };
}

/** Parse a TheMealDB measure. Returns null if we cannot tell the amount. */
export function parseMeasure(measure: string | null | undefined): Amount | null {
  if (!measure) return null;
  const s = measure.trim().toLowerCase();
  const num = parseLeadingNumber(s);
  if (!num) return null;
  // "200g" / "200 g" / "2 cloves" / "2 large" / "2"
  const unitWord = num.rest.match(/^([a-z]+)\.?/)?.[1] ?? "";
  if (!unitWord) return { value: num.value, unit: "count" };
  const u = UNIT_TABLE[unitWord];
  if (u) return { value: num.value * u.factor, unit: u.unit };
  // words that still mean "this many of the thing"
  if (/^(large|medium|small|whole|fillet|fillets|breast|breasts|thigh|thighs|can|cans|tin|tins)$/.test(unitWord)) {
    return { value: num.value, unit: "count" };
  }
  return null;
}
