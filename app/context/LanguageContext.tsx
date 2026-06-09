"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

type LanguageContextType = {
  language: string;
  setLanguage: (value: string) => void;
};

const LanguageContext =
  createContext<LanguageContextType>({
    language: "en",
    setLanguage: () => {},
  });

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] =
    useState("en");

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}