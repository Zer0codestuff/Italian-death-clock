import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "it" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const STORAGE_KEY = "pension-language";

const pageMetadata: Record<Language, { title: string; description: string }> = {
  it: {
    title: "Il conto della pensione",
    description: "Dati, simulazioni e confronti per capire come si distribuisce il rischio previdenziale.",
  },
  en: {
    title: "The pension bill",
    description: "Data, simulations and comparisons that show how pension risk is distributed.",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const getStoredLanguage = (): Language => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "it";
  } catch {
    return "it";
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // The interface still works when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const metadata = pageMetadata[language];
    document.documentElement.lang = language;
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", metadata.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", metadata.description);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
};

export const localeFor = (language: Language): string => language === "it" ? "it-IT" : "en-GB";
