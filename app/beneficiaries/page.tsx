"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

import * as AfricaLibrary from "../lib/africa";
import * as ProvidersLibrary from "../lib/providers";

/* ============================================================
   TYPES
============================================================ */

type Beneficiary = {
  id: string;
  user_id?: string;

  name: string;
  phone: string;

  // Human-readable country name stored in database
  country: string;

  // ISO country code, for example CF, CM, SN, NG
  country_code?: string;

  relationship: string;
  provider: string;

  created_at?: string;
};

type CountryRecord = {
  code: string;

  name?: string;
  nameEn?: string;
  nameFr?: string;

  currency?: string;
  currencyCode?: string;
  currencies?: string[];

  [key: string]: unknown;
};

type ProviderRecord = {
  id: string;

  name?: string;
  nameEn?: string;
  nameFr?: string;
  displayName?: string;

  type?: string;

  country?: string;
  countryCode?: string;

  countries?: string[];
  supportedCountries?: string[];

  currency?: string;
  currencies?: string[];

  status?: string;
  enabled?: boolean;

  [key: string]: unknown;
};

/* ============================================================
   LIBRARY ADAPTERS

   These adapters allow this page to continue working even if
   africa.ts/providers.ts expose slightly different registry names.
============================================================ */

const africaModule =
  AfricaLibrary as unknown as Record<string, unknown>;

const providersModule =
  ProvidersLibrary as unknown as Record<string, unknown>;

/* ============================================================
   COUNTRY HELPERS
============================================================ */

function readCountries(): CountryRecord[] {
  const possibleCountryLists = [
    africaModule.AFRICAN_COUNTRIES,
    africaModule.COUNTRIES,
    africaModule.africanCountries,
    africaModule.countries,
  ];

  const countryList =
    possibleCountryLists.find(Array.isArray);

  if (!Array.isArray(countryList)) {
    return [];
  }

  return countryList
    .map((country) => country as CountryRecord)
    .filter(
      (country) =>
        typeof country.code === "string" &&
        country.code.trim().length > 0
    );
}

function getLocalizedCountryName(
  country: CountryRecord,
  language: string
): string {
  const getCountryName =
    africaModule.getCountryName;

  if (typeof getCountryName === "function") {
    try {
      const localizedName = (
        getCountryName as (
          country: CountryRecord,
          language?: string
        ) => unknown
      )(country, language);

      if (
        typeof localizedName === "string" &&
        localizedName.trim()
      ) {
        return localizedName;
      }
    } catch {
      // Continue with fallback fields.
    }
  }

  if (language === "fr") {
    return (
      country.nameFr ||
      country.name ||
      country.nameEn ||
      country.code
    );
  }

  return (
    country.nameEn ||
    country.name ||
    country.nameFr ||
    country.code
  );
}

function getCountryCurrency(
  country?: CountryRecord
): string {
  if (!country) {
    return "";
  }

  if (
    typeof country.currency === "string" &&
    country.currency.trim()
  ) {
    return country.currency;
  }

  if (
    typeof country.currencyCode === "string" &&
    country.currencyCode.trim()
  ) {
    return country.currencyCode;
  }

  if (
    Array.isArray(country.currencies) &&
    country.currencies.length > 0
  ) {
    return country.currencies[0];
  }

  return "";
}

/* ============================================================
   PROVIDER HELPERS
============================================================ */

function readAllProviders(): ProviderRecord[] {
  const possibleProviderLists = [
    providersModule.PAYMENT_PROVIDERS,
    providersModule.PROVIDERS,
    providersModule.providers,
    providersModule.paymentProviders,
  ];

  const providerList =
    possibleProviderLists.find(Array.isArray);

  if (!Array.isArray(providerList)) {
    return [];
  }

  return providerList
    .map(
      (provider) =>
        provider as ProviderRecord
    )
    .filter(
      (provider) =>
        typeof provider.id === "string" &&
        provider.id.trim().length > 0
    );
}

function getLocalizedProviderName(
  provider: ProviderRecord,
  language: string
): string {
  const getProviderName =
    providersModule.getProviderName;

  if (typeof getProviderName === "function") {
    try {
      const localizedName = (
        getProviderName as (
          provider: ProviderRecord,
          language?: string
        ) => unknown
      )(provider, language);

      if (
        typeof localizedName === "string" &&
        localizedName.trim()
      ) {
        return localizedName;
      }
    } catch {
      // Continue with fallback fields.
    }
  }

  if (language === "fr") {
    return (
      provider.nameFr ||
      provider.displayName ||
      provider.name ||
      provider.nameEn ||
      provider.id
    );
  }

  return (
    provider.nameEn ||
    provider.displayName ||
    provider.name ||
    provider.nameFr ||
    provider.id
  );
}

function getProvidersForCountry(
  countryCode: string
): ProviderRecord[] {
  if (!countryCode) {
    return [];
  }

  const helperNames = [
    "getProvidersByCountry",
    "getProvidersForCountry",
    "findProvidersByCountry",
  ];

  for (const helperName of helperNames) {
    const helper =
      providersModule[helperName];

    if (typeof helper === "function") {
      try {
        const result = (
          helper as (
            countryCode: string
          ) => unknown
        )(countryCode);

        if (Array.isArray(result)) {
          return result as ProviderRecord[];
        }
      } catch {
        // Continue to registry fallback.
      }
    }
  }

  const normalizedCountryCode =
    countryCode.toUpperCase();

  return readAllProviders().filter(
    (provider) => {
      const singleCountry =
        provider.countryCode ||
        provider.country;

      const countryLists = [
        provider.countries,
        provider.supportedCountries,
      ].filter(
        Array.isArray
      ) as string[][];

      const matchesSingleCountry =
        typeof singleCountry === "string" &&
        singleCountry.toUpperCase() ===
          normalizedCountryCode;

      const matchesCountryList =
        countryLists.some((list) =>
          list.some(
            (code) =>
              typeof code === "string" &&
              code.toUpperCase() ===
                normalizedCountryCode
          )
        );

      const isEnabled =
        provider.enabled !== false &&
        provider.status !== "inactive" &&
        provider.status !== "disabled";

      return (
        isEnabled &&
        (matchesSingleCountry ||
          matchesCountryList)
      );
    }
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function BeneficiariesPage() {
  const { language } = useLanguage();

  /* ----------------------------------------------------------
     DATA
  ---------------------------------------------------------- */

  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // This state intentionally stores the ISO code.
  // Example: CF, CM, SN, NG.
  const [country, setCountry] = useState("");

  const [relationship, setRelationship] =
    useState("");

  const [provider, setProvider] =
    useState("");

  /* ----------------------------------------------------------
     UI STATE
  ---------------------------------------------------------- */

  const [search, setSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ==========================================================
     COUNTRIES
  ========================================================== */

  const countries = useMemo(() => {
    return [...readCountries()].sort(
      (a, b) =>
        getLocalizedCountryName(
          a,
          language
        ).localeCompare(
          getLocalizedCountryName(
            b,
            language
          ),
          language === "fr"
            ? "fr"
            : "en"
        )
    );
  }, [language]);

  const selectedCountry =
    useMemo(() => {
      return countries.find(
        (item) =>
          item.code.toUpperCase() ===
          country.toUpperCase()
      );
    }, [countries, country]);

  const currency = useMemo(() => {
    return getCountryCurrency(
      selectedCountry
    );
  }, [selectedCountry]);

  /* ==========================================================
     PROVIDERS
  ========================================================== */

  const availableProviders =
    useMemo(() => {
      return getProvidersForCountry(
        country
      ).sort((a, b) =>
        getLocalizedProviderName(
          a,
          language
        ).localeCompare(
          getLocalizedProviderName(
            b,
            language
          ),
          language === "fr"
            ? "fr"
            : "en"
        )
      );
    }, [country, language]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const filteredBeneficiaries =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return beneficiaries;
      }

      return beneficiaries.filter(
        (beneficiary) => {
          const searchableText = [
            beneficiary.name,
            beneficiary.phone,
            beneficiary.country,
            beneficiary.country_code,
            beneficiary.relationship,
            beneficiary.provider,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch
          );
        }
      );
    }, [beneficiaries, search]);

  /* ==========================================================
     DISPLAY COUNTRY
  ========================================================== */

  const resolveCountryName =
    useCallback(
      (
        countryValue: string
      ): string => {
        if (!countryValue) {
          return "";
        }

        const matchingCountry =
          countries.find(
            (item) =>
              item.code.toUpperCase() ===
              countryValue.toUpperCase()
          );

        return matchingCountry
          ? getLocalizedCountryName(
              matchingCountry,
              language
            )
          : countryValue;
      },
      [countries, language]
    );

  /* ==========================================================
     DISPLAY PROVIDER
  ========================================================== */

  const resolveProviderName =
    useCallback(
      (
        providerValue: string
      ): string => {
        const matchingProvider =
          readAllProviders().find(
            (item) =>
              item.id === providerValue ||
              item.name ===
                providerValue ||
              item.nameEn ===
                providerValue ||
              item.nameFr ===
                providerValue ||
              item.displayName ===
                providerValue
          );

        return matchingProvider
          ? getLocalizedProviderName(
              matchingProvider,
              language
            )
          : providerValue;
      },
      [language]
    );

  /* ==========================================================
     LOAD BENEFICIARIES
  ========================================================== */

  const fetchBeneficiaries =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        setErrorMessage(
          sessionError.message
        );

        setIsLoading(false);
        return;
      }

      if (!session) {
        setBeneficiaries([]);

        setErrorMessage(
          language === "fr"
            ? "Veuillez vous connecter pour consulter vos bénéficiaires."
            : "Please sign in to view your beneficiaries."
        );

        setIsLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("beneficiaries")
          .select(
            `
              id,
              user_id,
              name,
              phone,
              country,
              country_code,
              relationship,
              provider,
              created_at
            `
          )
          .eq(
            "user_id",
            session.user.id
          )
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        setErrorMessage(
          error.message
        );

        setBeneficiaries([]);
      } else {
        setBeneficiaries(
          (data || []) as Beneficiary[]
        );
      }

      setIsLoading(false);
    }, [language]);

  useEffect(() => {
    void fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  /* ----------------------------------------------------------
     Reset provider whenever country changes.
  ---------------------------------------------------------- */

  useEffect(() => {
    setProvider("");
  }, [country]);

  /* ==========================================================
     RESET FORM
  ========================================================== */

  const resetForm = () => {
    setName("");
    setPhone("");
    setCountry("");
    setRelationship("");
    setProvider("");
  };

  /* ==========================================================
     SAVE BENEFICIARY
  ========================================================== */

  const saveBeneficiary =
    async () => {
      setMessage("");
      setErrorMessage("");

      const trimmedName =
        name.trim();

      const trimmedPhone =
        phone.trim();

      const trimmedRelationship =
        relationship.trim();

      if (
        !trimmedName ||
        !trimmedPhone ||
        !country ||
        !provider
      ) {
        setErrorMessage(
          language === "fr"
            ? "Veuillez remplir le nom, le téléphone, le pays et le fournisseur."
            : "Please complete the name, phone, country, and provider fields."
        );

        return;
      }

      /* ------------------------------------------------------
         Validate selected country
      ------------------------------------------------------ */

      const selectedCountryRecord =
        countries.find(
          (item) =>
            item.code.toUpperCase() ===
            country.toUpperCase()
        );

      if (!selectedCountryRecord) {
        setErrorMessage(
          language === "fr"
            ? "Le pays sélectionné est invalide."
            : "The selected country is invalid."
        );

        return;
      }

      const countryCode =
        selectedCountryRecord.code
          .trim()
          .toUpperCase();

      /*
       * Store a stable readable country name.
       *
       * Prefer the library's English/base name for database
       * consistency instead of changing the stored database
       * value whenever the user changes UI language.
       *
       * country_code remains the authoritative machine-readable
       * identifier used by Pharmacy and other services.
       */
      const countryName =
        (
          selectedCountryRecord.nameEn ||
          selectedCountryRecord.name ||
          selectedCountryRecord.nameFr ||
          countryCode
        ).trim();

      /* ------------------------------------------------------
         Session
      ------------------------------------------------------ */

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        setErrorMessage(
          sessionError.message
        );

        return;
      }

      if (!session) {
        setErrorMessage(
          language === "fr"
            ? "Vous devez être connecté pour enregistrer un bénéficiaire."
            : "You must be signed in to save a beneficiary."
        );

        return;
      }

      setIsSaving(true);

      /* ------------------------------------------------------
         INSERT

         country      = readable name
         country_code = ISO code
      ------------------------------------------------------ */

      const { error } =
        await supabase
          .from("beneficiaries")
          .insert([
            {
              user_id:
                session.user.id,

              name:
                trimmedName,

              phone:
                trimmedPhone,

              country:
                countryName,

              country_code:
                countryCode,

              relationship:
                trimmedRelationship,

              provider,
            },
          ]);

      setIsSaving(false);

      if (error) {
        setErrorMessage(
          error.message
        );

        return;
      }

      resetForm();

      await fetchBeneficiaries();

      setMessage(
        language === "fr"
          ? "Bénéficiaire enregistré avec succès."
          : "Beneficiary saved successfully."
      );
    };

  /* ==========================================================
     DELETE BENEFICIARY
  ========================================================== */

  const deleteBeneficiary =
    async (
      beneficiary: Beneficiary
    ) => {
      const confirmed =
        window.confirm(
          language === "fr"
            ? `Supprimer ${beneficiary.name} de vos bénéficiaires ?`
            : `Delete ${beneficiary.name} from your beneficiaries?`
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        beneficiary.id
      );

      setMessage("");
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        setErrorMessage(
          sessionError.message
        );

        setDeletingId(null);

        return;
      }

      if (!session) {
        setErrorMessage(
          language === "fr"
            ? "Vous devez être connecté."
            : "You must be signed in."
        );

        setDeletingId(null);

        return;
      }

      const { error } =
        await supabase
          .from("beneficiaries")
          .delete()
          .eq(
            "id",
            beneficiary.id
          )
          .eq(
            "user_id",
            session.user.id
          );

      setDeletingId(null);

      if (error) {
        setErrorMessage(
          error.message
        );

        return;
      }

      await fetchBeneficiaries();

      setMessage(
        language === "fr"
          ? "Bénéficiaire supprimé."
          : "Beneficiary deleted."
      );
    };

  /* ==========================================================
     PAGE UI
  ========================================================== */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* ==================================================
              ADD BENEFICIARY
          ================================================== */}

          <section className="mb-8 rounded-3xl bg-white p-6 shadow-lg sm:p-8">

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-green-700 sm:text-4xl">
                {language === "fr"
                  ? "Bénéficiaires"
                  : "Beneficiaries"}
              </h1>

              <p className="mt-2 text-gray-600">
                {language === "fr"
                  ? "Ajoutez une personne à qui vous pourrez envoyer de l’argent ou effectuer un paiement."
                  : "Add someone you can send money to or pay through NdakoCare."}
              </p>
            </div>

            {/* SUCCESS */}

            {message && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800"
              >
                {message}
              </div>
            )}

            {/* ERROR */}

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">

              {/* NAME */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Nom complet"
                    : "Full name"}
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder={
                    language === "fr"
                      ? "Nom du bénéficiaire"
                      : "Beneficiary name"
                  }
                  autoComplete="name"
                  className="rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>

              {/* PHONE */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Téléphone"
                    : "Phone number"}
                </span>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder={
                    language === "fr"
                      ? "Exemple : +236..."
                      : "Example: +236..."
                  }
                  autoComplete="tel"
                  className="rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>

              {/* COUNTRY */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Pays"
                    : "Country"}
                </span>

                <select
                  value={country}
                  onChange={(event) =>
                    setCountry(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    {language === "fr"
                      ? "Choisir un pays"
                      : "Select a country"}
                  </option>

                  {countries.map(
                    (
                      countryOption
                    ) => (
                      <option
                        key={
                          countryOption.code
                        }
                        value={
                          countryOption.code
                        }
                      >
                        {getLocalizedCountryName(
                          countryOption,
                          language
                        )}
                      </option>
                    )
                  )}
                </select>

                {selectedCountry && (
                  <span className="text-sm text-gray-500">
                    ISO:{" "}
                    {selectedCountry.code.toUpperCase()}
                  </span>
                )}
              </label>

              {/* RELATIONSHIP */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Relation"
                    : "Relationship"}
                </span>

                <input
                  type="text"
                  value={relationship}
                  onChange={(event) =>
                    setRelationship(
                      event.target.value
                    )
                  }
                  placeholder={
                    language === "fr"
                      ? "Exemple : Parent, ami ou collègue"
                      : "Example: Parent, friend, or coworker"
                  }
                  className="rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>

              {/* PROVIDER */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Fournisseur"
                    : "Provider"}
                </span>

                <select
                  value={provider}
                  onChange={(event) =>
                    setProvider(
                      event.target.value
                    )
                  }
                  disabled={!country}
                  className="rounded-xl border border-gray-300 bg-white p-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    {!country
                      ? language === "fr"
                        ? "Choisissez d’abord un pays"
                        : "Select a country first"
                      : language === "fr"
                        ? "Choisir un fournisseur"
                        : "Select a provider"}
                  </option>

                  {availableProviders.map(
                    (
                      providerOption
                    ) => (
                      <option
                        key={
                          providerOption.id
                        }
                        value={
                          providerOption.id
                        }
                      >
                        {getLocalizedProviderName(
                          providerOption,
                          language
                        )}
                      </option>
                    )
                  )}
                </select>

                {country &&
                  availableProviders.length ===
                    0 && (
                    <span className="text-sm text-amber-700">
                      {language === "fr"
                        ? "Aucun fournisseur n’est configuré pour ce pays dans providers.ts."
                        : "No provider is configured for this country in providers.ts."}
                    </span>
                  )}
              </label>

              {/* CURRENCY */}

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Devise"
                    : "Currency"}
                </span>

                <input
                  type="text"
                  value={currency}
                  readOnly
                  placeholder={
                    language === "fr"
                      ? "Sélection automatique"
                      : "Selected automatically"
                  }
                  className="rounded-xl border border-gray-300 bg-gray-100 p-3 text-gray-700"
                />
              </label>

            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={
                saveBeneficiary
              }
              disabled={isSaving}
              className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isSaving
                ? language === "fr"
                  ? "Enregistrement..."
                  : "Saving..."
                : language === "fr"
                  ? "Enregistrer le bénéficiaire"
                  : "Save beneficiary"}
            </button>

          </section>

          {/* ==================================================
              BENEFICIARY LIST
          ================================================== */}

          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-green-700">
                  {language === "fr"
                    ? "Mes bénéficiaires"
                    : "My beneficiaries"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {language === "fr"
                    ? `${beneficiaries.length} bénéficiaire(s)`
                    : `${beneficiaries.length} beneficiary or beneficiaries`}
                </p>
              </div>

              {/* SEARCH */}

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  language === "fr"
                    ? "Rechercher..."
                    : "Search beneficiaries..."
                }
                className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 md:max-w-sm"
              />

            </div>

            {/* LOADING */}

            {isLoading ? (
              <p className="text-gray-500">
                {language === "fr"
                  ? "Chargement des bénéficiaires..."
                  : "Loading beneficiaries..."}
              </p>

            ) : beneficiaries.length ===
              0 ? (

              /* EMPTY */

              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">

                <p className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Aucun bénéficiaire enregistré."
                    : "No beneficiaries have been saved."}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {language === "fr"
                    ? "Utilisez le formulaire ci-dessus pour ajouter votre premier bénéficiaire."
                    : "Use the form above to add your first beneficiary."}
                </p>

              </div>

            ) : filteredBeneficiaries.length ===
              0 ? (

              /* SEARCH EMPTY */

              <p className="text-gray-500">
                {language === "fr"
                  ? "Aucun bénéficiaire ne correspond à votre recherche."
                  : "No beneficiaries match your search."}
              </p>

            ) : (

              /* BENEFICIARY CARDS */

              <div className="grid gap-4 md:grid-cols-2">

                {filteredBeneficiaries.map(
                  (
                    beneficiary
                  ) => (

                    <article
                      key={
                        beneficiary.id
                      }
                      className="rounded-2xl border border-gray-200 p-5 transition hover:border-green-300 hover:shadow-md"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <h3 className="truncate text-lg font-bold text-gray-900">
                            {
                              beneficiary.name
                            }
                          </h3>

                          <p className="mt-1 text-gray-700">
                            {
                              beneficiary.phone
                            }
                          </p>

                        </div>

                        <div
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700"
                        >
                          {beneficiary.name
                            ?.trim()
                            .charAt(0)
                            .toUpperCase() ||
                            "B"}
                        </div>

                      </div>

                      <dl className="mt-4 space-y-2 text-sm">

                        {/* COUNTRY */}

                        <div className="flex justify-between gap-4">

                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Pays"
                              : "Country"}
                          </dt>

                          <dd className="text-right font-medium text-gray-800">
                            {beneficiary.country_code
                              ? resolveCountryName(
                                  beneficiary.country_code
                                )
                              : beneficiary.country}
                          </dd>

                        </div>

                        {/* COUNTRY CODE */}

                        {beneficiary.country_code && (
                          <div className="flex justify-between gap-4">

                            <dt className="text-gray-500">
                              {language === "fr"
                                ? "Code pays"
                                : "Country code"}
                            </dt>

                            <dd className="text-right font-medium text-gray-800">
                              {beneficiary.country_code.toUpperCase()}
                            </dd>

                          </div>
                        )}

                        {/* PROVIDER */}

                        <div className="flex justify-between gap-4">

                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Fournisseur"
                              : "Provider"}
                          </dt>

                          <dd className="text-right font-medium text-green-700">
                            {resolveProviderName(
                              beneficiary.provider
                            )}
                          </dd>

                        </div>

                        {/* RELATIONSHIP */}

                        {beneficiary.relationship && (
                          <div className="flex justify-between gap-4">

                            <dt className="text-gray-500">
                              {language === "fr"
                                ? "Relation"
                                : "Relationship"}
                            </dt>

                            <dd className="text-right font-medium text-gray-800">
                              {
                                beneficiary.relationship
                              }
                            </dd>

                          </div>
                        )}

                      </dl>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteBeneficiary(
                            beneficiary
                          )
                        }
                        disabled={
                          deletingId ===
                          beneficiary.id
                        }
                        className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                      >
                        {deletingId ===
                        beneficiary.id
                          ? language === "fr"
                            ? "Suppression..."
                            : "Deleting..."
                          : language === "fr"
                            ? "Supprimer"
                            : "Delete"}
                      </button>

                    </article>
                  )
                )}

              </div>
            )}

          </section>

        </div>
      </main>
    </>
  );
}