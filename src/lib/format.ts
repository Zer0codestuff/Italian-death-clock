import { useLanguage } from "./language";
import type { Language } from "./language";

const localeFor = (language: Language): string => language === "it" ? "it-IT" : "en-GB";

const unavailable = (language: Language): string => language === "it" ? "n.d." : "n/a";

export const euro = (value: number, compact = false, language: Language = "it"): string => {
  if (!Number.isFinite(value)) return unavailable(language);
  const locale = localeFor(language);
  if (compact && Math.abs(value) >= 1_000_000) {
    const suffix = language === "it" ? "mln €" : "€m";
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000_000)} ${suffix}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const numberIt = (value: number, digits = 1, language: Language = "it"): string =>
  Number.isFinite(value)
    ? new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: digits }).format(value)
    : unavailable(language);

export const percent = (value: number, digits = 1, language: Language = "it"): string =>
  Number.isFinite(value)
    ? `${new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: digits }).format(value * 100)}%`
    : unavailable(language);

export const percentPoints = (value: number, digits = 1, language: Language = "it"): string =>
  Number.isFinite(value)
    ? `${new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: digits }).format(value)}%`
    : unavailable(language);

export const millions = (value: number, digits = 1, language: Language = "it"): string =>
  `${numberIt(value, digits, language)} ${language === "it" ? "mln" : "million"}`;

export const useLocalizedFormat = () => {
  const { language } = useLanguage();
  return {
    euro: (value: number, compact = false) => euro(value, compact, language),
    number: (value: number, digits = 1) => numberIt(value, digits, language),
    percent: (value: number, digits = 1) => percent(value, digits, language),
    percentPoints: (value: number, digits = 1) => percentPoints(value, digits, language),
    millions: (value: number, digits = 1) => millions(value, digits, language),
  };
};
