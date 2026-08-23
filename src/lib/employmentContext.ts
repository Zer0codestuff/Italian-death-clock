import type { ItalyData } from "./types";

export type EmploymentContext = {
  valueMillions: number;
  year: number;
  sourceId: string;
  unit: string;
  perimeter: string;
};

export const deriveEmploymentContext = (italy: ItalyData): EmploymentContext | null => {
  const rows = Array.isArray(italy.spendingProjection?.baselineByYear)
    ? (italy.spendingProjection.baselineByYear as Array<Record<string, unknown>>)
    : [];
  const row = rows.find((candidate) => Number(candidate.year) === 2022 && Number(candidate.employmentThousands) > 0);
  if (!row) return null;
  return {
    valueMillions: Number(row.employmentThousands) / 1_000,
    year: Number(row.year),
    sourceId: String(row.sourceId ?? ""),
    unit: "milioni di persone, dato sorgente in migliaia",
    perimeter: "occupazione nel baseline Ageing Report, non contribuenti INPS",
  };
};
