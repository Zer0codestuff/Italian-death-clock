import { describe, expect, it } from "vitest";
import italy from "../../public/data/italy.json";
import international from "../../public/data/international.json";

type Source = { id: string; url: string };

describe("research data integrity", () => {
  it("keeps source ids unique and links authoritative URLs", () => {
    const italySources = italy.sourceCatalog as Source[];
    const internationalSources = Object.entries(international.sourceCatalog).map(([id, source]) => ({ id, ...source })) as Source[];
    const all = [...italySources, ...internationalSources];
    expect(new Set(all.map((source) => source.id)).size).toBe(all.length);
    expect(all.every((source) => source.url.startsWith("https://"))).toBe(true);
  });

  it("gives headline metrics a live source id", () => {
    const sourceIds = new Set((italy.sourceCatalog as Source[]).map((source) => source.id));
    const metricRows = italy.headlineMetrics as Array<{ sourceId?: string; status?: string }>;
    expect(metricRows.length).toBeGreaterThan(5);
    expect(metricRows.every((metric) => metric.sourceId && sourceIds.has(metric.sourceId))).toBe(true);
    expect(metricRows.some((metric) => metric.status === "official_projection")).toBe(true);
  });

  it("keeps international metric values inside the four-country perimeter", () => {
    const countryCodes = new Set(["IT", "CH", "SE", "NL"]);
    for (const metric of international.comparableMetrics as Array<{ values: Record<string, unknown> }>) {
      expect(Object.keys(metric.values).every((code) => countryCodes.has(code))).toBe(true);
    }
  });
});

