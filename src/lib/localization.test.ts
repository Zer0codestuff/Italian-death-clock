import { describe, expect, it } from "vitest";
import { numberIt } from "./format";
import { sourceCardTitle, sourceMetadataLabel } from "./sourceMetadata";
import type { Source } from "./types";

const source: Source = {
  id: "example",
  title: "Example institutional source",
  publisher: "Example publisher",
  url: "https://example.com",
  publicationDate: "2024-02-01",
  updatedDate: "2026-03-01",
};

describe("localized interface helpers", () => {
  it("uses the selected number format", () => {
    expect(numberIt(12_345.5, 1, "it")).toBe("12.345,5");
    expect(numberIt(12_345.5, 1, "en")).toBe("12,345.5");
  });

  it("localizes source date labels", () => {
    expect(sourceMetadataLabel(source, "it")).toBe("aggiornata 2026 · pubblicata 2024");
    expect(sourceMetadataLabel(source, "en")).toBe("updated 2026 · published 2024");
  });

  it("uses source-pack titles in English", () => {
    expect(sourceCardTitle(source, "en")).toBe(source.title);
  });
});
