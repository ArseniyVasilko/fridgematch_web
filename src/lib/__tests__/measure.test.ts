import { describe, expect, it } from "vitest";
import { parseMeasure, toBaseAmount } from "../measure";

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
