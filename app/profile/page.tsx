"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";
import { useLanguage } from "../context/LanguageContext";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "../lib/currency";
import {
  AFRICAN_COUNTRIES,
  getCountryName,
  getCountryTimezones,
} from "../lib/africa";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaSave,
  FaClock,
  FaCoins,
  FaLanguage,
  FaCamera,
  FaCheckCircle,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

type SupportedLanguage = "en" | "fr";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type ProfileData = {
  full_name: string | null;
  phone: string | null;
  country: string | null;
  preferred_currency: string | null;
  preferred_language: string | null;
  timezone: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const { language } = useLanguage();

  const text = translations[language as keyof typeof translations];
  const isFrench = language === "fr";
  const countryLanguage: SupportedLanguage = isFrench ? "fr" : "en";

  const countries = useMemo(() => {
    return [...AFRICAN_COUNTRIES].sort((firstCountry, secondCountry) =>
      getCountryName(firstCountry, countryLanguage).localeCompare(
        getCountryName(secondCountry, countryLanguage),
        countryLanguage
      )
    );
  }, [countryLanguage]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");

  const [preferredCurrency, setPreferredCurrency] =
    useState<SupportedCurrency>("USD");

  const [preferredLanguage, setPreferredLanguage] =
    useState<SupportedLanguage>(
      language === "fr" ? "fr" : "en"
    );

  const [timezone, setTimezone] = useState(
    "America/New_York"
  );

  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] =
    useState<MessageState>(null);

  const selectedCountry = useMemo(() => {
    const normalizedCountry = country.trim().toLocaleLowerCase();

    if (!normalizedCountry) {
      return undefined;
    }

    return AFRICAN_COUNTRIES.find((countryOption) => {
      return (
        countryOption.code.toLocaleLowerCase() === normalizedCountry ||
        countryOption.alpha3Code.toLocaleLowerCase() === normalizedCountry ||
        countryOption.name.toLocaleLowerCase() === normalizedCountry ||
        countryOption.frenchName.toLocaleLowerCase() === normalizedCountry
      );
    });
  }, [country]);

  const availableTimezones = useMemo(() => {
    if (!selectedCountry) {
      return [];
    }

    return getCountryTimezones(selectedCountry.code);
  }, [selectedCountry]);

  const selectedTimezoneLabel = useMemo(() => {
    const timezoneOption = availableTimezones.find(
      (option) => option.value === timezone
    );

    if (!timezoneOption) {
      return timezone;
    }

    return isFrench ? timezoneOption.labelFr : timezoneOption.labelEn;
  }, [availableTimezones, isFrench, timezone]);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);

    const normalizedCountry = nextCountry.trim().toLocaleLowerCase();
    const matchedCountry = AFRICAN_COUNTRIES.find((countryOption) => {
      return (
        countryOption.code.toLocaleLowerCase() === normalizedCountry ||
        countryOption.alpha3Code.toLocaleLowerCase() === normalizedCountry ||
        countryOption.name.toLocaleLowerCase() === normalizedCountry ||
        countryOption.frenchName.toLocaleLowerCase() === normalizedCountry
      );
    });

    if (!matchedCountry) {
      return;
    }

    const countryTimezones = getCountryTimezones(matchedCountry.code);
    const currentTimezoneIsValid = countryTimezones.some(
      (timezoneOption) => timezoneOption.value === timezone
    );

    if (!currentTimezoneIsValid) {
      setTimezone(matchedCountry.defaultTimezone);
    }
  };

  const getProfile = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setMessage({
          type: "error",
          text: isFrench
            ? "Veuillez vous connecter pour accéder à votre profil."
            : "Please sign in to access your profile.",
        });

        return;
      }

      const user = session.user;

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, phone, country, preferred_currency, preferred_language, timezone, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle<ProfileData>();

      if (error) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setCountry(data.country || "");
        setAvatarUrl(data.avatar_url || "");

        const savedCurrency =
          data.preferred_currency || "USD";

        const currencyIsSupported =
          SUPPORTED_CURRENCIES.some(
            (currency) =>
              currency.code === savedCurrency
          );

        setPreferredCurrency(
          currencyIsSupported
            ? (savedCurrency as SupportedCurrency)
            : "USD"
        );

        setPreferredLanguage(
          data.preferred_language === "fr"
            ? "fr"
            : "en"
        );

        setTimezone(
          data.timezone || "America/New_York"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isFrench
            ? "Impossible de charger le profil."
            : "Unable to load the profile.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [isFrench]);

  useEffect(() => {
    void getProfile();
  }, [getProfile]);

  const profileInitials = useMemo(() => {
    const name = fullName.trim();

    if (!name) {
      return email
        ? email.charAt(0).toUpperCase()
        : "N";
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [email, fullName]);

  const selectedCurrency = useMemo(() => {
    return SUPPORTED_CURRENCIES.find(
      (currency) =>
        currency.code === preferredCurrency
    );
  }, [preferredCurrency]);

  const updateProfile = async () => {
    setMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedCountry = country.trim();

    if (!trimmedFullName) {
      setMessage({
        type: "error",
        text: isFrench
          ? "Veuillez entrer votre nom complet."
          : "Please enter your full name.",
      });

      return;
    }

    if (!trimmedCountry) {
      setMessage({
        type: "error",
        text: isFrench
          ? "Veuillez sélectionner ou entrer votre pays."
          : "Please select or enter your country.",
      });

      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error(
          isFrench
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Your session has expired. Please sign in again."
        );
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: session.user.id,
            full_name: trimmedFullName,
            phone: trimmedPhone || null,
            country: trimmedCountry,
            preferred_currency: preferredCurrency,
            preferred_language: preferredLanguage,
            timezone,
            avatar_url: avatarUrl.trim() || null,
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        throw error;
      }

      setFullName(trimmedFullName);
      setPhone(trimmedPhone);
      setCountry(trimmedCountry);

      setMessage({
        type: "success",
        text: isFrench
          ? "Votre profil et vos préférences ont été enregistrés avec succès."
          : "Your profile and preferences were saved successfully.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isFrench
            ? "Le profil n'a pas pu être enregistré."
            : "The profile could not be saved.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-9 w-64 rounded-lg bg-slate-200" />
              <div className="h-5 w-96 max-w-full rounded bg-slate-200" />

              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="h-96 rounded-3xl bg-slate-200" />
                <div className="h-[650px] rounded-3xl bg-slate-200" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              NdakoCare
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {text.profileTitle}
                </h1>

                <p className="mt-2 max-w-2xl text-slate-600">
                  {text.profileSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void getProfile()}
                disabled={loading || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaSyncAlt
                  className={loading ? "animate-spin" : ""}
                />

                {isFrench
                  ? "Actualiser"
                  : "Refresh"}
              </button>
            </div>
          </section>

          {message && (
            <div
              role="alert"
              className={`mb-6 rounded-2xl border px-5 py-4 ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {message.type === "success" ? (
                    <FaCheckCircle className="mt-0.5 shrink-0 text-lg" />
                  ) : (
                    <FaExclamationCircle className="mt-0.5 shrink-0 text-lg" />
                  )}

                  <p className="text-sm font-medium">
                    {message.text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className="rounded-md px-2 text-xl leading-none opacity-60 transition hover:opacity-100"
                  aria-label={
                    isFrench
                      ? "Fermer le message"
                      : "Close message"
                  }
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-900/10">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={
                          fullName ||
                          (isFrench
                            ? "Photo de profil"
                            : "Profile photo")
                        }
                        className="h-28 w-28 rounded-full border-4 border-white/30 object-cover shadow-lg"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 text-3xl font-bold shadow-lg">
                        {profileInitials}
                      </div>
                    )}

                    <div className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-md">
                      <FaCamera />
                    </div>
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    {fullName ||
                      (isFrench
                        ? "Utilisateur NdakoCare"
                        : "NdakoCare User")}
                  </h2>

                  <p className="mt-1 break-all text-sm text-emerald-100">
                    {email}
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                      {preferredCurrency}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                      {preferredLanguage === "fr"
                        ? "Français"
                        : "English"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-950">
                  {isFrench
                    ? "Préférences actuelles"
                    : "Current preferences"}
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <PreferenceSummary
                    icon={<FaCoins />}
                    label={
                      isFrench
                        ? "Devise"
                        : "Currency"
                    }
                    value={`${selectedCurrency?.symbol || preferredCurrency} — ${preferredCurrency}`}
                  />

                  <PreferenceSummary
                    icon={<FaLanguage />}
                    label={
                      isFrench
                        ? "Langue"
                        : "Language"
                    }
                    value={
                      preferredLanguage === "fr"
                        ? "Français"
                        : "English"
                    }
                  />

                  <PreferenceSummary
                    icon={<FaClock />}
                    label={
                      isFrench
                        ? "Fuseau horaire"
                        : "Time zone"
                    }
                    value={selectedTimezoneLabel}
                  />
                </div>
              </section>
            </aside>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-950">
                  {isFrench
                    ? "Informations personnelles"
                    : "Personal information"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {isFrench
                    ? "Mettez à jour vos coordonnées et vos préférences."
                    : "Update your contact information and account preferences."}
                </p>
              </div>

              <div className="space-y-8 p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    id="full-name"
                    label={text.fullName}
                    icon={<FaUser />}
                    required
                  >
                    <input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder={
                        isFrench
                          ? "Votre nom complet"
                          : "Your full name"
                      }
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField
                    id="email"
                    label={text.email}
                    icon={<FaEnvelope />}
                  >
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className={`${inputClassName} cursor-not-allowed bg-slate-100 text-slate-500`}
                    />
                  </FormField>

                  <FormField
                    id="phone"
                    label={text.phone}
                    icon={<FaPhone />}
                  >
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder={
                        isFrench
                          ? "+1 412 555 0000"
                          : "+1 412 555 0000"
                      }
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField
                    id="country"
                    label={text.country}
                    icon={<FaGlobe />}
                    required
                  >
                    <input
                      id="country"
                      type="text"
                      list="country-options"
                      value={country}
                      onChange={(event) =>
                        handleCountryChange(event.target.value)
                      }
                      placeholder={
                        isFrench
                          ? "Sélectionnez ou entrez un pays"
                          : "Select or enter a country"
                      }
                      className={inputClassName}
                    />

                    <datalist id="country-options">
                      {countries.map((countryOption) => (
                        <option
                          key={countryOption.code}
                          value={getCountryName(
                            countryOption,
                            countryLanguage
                          )}
                        >
                          {countryOption.flag} {countryOption.currency}
                        </option>
                      ))}
                    </datalist>

                    <p className="mt-2 text-xs text-slate-500">
                      {isFrench
                        ? "Les pays disponibles proviennent de app/lib/africa.ts. Vous pouvez toujours saisir un autre pays pendant que la liste est complétée."
                        : "Available countries come from app/lib/africa.ts. You may still enter another country while the list is being completed."}
                    </p>
                  </FormField>
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-950">
                      {isFrench
                        ? "Préférences du compte"
                        : "Account preferences"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {isFrench
                        ? "Choisissez la devise, la langue et le fuseau horaire associés à votre profil."
                        : "Choose the currency, language, and time zone associated with your profile."}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      id="preferred-currency"
                      label={
                        isFrench
                          ? "Devise préférée"
                          : "Preferred currency"
                      }
                      icon={<FaCoins />}
                    >
                      <select
                        id="preferred-currency"
                        value={preferredCurrency}
                        onChange={(event) =>
                          setPreferredCurrency(
                            event.target
                              .value as SupportedCurrency
                          )
                        }
                        className={inputClassName}
                      >
                        {SUPPORTED_CURRENCIES.map(
                          (currency) => (
                            <option
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.code} —{" "}
                              {currency.symbol} —{" "}
                              {currency.name}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      id="preferred-language"
                      label={
                        isFrench
                          ? "Langue préférée"
                          : "Preferred language"
                      }
                      icon={<FaLanguage />}
                    >
                      <select
                        id="preferred-language"
                        value={preferredLanguage}
                        onChange={(event) =>
                          setPreferredLanguage(
                            event.target
                              .value as SupportedLanguage
                          )
                        }
                        className={inputClassName}
                      >
                        <option value="en">
                          English
                        </option>

                        <option value="fr">
                          Français
                        </option>
                      </select>
                    </FormField>

                    <div className="md:col-span-2">
                      <FormField
                        id="timezone"
                        label={
                          isFrench
                            ? "Fuseau horaire"
                            : "Time zone"
                        }
                        icon={<FaClock />}
                      >
                        <select
                          id="timezone"
                          value={timezone}
                          onChange={(event) =>
                            setTimezone(
                              event.target.value
                            )
                          }
                          className={inputClassName}
                        >
                          {!selectedCountry && (
                            <option value={timezone}>
                              {timezone ||
                                (isFrench
                                  ? "Sélectionnez d’abord un pays"
                                  : "Select a country first")}
                            </option>
                          )}

                          {selectedCountry &&
                            !availableTimezones.some(
                              (timezoneOption) =>
                                timezoneOption.value === timezone
                            ) && (
                              <option value={timezone}>
                                {timezone}
                              </option>
                            )}

                          {availableTimezones.map(
                            (timezoneOption) => (
                              <option
                                key={timezoneOption.value}
                                value={timezoneOption.value}
                              >
                                {isFrench
                                  ? timezoneOption.labelFr
                                  : timezoneOption.labelEn}
                              </option>
                            )
                          )}
                        </select>

                        <p className="mt-2 text-xs text-slate-500">
                          {selectedCountry
                            ? isFrench
                              ? `Fuseaux horaires disponibles pour ${getCountryName(
                                  selectedCountry,
                                  "fr"
                                )}.`
                              : `Available time zones for ${getCountryName(
                                  selectedCountry,
                                  "en"
                                )}.`
                            : isFrench
                              ? "Sélectionnez un pays reconnu pour charger automatiquement ses fuseaux horaires."
                              : "Select a recognized country to load its time zones automatically."}
                        </p>
                      </FormField>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-semibold">
                      {isFrench
                        ? "Remarque concernant la devise"
                        : "Currency note"}
                    </p>

                    <p className="mt-1">
                      {isFrench
                        ? "La devise choisie contrôle l'affichage de l'argent dans votre portefeuille et les futurs modules. Elle ne convertit pas automatiquement votre solde existant."
                        : "Your selected currency controls how money is displayed in your wallet and future modules. It does not automatically convert your existing balance."}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-950">
                      {isFrench
                        ? "Photo de profil"
                        : "Profile photo"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {isFrench
                        ? "Vous pouvez enregistrer une URL d'image maintenant. Le téléversement direct sera ajouté plus tard."
                        : "You can save an image URL now. Direct file uploads will be added later."}
                    </p>
                  </div>

                  <FormField
                    id="avatar-url"
                    label={
                      isFrench
                        ? "URL de l'avatar"
                        : "Avatar URL"
                    }
                    icon={<FaCamera />}
                  >
                    <input
                      id="avatar-url"
                      type="url"
                      value={avatarUrl}
                      onChange={(event) =>
                        setAvatarUrl(event.target.value)
                      }
                      placeholder="https://example.com/profile-photo.jpg"
                      className={inputClassName}
                    />
                  </FormField>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void getProfile()}
                    disabled={saving}
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFrench
                      ? "Annuler les modifications"
                      : "Discard changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void updateProfile()
                    }
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaSave />

                    {saving
                      ? text.saving
                      : text.saveProfile}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

type FormFieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
};

function FormField({
  id,
  label,
  icon,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <span className="text-emerald-700">
          {icon}
        </span>

        <span>{label}</span>

        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

type PreferenceSummaryProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function PreferenceSummary({
  icon,
  label,
  value,
}: PreferenceSummaryProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}