import { describe, expect, it } from "vitest";
import italy from "../../public/data/italy.json";
import international from "../../public/data/international.json";
import { sourceCardNote, sourceCardTitle, sourceMetadataLabel } from "./sourceMetadata";
import type { Source } from "./types";

describe("source metadata", () => {
  it("uses publication and update dates when an observed year is absent", () => {
    const source = (italy.sourceCatalog as Source[]).find((candidate) => candidate.id === "inps_retirement_age");
    expect(source).toBeDefined();
    expect(sourceMetadataLabel(source!)).toBe("aggiornata 2026 · pubblicata 2024");
    expect(sourceMetadataLabel(source!)).not.toContain("anno non indicato");
  });

  it("localizes every source-card title and note in the current packs", () => {
    const sources = [
      ...(italy.sourceCatalog as Source[]),
      ...Object.entries(international.sourceCatalog).map(([id, source]) => ({ ...source, id }) as Source),
    ];
    expect(sources.every((source) => sourceCardTitle(source) !== source.title)).toBe(true);
    expect(sources.every((source) => sourceCardNote(source).length > 20)).toBe(true);
  });
});
