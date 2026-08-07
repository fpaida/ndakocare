"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

import * as AfricaLibrary from "../lib/africa";
import * as ProvidersLibrary from "../lib/providers";

type Beneficiary = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  country: string;
  relationship?: string | null;
  provider?: string | null;
  created_at?: string;
};

type WalletRecord = {
  id?: string;
  user_id: string;
  balance: number | string;
  currency?: string | null;
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
  [key: string]: unknown;
};

const africaModule =
  AfricaLibrary as unknown as Record<string, unknown>;

const providersModule =
  ProvidersLibrary as unknown as Record<string, unknown>;

function readCountries(): CountryRecord[] {
  const possibleLists = [
    africaModule.AFRICAN_COUNTRIES,
    africaModule.COUNTRIES,
    africaModule.africanCountries,
    africaModule.countries,
  ];

  const countryList = possibleLists.find(Array.isArray);

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

function readProviders(): ProviderRecord[] {
  const possibleLists = [
    providersModule.PAYMENT_PROVIDERS,
    providersModule.PROVIDERS,
    providersModule.paymentProviders,
    providersModule.providers,
  ];

  const providerList = possibleLists.find(Array.isArray);

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
  const helper = africaModule.getCountryName;

  if (typeof helper === "function") {
    try {
      const result = (
        helper as (
          country: CountryRecord,
          language?: string
        ) => unknown
      )(country, language);

      if (
        typeof result === "string" &&
        result.trim().length > 0
      ) {
        return result;
      }
    } catch {
      // Use fallback fields.
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
  const helper = providersModule.getProviderName;

  if (typeof helper === "function") {
    try {
      const result = (
        helper as (
          provider: ProviderRecord,
          language?: string
        ) => unknown
      )(provider, language);

      if (
        typeof result === "string" &&
        result.trim().length > 0
      ) {
        return result;
      }
    } catch {
      // Use fallback fields.
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

function formatMoney(
  value: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function createTransferReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `NDC-${timestamp}-${randomPart}`;
}

export default function TransferPage() {
  const { language } = useLanguage();

  const [beneficiaries, setBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] =
    useState("");

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("Family Support");
  const [notes, setNotes] = useState("");

  const [balance, setBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] =
    useState("USD");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const countries = useMemo(
    () => readCountries(),
    []
  );

  const providers = useMemo(
    () => readProviders(),
    []
  );

  const selectedBeneficiary = useMemo(() => {
    return beneficiaries.find(
      (beneficiary) =>
        beneficiary.id === selectedBeneficiaryId
    );
  }, [beneficiaries, selectedBeneficiaryId]);

  const selectedCountry = useMemo(() => {
    if (!selectedBeneficiary?.country) {
      return undefined;
    }

    return countries.find(
      (country) =>
        country.code.toUpperCase() ===
        selectedBeneficiary.country.toUpperCase()
    );
  }, [countries, selectedBeneficiary]);

  const selectedProvider = useMemo(() => {
    if (!selectedBeneficiary?.provider) {
      return undefined;
    }

    return providers.find(
      (provider) =>
        provider.id === selectedBeneficiary.provider ||
        provider.name === selectedBeneficiary.provider ||
        provider.nameEn ===
          selectedBeneficiary.provider ||
        provider.nameFr ===
          selectedBeneficiary.provider ||
        provider.displayName ===
          selectedBeneficiary.provider
    );
  }, [providers, selectedBeneficiary]);

  const beneficiaryCountryName = useMemo(() => {
    if (!selectedBeneficiary) {
      return "";
    }

    if (!selectedCountry) {
      return selectedBeneficiary.country;
    }

    return getLocalizedCountryName(
      selectedCountry,
      language
    );
  }, [
    language,
    selectedBeneficiary,
    selectedCountry,
  ]);

  const beneficiaryProviderName = useMemo(() => {
    if (!selectedBeneficiary?.provider) {
      return language === "fr"
        ? "Portefeuille NdakoCare"
        : "NdakoCare Wallet";
    }

    if (!selectedProvider) {
      return selectedBeneficiary.provider;
    }

    return getLocalizedProviderName(
      selectedProvider,
      language
    );
  }, [
    language,
    selectedBeneficiary,
    selectedProvider,
  ]);

  const destinationCurrency = useMemo(() => {
    return (
      getCountryCurrency(selectedCountry) ||
      walletCurrency
    );
  }, [selectedCountry, walletCurrency]);

  const transferAmount = useMemo(() => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount)) {
      return 0;
    }

    return parsedAmount;
  }, [amount]);

  /*
   * Current fee rule:
   * 1% of the transfer amount with a minimum fee of $1.
   *
   * This is temporary business logic. Later it can be
   * replaced with provider-specific pricing.
   */
  const transferFee = useMemo(() => {
    if (transferAmount <= 0) {
      return 0;
    }

    return Math.max(1, transferAmount * 0.01);
  }, [transferAmount]);

  const totalDebit = useMemo(() => {
    return transferAmount + transferFee;
  }, [transferAmount, transferFee]);

  const remainingBalance = useMemo(() => {
    return balance - totalDebit;
  }, [balance, totalDebit]);

  const loadData = useCallback(async () => {
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
      setErrorMessage(
        language === "fr"
          ? "Veuillez vous connecter pour effectuer un transfert."
          : "Please sign in to make a transfer."
      );

      setIsLoading(false);
      return;
    }

    const [
      walletResult,
      beneficiariesResult,
    ] = await Promise.all([
      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),

      supabase
        .from("beneficiaries")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (walletResult.error) {
      setErrorMessage(walletResult.error.message);
    } else if (walletResult.data) {
      const wallet =
        walletResult.data as WalletRecord;

      setBalance(Number(wallet.balance) || 0);

      if (wallet.currency) {
        setWalletCurrency(wallet.currency);
      }
    } else {
      setBalance(0);
    }

    if (beneficiariesResult.error) {
      setErrorMessage(
        beneficiariesResult.error.message
      );

      setBeneficiaries([]);
    } else {
      setBeneficiaries(
        (beneficiariesResult.data ||
          []) as Beneficiary[]
      );
    }

    setIsLoading(false);
  }, [language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetTransferForm = () => {
    setSelectedBeneficiaryId("");
    setAmount("");
    setPurpose("Family Support");
    setNotes("");
  };

  const sendMoney = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedBeneficiary) {
      setErrorMessage(
        language === "fr"
          ? "Veuillez choisir un bénéficiaire."
          : "Please select a beneficiary."
      );
      return;
    }

    if (
      !Number.isFinite(transferAmount) ||
      transferAmount <= 0
    ) {
      setErrorMessage(
        language === "fr"
          ? "Veuillez saisir un montant valide."
          : "Please enter a valid amount."
      );
      return;
    }

    if (totalDebit > balance) {
      setErrorMessage(
        language === "fr"
          ? `Solde insuffisant. Le montant total requis est de ${formatMoney(
              totalDebit,
              walletCurrency
            )}.`
          : `Insufficient balance. The total required is ${formatMoney(
              totalDebit,
              walletCurrency
            )}.`
      );
      return;
    }

    const confirmationMessage =
      language === "fr"
        ? `Confirmer l’envoi de ${formatMoney(
            transferAmount,
            walletCurrency
          )} à ${selectedBeneficiary.name} ?\n\nFrais : ${formatMoney(
            transferFee,
            walletCurrency
          )}\nTotal débité : ${formatMoney(
            totalDebit,
            walletCurrency
          )}`
        : `Confirm sending ${formatMoney(
            transferAmount,
            walletCurrency
          )} to ${selectedBeneficiary.name}?\n\nFee: ${formatMoney(
            transferFee,
            walletCurrency
          )}\nTotal debit: ${formatMoney(
            totalDebit,
            walletCurrency
          )}`;

    const confirmed =
      window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    setIsSending(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
      setIsSending(false);
      return;
    }

    if (!session) {
      setErrorMessage(
        language === "fr"
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Your session has expired. Please sign in again."
      );

      setIsSending(false);
      return;
    }

    /*
     * Re-read the wallet immediately before sending.
     * This reduces the chance of using a stale balance.
     */
    const { data: latestWallet, error: walletReadError } =
      await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

    if (walletReadError) {
      setErrorMessage(walletReadError.message);
      setIsSending(false);
      return;
    }

    if (!latestWallet) {
      setErrorMessage(
        language === "fr"
          ? "Aucun portefeuille n’a été trouvé."
          : "No wallet was found."
      );

      setIsSending(false);
      return;
    }

    const latestBalance =
      Number(latestWallet.balance) || 0;

    if (totalDebit > latestBalance) {
      setBalance(latestBalance);

      setErrorMessage(
        language === "fr"
          ? "Votre solde a changé et n’est plus suffisant pour ce transfert."
          : "Your balance changed and is no longer sufficient for this transfer."
      );

      setIsSending(false);
      return;
    }

    const newBalance =
      latestBalance - totalDebit;

    const transferReference =
      createTransferReference();

    /*
     * Step 1: Deduct the wallet balance.
     *
     * A future production version should move these database
     * operations into one Supabase/PostgreSQL RPC transaction.
     */
    const { error: walletUpdateError } =
      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
        })
        .eq("user_id", session.user.id);

    if (walletUpdateError) {
      setErrorMessage(walletUpdateError.message);
      setIsSending(false);
      return;
    }

    /*
     * Step 2: Create the transfer.
     *
     * Currency remains the wallet currency because live
     * foreign-exchange conversion is not active yet.
     */
    const { error: transferError } =
      await supabase
        .from("transfers")
        .insert([
          {
            user_id: session.user.id,
            recipient_name:
              selectedBeneficiary.name,
            phone: selectedBeneficiary.phone,
            country: selectedBeneficiary.country,
            amount: transferAmount,
            method:
              selectedBeneficiary.provider ||
              "Ndako Wallet",
            notes:
              notes.trim() ||
              `Transfer to ${selectedBeneficiary.name}`,
            status: "Pending",
            currency: walletCurrency,
            purpose:
              purpose.trim() || "Family Support",
            relationship:
              selectedBeneficiary.relationship || "",
          },
        ]);

    if (transferError) {
      /*
       * Attempt to restore the balance because the transfer
       * record could not be created.
       */
      await supabase
        .from("wallets")
        .update({
          balance: latestBalance,
        })
        .eq("user_id", session.user.id);

      setBalance(latestBalance);
      setErrorMessage(transferError.message);
      setIsSending(false);
      return;
    }

    /*
     * Step 3: Create the wallet transaction record.
     */
    const transactionDescription =
      language === "fr"
        ? `Transfert à ${selectedBeneficiary.name} — Référence ${transferReference}`
        : `Transfer to ${selectedBeneficiary.name} — Reference ${transferReference}`;

    const { error: transactionError } =
      await supabase
        .from("wallet_transactions")
        .insert([
          {
            user_id: session.user.id,
            transaction_type: "Transfer",
            amount: totalDebit,
            currency: walletCurrency,
            description: transactionDescription,
          },
        ]);

    if (transactionError) {
      /*
       * The transfer and wallet deduction already succeeded.
       * Do not restore the balance here because doing so could
       * create free money. Report the logging problem instead.
       */
      console.error(
        "Wallet transaction logging error:",
        transactionError
      );

      setErrorMessage(
        language === "fr"
          ? `Le transfert a été créé, mais l’écriture dans l’historique du portefeuille a échoué : ${transactionError.message}`
          : `The transfer was created, but the wallet history entry failed: ${transactionError.message}`
      );
    }

    setBalance(newBalance);
    resetTransferForm();

    setSuccessMessage(
      language === "fr"
        ? `Transfert envoyé avec succès. Référence : ${transferReference}`
        : `Transfer sent successfully. Reference: ${transferReference}`
    );

    setIsSending(false);
    await loadData();
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-green-700 sm:text-4xl">
                {language === "fr"
                  ? "Transfert d’argent"
                  : "Money Transfer"}
              </h1>

              <p className="mt-2 text-gray-600">
                {language === "fr"
                  ? "Sélectionnez un bénéficiaire, saisissez le montant, puis vérifiez les détails avant l’envoi."
                  : "Select a beneficiary, enter an amount, and review the details before sending."}
              </p>
            </div>

            {successMessage && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800"
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="mb-8 rounded-2xl bg-green-50 p-6">
              <p className="font-medium text-gray-700">
                {language === "fr"
                  ? "Solde disponible"
                  : "Available balance"}
              </p>

              <h2 className="mt-2 break-words text-4xl font-bold text-green-700 sm:text-5xl">
                {formatMoney(
                  balance,
                  walletCurrency
                )}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                {language === "fr"
                  ? `Devise du portefeuille : ${walletCurrency}`
                  : `Wallet currency: ${walletCurrency}`}
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                {language === "fr"
                  ? "Chargement des informations..."
                  : "Loading transfer information..."}
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="font-medium text-gray-700">
                      {language === "fr"
                        ? "Bénéficiaire"
                        : "Beneficiary"}
                    </span>

                    <select
                      value={selectedBeneficiaryId}
                      onChange={(event) => {
                        setSelectedBeneficiaryId(
                          event.target.value
                        );

                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                      className="rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        {language === "fr"
                          ? "Choisir un bénéficiaire"
                          : "Select a beneficiary"}
                      </option>

                      {beneficiaries.map(
                        (beneficiary) => (
                          <option
                            key={beneficiary.id}
                            value={beneficiary.id}
                          >
                            {beneficiary.name}
                            {beneficiary.provider
                              ? ` — ${beneficiary.provider}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {beneficiaries.length === 0 && (
                      <span className="text-sm text-amber-700">
                        {language === "fr"
                          ? "Vous devez d’abord ajouter un bénéficiaire sur la page Bénéficiaires."
                          : "You must first add a beneficiary on the Beneficiaries page."}
                      </span>
                    )}
                  </label>

                  {selectedBeneficiary && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 md:col-span-2">
                      <h3 className="mb-4 text-xl font-bold text-green-700">
                        {language === "fr"
                          ? "Informations du bénéficiaire"
                          : "Beneficiary information"}
                      </h3>

                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Nom"
                              : "Name"}
                          </dt>

                          <dd className="mt-1 font-semibold text-gray-900">
                            {selectedBeneficiary.name}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Téléphone"
                              : "Phone"}
                          </dt>

                          <dd className="mt-1 font-semibold text-gray-900">
                            {selectedBeneficiary.phone}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Pays"
                              : "Country"}
                          </dt>

                          <dd className="mt-1 font-semibold text-gray-900">
                            {beneficiaryCountryName}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Fournisseur"
                              : "Provider"}
                          </dt>

                          <dd className="mt-1 font-semibold text-green-700">
                            {beneficiaryProviderName}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Relation"
                              : "Relationship"}
                          </dt>

                          <dd className="mt-1 font-semibold text-gray-900">
                            {selectedBeneficiary.relationship ||
                              (language === "fr"
                                ? "Non précisée"
                                : "Not specified")}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">
                            {language === "fr"
                              ? "Devise de destination"
                              : "Destination currency"}
                          </dt>

                          <dd className="mt-1 font-semibold text-gray-900">
                            {destinationCurrency}
                          </dd>
                        </div>
                      </dl>

                      {destinationCurrency !==
                        walletCurrency && (
                        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                          {language === "fr"
                            ? `La conversion ${walletCurrency} vers ${destinationCurrency} n’est pas encore activée. Ce transfert sera actuellement enregistré en ${walletCurrency}.`
                            : `${walletCurrency} to ${destinationCurrency} conversion is not active yet. This transfer will currently be recorded in ${walletCurrency}.`}
                        </p>
                      )}
                    </div>
                  )}

                  <label className="flex flex-col gap-2">
                    <span className="font-medium text-gray-700">
                      {language === "fr"
                        ? "Montant à envoyer"
                        : "Amount to send"}
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                      placeholder="0.00"
                      className="rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="font-medium text-gray-700">
                      {language === "fr"
                        ? "Motif"
                        : "Purpose"}
                    </span>

                    <select
                      value={purpose}
                      onChange={(event) =>
                        setPurpose(event.target.value)
                      }
                      className="rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    >
                      <option value="Family Support">
                        {language === "fr"
                          ? "Soutien familial"
                          : "Family Support"}
                      </option>

                      <option value="Education">
                        {language === "fr"
                          ? "Éducation"
                          : "Education"}
                      </option>

                      <option value="Medical">
                        {language === "fr"
                          ? "Frais médicaux"
                          : "Medical"}
                      </option>

                      <option value="Bills">
                        {language === "fr"
                          ? "Factures"
                          : "Bills"}
                      </option>

                      <option value="Gift">
                        {language === "fr"
                          ? "Cadeau"
                          : "Gift"}
                      </option>

                      <option value="Other">
                        {language === "fr"
                          ? "Autre"
                          : "Other"}
                      </option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="font-medium text-gray-700">
                      {language === "fr"
                        ? "Note facultative"
                        : "Optional note"}
                    </span>

                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      rows={3}
                      maxLength={250}
                      placeholder={
                        language === "fr"
                          ? "Ajoutez une courte description..."
                          : "Add a short description..."
                      }
                      className="resize-none rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />

                    <span className="text-right text-xs text-gray-500">
                      {notes.length}/250
                    </span>
                  </label>
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h3 className="text-xl font-bold text-green-700">
                    {language === "fr"
                      ? "Résumé du transfert"
                      : "Transfer summary"}
                  </h3>

                  <dl className="mt-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-600">
                        {language === "fr"
                          ? "Montant"
                          : "Amount"}
                      </dt>

                      <dd className="font-semibold text-gray-900">
                        {formatMoney(
                          transferAmount,
                          walletCurrency
                        )}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-600">
                        {language === "fr"
                          ? "Frais de transfert"
                          : "Transfer fee"}
                      </dt>

                      <dd className="font-semibold text-gray-900">
                        {formatMoney(
                          transferFee,
                          walletCurrency
                        )}
                      </dd>
                    </div>

                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-bold text-gray-900">
                          {language === "fr"
                            ? "Total débité"
                            : "Total debit"}
                        </dt>

                        <dd className="text-lg font-bold text-green-700">
                          {formatMoney(
                            totalDebit,
                            walletCurrency
                          )}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-600">
                        {language === "fr"
                          ? "Solde après transfert"
                          : "Balance after transfer"}
                      </dt>

                      <dd
                        className={`font-semibold ${
                          remainingBalance < 0
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {formatMoney(
                          remainingBalance,
                          walletCurrency
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={sendMoney}
                  disabled={
                    isSending ||
                    !selectedBeneficiary ||
                    transferAmount <= 0 ||
                    totalDebit > balance
                  }
                  className="mt-6 w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400 sm:w-auto"
                >
                  {isSending
                    ? language === "fr"
                      ? "Envoi en cours..."
                      : "Sending..."
                    : language === "fr"
                      ? "Vérifier et envoyer"
                      : "Review and send"}
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}