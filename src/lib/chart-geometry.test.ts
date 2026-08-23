import { describe, expect, it } from "vitest";
import { chartXForYear } from "./chartGeometry";

describe("chart year geometry", () => {
  it("places an intermediate year by its calendar distance", () => {
    const first = chartXForYear(2022, 2022, 2070);
    const peak = chartXForYear(2036, 2022, 2070);
    const last = chartXForYear(2070, 2022, 2070);
    expect(first).toBe(50);
    expect(last).toBe(696);
    expect(peak).toBeCloseTo(first + (last - first) * (14 / 48), 8);
    expect(peak).toBeGreaterThan(first);
    expect(peak).toBeLessThan(last);
  });
});
