import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LanguageContext } from "./language";
import type { Language } from "./language";

const STORAGE_KEY = "pension-language";

const pageMetadata: Record<Language, { title: string; description: string }> = {
  it: {
    title: "Italian Death Clock | Il conto della pensione",
    description: "Una storia visuale per capire il conto del sistema pensionistico italiano.",
  },
  en: {
    title: "Italian Death Clock | The pension bill",
    description: "A visual story explaining the bill behind Italy’s pension system.",
  },
};

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
