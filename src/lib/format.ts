export const euro = (value: number, compact = false): string => {
  if (!Number.isFinite(value)) return "n.d.";
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(value / 1_000_000)} mln €`;
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const numberIt = (value: number, digits = 1): string =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("it-IT", { maximumFractionDigits: digits }).format(value)
    : "n.d.";

export const percent = (value: number, digits = 1): string =>
  Number.isFinite(value)
    ? `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: digits }).format(value * 100)}%`
    : "n.d.";

export const percentPoints = (value: number, digits = 1): string =>
  Number.isFinite(value)
    ? `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: digits }).format(value)}%`
    : "n.d.";

export const millions = (value: number, digits = 1): string =>
  `${numberIt(value, digits)} mln`;

