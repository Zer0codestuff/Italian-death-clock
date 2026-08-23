import { describe, expect, it } from "vitest";
import italy from "../../public/data/italy.json";
import { deriveEmploymentContext } from "./employmentContext";
import type { ItalyData } from "./types";

describe("sourced employment context", () => {
  it("derives the displayed employment figure from the official baseline row", () => {
    const context = deriveEmploymentContext(italy as ItalyData);
    expect(context).toEqual({
      valueMillions: 23.181,
      year: 2022,
      sourceId: "ec_ageing_2024_italy",
      unit: "milioni di persone, dato sorgente in migliaia",
      perimeter: "occupazione nel baseline Ageing Report, non contribuenti INPS",
    });
    const source = (italy.sourceCatalog as Array<{ id: string; url: string }>).find((candidate) => candidate.id === context?.sourceId);
    expect(source?.url).toMatch(/^https:\/\//);
  });
});
