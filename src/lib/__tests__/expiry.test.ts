import { describe, expect, it } from "vitest";
import { expiryLabel, expiryStatus, parseDateInput, toDateInput } from "../expiry";

const now = new Date(2026, 8, 25, 18, 0); // 25 Sep 2026, evening
const day = (offset: number) => new Date(2026, 8, 25 + offset, 9, 0);

describe("expiryStatus", () => {
  it.each([
    [null, "none"],
    [day(-2), "expired"],
    [day(0), "today"],
    [day(1), "soon"],
    [day(3), "soon"],
    [day(4), "fresh"],
  ] as const)("%s -> %s", (date, status) => {
    expect(expiryStatus(date, now)).toBe(status);
  });
});

describe("expiryLabel", () => {
  it("reads naturally", () => {
    expect(expiryLabel(day(1), now)).toBe("Expires tomorrow");
    expect(expiryLabel(day(-1), now)).toBe("Expired yesterday");
    expect(expiryLabel(day(5), now)).toBe("Expires in 5 days");
  });
});

describe("date input helpers", () => {
  it("round-trips", () => {
    const d = parseDateInput("2026-10-03");
    expect(d && toDateInput(d)).toBe("2026-10-03");
    expect(parseDateInput("nope")).toBeNull();
  });
});
