import { describe, expect, it } from "vitest";
import { cleanQuery, parseList } from "../search-params";

const clean = (pairs: [string, string][]) => decodeURIComponent(cleanQuery(pairs).toString());

describe("cleanQuery", () => {
  it("keeps a ticked checkbox over its hidden fallback", () => {
    expect(clean([["basics", "0"], ["basics", "1"]])).toBe("basics=1");
    expect(clean([["basics", "0"]])).toBe("basics=0");
  });

  it("drops the 'none' marker when real values are ticked", () => {
    expect(clean([["diet", "none"], ["diet", "vegetarian"], ["diet", "vegan"]])).toBe("diet=vegetarian,vegan");
    expect(clean([["diet", "none"]])).toBe("diet=none");
  });

  it("drops empty fields and repeated values", () => {
    expect(clean([["q", ""], ["cuisine", ""], ["type", "main"], ["type", "main"], ["i", "egg,rice"]])).toBe("type=main&i=egg,rice");
  });

  it("gives lists the page reads back as the same values", () => {
    const sp = cleanQuery([["type", "main"], ["type", "side"]]);
    expect(parseList(sp.get("type")!, ["breakfast", "main", "side", "dessert"])).toEqual(["main", "side"]);
  });
});
