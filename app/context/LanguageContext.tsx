"use client";

import {
  createContext,
  useContext,
  useEffect,
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

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("language");

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (
    value: string
  ) => {
    setLanguage(value);

    localStorage.setItem(
      "language",
      value
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage:
          changeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(
    LanguageContext
  );
}