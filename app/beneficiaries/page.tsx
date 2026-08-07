"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

import * as AfricaLibrary from "../lib/africa";
import * as ProvidersLibrary from "../lib/providers";

type Beneficiary = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  country: string;
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

const africaModule = AfricaLibrary as unknown as Record<string, unknown>;
const providersModule =
  ProvidersLibrary as unknown as Record<string, unknown>;

function readCountries(): CountryRecord[] {
  const possibleCountryLists = [
    africaModule.AFRICAN_COUNTRIES,
    africaModule.COUNTRIES,
    africaModule.africanCountries,
    africaModule.countries,
  ];

  const countryList = possibleCountryLists.find(Array.isArray);

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

function readAllProviders(): ProviderRecord[] {
  const possibleProviderLists = [
    providersModule.PAYMENT_PROVIDERS,
    providersModule.PROVIDERS,
    providersModule.providers,
    providersModule.paymentProviders,
  ];

  const providerList = possibleProviderLists.find(Array.isArray);

  if (!Array.isArray(providerList)) {
    return [];
  }

  return providerList
    .map((provider) => provider as ProviderRecord)
    .filter(
      (provider) =>
        typeof provider.id === "string" &&
        provider.id.trim().length > 0
    );
}

function getLocalizedCountryName(
  country: CountryRecord,
  language: string
): string {
  const getCountryName = africaModule.getCountryName;

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
      // Use the fallback fields below.
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

function getLocalizedProviderName(
  provider: ProviderRecord,
  language: string
): string {
  const getProviderName = providersModule.getProviderName;

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
      // Use the fallback fields below.
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
    const helper = providersModule[helperName];

    if (typeof helper === "function") {
      try {
        const result = (
          helper as (countryCode: string) => unknown
        )(countryCode);

        if (Array.isArray(result)) {
          return result as ProviderRecord[];
        }
      } catch {
        // Continue to the registry-based fallback.
      }
    }
  }

  const normalizedCountryCode = countryCode.toUpperCase();

  return readAllProviders().filter((provider) => {
    const singleCountry =
      provider.countryCode || provider.country;

    const countryLists = [
      provider.countries,
      provider.supportedCountries,
    ].filter(Array.isArray) as string[][];

    const matchesSingleCountry =
      typeof singleCountry === "string" &&
      singleCountry.toUpperCase() === normalizedCountryCode;

    const matchesCountryList = countryLists.some((list) =>
      list.some(
        (code) =>
          typeof code === "string" &&
          code.toUpperCase() === normalizedCountryCode
      )
    );

    const isEnabled =
      provider.enabled !== false &&
      provider.status !== "inactive" &&
      provider.status !== "disabled";

    return (
      isEnabled &&
      (matchesSingleCountry || matchesCountryList)
    );
  });
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

export default function BeneficiariesPage() {
  const { language } = useLanguage();

  const [beneficiaries, setBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [relationship, setRelationship] = useState("");
  const [provider, setProvider] = useState("");

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const countries = useMemo(() => {
    return [...readCountries()].sort((a, b) =>
      getLocalizedCountryName(a, language).localeCompare(
        getLocalizedCountryName(b, language),
        language === "fr" ? "fr" : "en"
      )
    );
  }, [language]);

  const selectedCountry = useMemo(() => {
    return countries.find(
      (item) =>
        item.code.toUpperCase() === country.toUpperCase()
    );
  }, [countries, country]);

  const currency = useMemo(() => {
    return getCountryCurrency(selectedCountry);
  }, [selectedCountry]);

  const availableProviders = useMemo(() => {
    return getProvidersForCountry(country).sort((a, b) =>
      getLocalizedProviderName(a, language).localeCompare(
        getLocalizedProviderName(b, language),
        language === "fr" ? "fr" : "en"
      )
    );
  }, [country, language]);

  const filteredBeneficiaries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return beneficiaries;
    }

    return beneficiaries.filter((beneficiary) => {
      const searchableText = [
        beneficiary.name,
        beneficiary.phone,
        beneficiary.country,
        beneficiary.relationship,
        beneficiary.provider,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [beneficiaries, search]);

  const resolveCountryName = useCallback(
    (countryValue: string): string => {
      const matchingCountry = countries.find(
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

  const resolveProviderName = useCallback(
    (providerValue: string): string => {
      const matchingProvider = readAllProviders().find(
        (item) =>
          item.id === providerValue ||
          item.name === providerValue ||
          item.nameEn === providerValue ||
          item.nameFr === providerValue ||
          item.displayName === providerValue
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

  const fetchBeneficiaries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
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

    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(error.message);
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

  useEffect(() => {
    setProvider("");
  }, [country]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setCountry("");
    setRelationship("");
    setProvider("");
  };

  const saveBeneficiary = async () => {
    setMessage("");
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedRelationship = relationship.trim();

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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
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

    const { error } = await supabase
      .from("beneficiaries")
      .insert([
        {
          user_id: session.user.id,
          name: trimmedName,
          phone: trimmedPhone,
          country,
          relationship: trimmedRelationship,
          provider,
        },
      ]);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
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

  const deleteBeneficiary = async (
    beneficiary: Beneficiary
  ) => {
    const confirmed = window.confirm(
      language === "fr"
        ? `Supprimer ${beneficiary.name} de vos bénéficiaires ?`
        : `Delete ${beneficiary.name} from your beneficiaries?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(beneficiary.id);
    setMessage("");
    setErrorMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
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

    const { error } = await supabase
      .from("beneficiaries")
      .delete()
      .eq("id", beneficiary.id)
      .eq("user_id", session.user.id);

    setDeletingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await fetchBeneficiaries();

    setMessage(
      language === "fr"
        ? "Bénéficiaire supprimé."
        : "Beneficiary deleted."
    );
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
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

            {message && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800"
              >
                {message}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
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
                    setName(event.target.value)
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
                    setPhone(event.target.value)
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

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Pays"
                    : "Country"}
                </span>

                <select
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    {language === "fr"
                      ? "Choisir un pays"
                      : "Select a country"}
                  </option>

                  {countries.map((countryOption) => (
                    <option
                      key={countryOption.code}
                      value={countryOption.code}
                    >
                      {getLocalizedCountryName(
                        countryOption,
                        language
                      )}
                    </option>
                  ))}
                </select>
              </label>

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
                    setRelationship(event.target.value)
                  }
                  placeholder={
                    language === "fr"
                      ? "Exemple : Parent, ami ou collègue"
                      : "Example: Parent, friend, or coworker"
                  }
                  className="rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-medium text-gray-700">
                  {language === "fr"
                    ? "Fournisseur"
                    : "Provider"}
                </span>

                <select
                  value={provider}
                  onChange={(event) =>
                    setProvider(event.target.value)
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
                    (providerOption) => (
                      <option
                        key={providerOption.id}
                        value={providerOption.id}
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
                  availableProviders.length === 0 && (
                    <span className="text-sm text-amber-700">
                      {language === "fr"
                        ? "Aucun fournisseur n’est configuré pour ce pays dans providers.ts."
                        : "No provider is configured for this country in providers.ts."}
                    </span>
                  )}
              </label>

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

            <button
              type="button"
              onClick={saveBeneficiary}
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

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  language === "fr"
                    ? "Rechercher..."
                    : "Search beneficiaries..."
                }
                className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 md:max-w-sm"
              />
            </div>

            {isLoading ? (
              <p className="text-gray-500">
                {language === "fr"
                  ? "Chargement des bénéficiaires..."
                  : "Loading beneficiaries..."}
              </p>
            ) : beneficiaries.length === 0 ? (
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
            ) : filteredBeneficiaries.length === 0 ? (
              <p className="text-gray-500">
                {language === "fr"
                  ? "Aucun bénéficiaire ne correspond à votre recherche."
                  : "No beneficiaries match your search."}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredBeneficiaries.map(
                  (beneficiary) => (
                    <article
                      key={beneficiary.id}
                      className="rounded-2xl border border-gray-200 p-5 transition hover:border-green-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-gray-900">
                            {beneficiary.name}
                          </h3>

                          <p className="mt-1 text-gray-700">
                            {beneficiary.phone}
                          </p>
                        </div>

                        <div
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700"
                        >
                          {beneficiary.name
                            ?.trim()
                            .charAt(0)
                            .toUpperCase() || "B"}
                        </div>
                      </div>

                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Pays"
                              : "Country"}
                          </dt>

                          <dd className="text-right font-medium text-gray-800">
                            {resolveCountryName(
                              beneficiary.country
                            )}
                          </dd>
                        </div>

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

                      <button
                        type="button"
                        onClick={() =>
                          deleteBeneficiary(
                            beneficiary
                          )
                        }
                        disabled={
                          deletingId === beneficiary.id
                        }
                        className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                      >
                        {deletingId === beneficiary.id
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