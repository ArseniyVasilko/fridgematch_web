import { describe, expect, it } from "vitest";
import { combineMeasures, formatAmount, parseMeasure, toBaseAmount, toPantryAmount } from "../measure";

describe("parseMeasure", () => {
  it.each([
    ["2", { value: 2, unit: "count" }],
    ["2 large", { value: 2, unit: "count" }],
    ["200g", { value: 200, unit: "g" }],
    ["1 kg", { value: 1000, unit: "g" }],
    ["1/2 cup", { value: 120, unit: "ml" }],
    ["1 1/2 tbsp", { value: 4.5, unit: "tsp" }],
    ["½ tsp", { value: 0.5, unit: "tsp" }],
    ["1½ tbsp", { value: 4.5, unit: "tsp" }],
    ["500ml", { value: 500, unit: "ml" }],
  ])("parses %s", (input, expected) => {
    const r = parseMeasure(input);
    expect(r?.unit).toBe(expected.unit);
    expect(r?.value).toBeCloseTo(expected.value);
  });

  it.each(["to taste", "pinch", "Handful", "", "2 cloves", "3 slices"])("returns null for %s", (input) => {
    expect(parseMeasure(input)).toBeNull();
  });
});

describe("toBaseAmount", () => {
  it("treats no unit as a count", () => {
    expect(toBaseAmount(3, "")).toEqual({ value: 3, unit: "count" });
    expect(toBaseAmount(3, "pcs")).toEqual({ value: 3, unit: "count" });
  });
  it("converts units", () => {
    expect(toBaseAmount(1.5, "kg")).toEqual({ value: 1500, unit: "g" });
    expect(toBaseAmount(2, "tbsp")).toEqual({ value: 6, unit: "tsp" });
  });
  it("rejects bad input", () => {
    expect(toBaseAmount(0, "g")).toBeNull();
    expect(toBaseAmount(1, "bananas")).toBeNull();
  });
});

describe("formatAmount", () => {
  it.each([
    [{ value: 1, unit: "count" }, "1"],
    [{ value: 150, unit: "g" }, "150g"],
    [{ value: 120, unit: "ml" }, "120ml"],
    [{ value: 1.5, unit: "tsp" }, "1.5 tsp"],
    [{ value: 1 / 3, unit: "count" }, "0.33"],
  ] as const)("formats %o as %s", (amount, expected) => {
    expect(formatAmount(amount)).toBe(expected);
  });
});

describe("toPantryAmount", () => {
  it("maps measures to pantry units", () => {
    expect(toPantryAmount("2")).toEqual({ quantity: 2, unit: "pcs" });
    expect(toPantryAmount("1 kg")).toEqual({ quantity: 1000, unit: "g" });
    expect(toPantryAmount("300ml")).toEqual({ quantity: 300, unit: "ml" });
    expect(toPantryAmount("1 tbsp")).toEqual({ quantity: 3, unit: "tsp" });
  });
  it("leaves the amount empty when it can't be read", () => {
    expect(toPantryAmount("to taste")).toEqual({ quantity: null, unit: null });
  });
});

describe("combineMeasures", () => {
  it("keeps a single measure as it is", () => {
    expect(combineMeasures(["2 cloves"])).toBe("2 cloves");
    expect(combineMeasures(["", "1 tbsp"])).toBe("1 tbsp");
  });
  it("adds up measures with the same unit", () => {
    expect(combineMeasures(["1", "2"])).toBe("3");
    expect(combineMeasures(["200g", "0.1 kg"])).toBe("300g");
    expect(combineMeasures(["1 tbsp", "1 tsp"])).toBe("4 tsp");
  });
  it("joins measures it can't add up", () => {
    expect(combineMeasures(["1 clove", "2 cloves"])).toBe("1 clove + 2 cloves");
    expect(combineMeasures(["1", "100g"])).toBe("1 + 100g");
  });
});
