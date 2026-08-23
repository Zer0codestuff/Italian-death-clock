import { describe, expect, it } from "vitest";
import { SIMULATOR_ANNOUNCE_DELAY_MS } from "./useDebouncedValue";

describe("simulator announcements", () => {
  it("uses a short moderation window while keeping visible updates independent", () => {
    expect(SIMULATOR_ANNOUNCE_DELAY_MS).toBeGreaterThanOrEqual(180);
    expect(SIMULATOR_ANNOUNCE_DELAY_MS).toBeLessThan(500);
  });
});
