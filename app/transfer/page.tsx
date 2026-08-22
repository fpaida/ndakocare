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
import {
  formatCurrency,
  getCurrencyName,
} from "../lib/currency";

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

type WalletBalance = {
  id: string;
  user_id: string;
  currency: string;
  balance: number | string;
  created_at: string;
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
      // Use fallback fields below.
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
      // Use fallback fields below.
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


export default function TransferPage() {
  const { language } = useLanguage();
  const isFrench = language === "fr";

  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);

  const [walletBalances, setWalletBalances] =
    useState<WalletBalance[]>([]);

  const [preferredCurrency, setPreferredCurrency] =
    useState("USD");

  const [selectedCurrency, setSelectedCurrency] =
    useState("USD");

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] =
    useState("");

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] =
    useState("Family Support");
  const [notes, setNotes] = useState("");

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
        provider.nameEn === selectedBeneficiary.provider ||
        provider.nameFr === selectedBeneficiary.provider ||
        provider.displayName === selectedBeneficiary.provider
    );
  }, [providers, selectedBeneficiary]);

  const selectedWallet = useMemo(() => {
    return walletBalances.find(
      (wallet) =>
        wallet.currency === selectedCurrency
    );
  }, [walletBalances, selectedCurrency]);

  const balance = Number(
    selectedWallet?.balance ?? 0
  );

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
      return isFrench
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
    isFrench,
    language,
    selectedBeneficiary,
    selectedProvider,
  ]);

  const destinationCurrency = useMemo(() => {
    return (
      getCountryCurrency(selectedCountry) ||
      selectedCurrency
    );
  }, [selectedCountry, selectedCurrency]);

  const requiresCurrencyConversion =
    Boolean(selectedBeneficiary) &&
    destinationCurrency !== selectedCurrency;

  const transferAmount = useMemo(() => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount)) {
      return 0;
    }

    return parsedAmount;
  }, [amount]);

  /*
   * Temporary V1 fee rule:
   * 1% of the transfer amount with a minimum
   * of 1 unit of the selected source currency.
   *
   * This will later be replaced by the NdakoCare
   * pricing / provider fee engine.
   */
  const transferFee = useMemo(() => {
    if (transferAmount <= 0) {
      return 0;
    }

    return Math.max(
      1,
      transferAmount * 0.01
    );
  }, [transferAmount]);

  const totalDebit = useMemo(() => {
    return transferAmount + transferFee;
  }, [transferAmount, transferFee]);

  const remainingBalance = useMemo(() => {
    return balance - totalDebit;
  }, [balance, totalDebit]);

  const money = useCallback(
    (value: number, currency: string) =>
      formatCurrency(
        value,
        currency,
        isFrench ? "fr" : "en"
      ),
    [isFrench]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setErrorMessage(
          isFrench
            ? "Veuillez vous connecter pour effectuer un transfert."
            : "Please sign in to make a transfer."
        );

        return;
      }

      const userId = session.user.id;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("preferred_currency")
          .eq("id", userId)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const profileCurrency =
        profile?.preferred_currency || "USD";

      setPreferredCurrency(profileCurrency);

      const { error: ensureWalletError } =
        await supabase
          .from("wallet_balances")
          .upsert(
            {
              user_id: userId,
              currency: profileCurrency,
              balance: 0,
            },
            {
              onConflict: "user_id,currency",
              ignoreDuplicates: true,
            }
          );

      if (ensureWalletError) {
        throw ensureWalletError;
      }

      const [
        balancesResult,
        beneficiariesResult,
      ] = await Promise.all([
        supabase
          .from("wallet_balances")
          .select(
            "id, user_id, currency, balance, created_at"
          )
          .eq("user_id", userId)
          .order("currency", {
            ascending: true,
          }),

        supabase
          .from("beneficiaries")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (balancesResult.error) {
        throw balancesResult.error;
      }

      const balances =
        (balancesResult.data ||
          []) as WalletBalance[];

      setWalletBalances(balances);

      setSelectedCurrency((currentCurrency) => {
        const preferredExists =
          balances.some(
            (wallet) =>
              wallet.currency === profileCurrency
          );

        /*
         * On first load, default to the user's preferred
         * currency. After the user chooses another account,
         * preserve that selection while it still exists.
         */
        if (
          currentCurrency === "USD" &&
          profileCurrency !== "USD" &&
          preferredExists
        ) {
          return profileCurrency;
        }

        const currentStillExists =
          balances.some(
            (wallet) =>
              wallet.currency === currentCurrency
          );

        if (currentStillExists) {
          return currentCurrency;
        }

        if (preferredExists) {
          return profileCurrency;
        }

        return (
          balances[0]?.currency ||
          profileCurrency
        );
      });

      if (beneficiariesResult.error) {
        throw beneficiariesResult.error;
      }

      setBeneficiaries(
        (beneficiariesResult.data ||
          []) as Beneficiary[]
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isFrench
            ? "Une erreur est survenue pendant le chargement."
            : "An error occurred while loading transfer information."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isFrench]);

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
        isFrench
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
        isFrench
          ? "Veuillez saisir un montant valide."
          : "Please enter a valid amount."
      );
      return;
    }

    if (!selectedWallet) {
      setErrorMessage(
        isFrench
          ? "Le compte source sélectionné est introuvable."
          : "The selected source account could not be found."
      );
      return;
    }

    /*
     * Cross-currency transfers remain blocked until the
     * NdakoCare FX engine supplies a trusted exchange quote.
     */
    if (requiresCurrencyConversion) {
      setErrorMessage(
        isFrench
          ? `Ce transfert nécessite une conversion ${selectedCurrency} vers ${destinationCurrency}. Le moteur de change NdakoCare n'est pas encore activé pour les transferts.`
          : `This transfer requires ${selectedCurrency} to ${destinationCurrency} conversion. The NdakoCare FX engine is not yet enabled for transfers.`
      );
      return;
    }

    /*
     * This client-side balance check improves the user
     * experience. The database RPC performs the authoritative
     * balance check again while holding a row lock.
     */
    if (totalDebit > balance) {
      setErrorMessage(
        isFrench
          ? `Solde insuffisant. Le montant total requis est de ${money(
              totalDebit,
              selectedCurrency
            )}.`
          : `Insufficient balance. The total required is ${money(
              totalDebit,
              selectedCurrency
            )}.`
      );
      return;
    }

    const confirmationMessage =
      isFrench
        ? `Confirmer l'envoi de ${money(
            transferAmount,
            selectedCurrency
          )} à ${selectedBeneficiary.name} ?\n\nFrais : ${money(
            transferFee,
            selectedCurrency
          )}\nTotal débité : ${money(
            totalDebit,
            selectedCurrency
          )}`
        : `Confirm sending ${money(
            transferAmount,
            selectedCurrency
          )} to ${selectedBeneficiary.name}?\n\nFee: ${money(
            transferFee,
            selectedCurrency
          )}\nTotal debit: ${money(
            totalDebit,
            selectedCurrency
          )}`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setIsSending(true);

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

      /*
       * The PostgreSQL function performs the financial operation
       * atomically:
       *
       * 1. authenticate the user with auth.uid()
       * 2. lock the selected wallet row
       * 3. verify available funds
       * 4. create the transfer
       * 5. debit the wallet balance
       * 6. create the financial-ledger entry
       *
       * If any database step fails, PostgreSQL rolls back the
       * entire function call.
       */
      const { data, error: transferError } =
        await supabase.rpc(
          "ndakocare_create_transfer",
          {
            p_source_currency:
              selectedCurrency,
            p_recipient_name:
              selectedBeneficiary.name,
            p_phone:
              selectedBeneficiary.phone,
            p_country:
              selectedBeneficiary.country,
            p_method:
              selectedBeneficiary.provider ||
              "Ndako Wallet",
            p_relationship:
              selectedBeneficiary.relationship ||
              "",
            p_purpose:
              purpose.trim() ||
              "Family Support",
            p_notes:
              notes.trim() ||
              `Transfer to ${selectedBeneficiary.name}`,
            p_source_amount:
              transferAmount,
            p_fee:
              transferFee,
            p_destination_currency:
              destinationCurrency,
            p_exchange_rate:
              1,
          }
        );

      if (transferError) {
        throw transferError;
      }

      const result =
        data as
          | {
              success?: boolean;
              transfer_id?: string;
              transaction_id?: string;
              reference?: string;
              status?: string;
              source_currency?: string;
              source_amount?: number | string;
              fee?: number | string;
              total_debit?: number | string;
              balance_before?: number | string;
              balance_after?: number | string;
              exchange_rate?: number | string;
              destination_currency?: string;
              destination_amount?: number | string;
            }
          | null;

      if (!result?.success) {
        throw new Error(
          isFrench
            ? "Le moteur de transfert n'a pas confirmé l'opération."
            : "The transfer engine did not confirm the transaction."
        );
      }

      const returnedBalance =
        Number(result.balance_after);

      if (Number.isFinite(returnedBalance)) {
        setWalletBalances((current) =>
          current.map((wallet) =>
            wallet.currency ===
            selectedCurrency
              ? {
                  ...wallet,
                  balance: returnedBalance,
                }
              : wallet
          )
        );
      }

      const reference =
        result.reference ||
        (isFrench
          ? "Référence indisponible"
          : "Reference unavailable");

      resetTransferForm();

      setSuccessMessage(
        isFrench
          ? `Transfert envoyé avec succès. Référence : ${reference}`
          : `Transfer sent successfully. Reference: ${reference}`
      );

      /*
       * Reload balances and beneficiaries from Supabase so the
       * UI reflects the authoritative database state.
       */
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isFrench
            ? "Le transfert n'a pas pu être effectué."
            : "The transfer could not be completed."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              NDAKOCARE • TRANSFERS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {isFrench
                ? "Transfert d'argent"
                : "Money Transfer"}
            </h1>

            <p className="mt-2 max-w-3xl text-slate-600">
              {isFrench
                ? "Envoyez de l'argent depuis le compte NdakoCare de votre choix vers un bénéficiaire, localement ou régionalement."
                : "Send money from the NdakoCare currency account you choose to a beneficiary locally or regionally."}
            </p>
          </section>

          {successMessage && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-medium text-emerald-800"
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-900/10 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">
                  {isFrench
                    ? "Compte source sélectionné"
                    : "Selected source account"}
                </p>

                {isLoading ? (
                  <div className="mt-3 h-14 w-56 animate-pulse rounded-xl bg-white/20" />
                ) : (
                  <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    {money(
                      balance,
                      selectedCurrency
                    )}
                  </h2>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20">
                    {selectedCurrency}
                  </span>

                  {selectedCurrency ===
                    preferredCurrency && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-emerald-700">
                      {isFrench
                        ? "Compte principal"
                        : "Primary account"}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full lg:max-w-md">
                <label
                  htmlFor="source-account"
                  className="mb-2 block text-sm font-semibold text-emerald-50"
                >
                  {isFrench
                    ? "Choisir le compte source"
                    : "Choose source account"}
                </label>

                <select
                  id="source-account"
                  value={selectedCurrency}
                  onChange={(event) => {
                    setSelectedCurrency(
                      event.target.value
                    );
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  disabled={
                    isLoading ||
                    walletBalances.length === 0
                  }
                  className="min-h-12 w-full rounded-xl border border-white/30 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  {walletBalances.map(
                    (wallet) => (
                      <option
                        key={wallet.id}
                        value={wallet.currency}
                      >
                        {wallet.currency} —{" "}
                        {getCurrencyName(
                          wallet.currency
                        )} —{" "}
                        {money(
                          Number(
                            wallet.balance ?? 0
                          ),
                          wallet.currency
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                {isFrench
                  ? "Chargement des informations..."
                  : "Loading transfer information..."}
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      {isFrench
                        ? "Bénéficiaire"
                        : "Beneficiary"}
                    </span>

                    <select
                      value={
                        selectedBeneficiaryId
                      }
                      onChange={(event) => {
                        setSelectedBeneficiaryId(
                          event.target.value
                        );
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                      className="min-h-12 rounded-xl border border-slate-300 bg-white p-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">
                        {isFrench
                          ? "Choisir un bénéficiaire"
                          : "Select a beneficiary"}
                      </option>

                      {beneficiaries.map(
                        (beneficiary) => (
                          <option
                            key={beneficiary.id}
                            value={
                              beneficiary.id
                            }
                          >
                            {beneficiary.name}
                            {beneficiary.provider
                              ? ` — ${beneficiary.provider}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {beneficiaries.length ===
                      0 && (
                      <span className="text-sm text-amber-700">
                        {isFrench
                          ? "Vous devez d'abord ajouter un bénéficiaire sur la page Bénéficiaires."
                          : "You must first add a beneficiary on the Beneficiaries page."}
                      </span>
                    )}
                  </label>

                  {selectedBeneficiary && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:col-span-2">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            {isFrench
                              ? "Destination"
                              : "Destination"}
                          </p>

                          <h3 className="mt-1 text-xl font-bold text-slate-950">
                            {
                              selectedBeneficiary.name
                            }
                          </h3>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-emerald-700 shadow-sm">
                          {destinationCurrency}
                        </span>
                      </div>

                      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Téléphone"
                              : "Phone"}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {
                              selectedBeneficiary.phone
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Pays"
                              : "Country"}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {
                              beneficiaryCountryName
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Fournisseur"
                              : "Provider"}
                          </dt>
                          <dd className="mt-1 font-semibold text-emerald-700">
                            {
                              beneficiaryProviderName
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Relation"
                              : "Relationship"}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {selectedBeneficiary.relationship ||
                              (isFrench
                                ? "Non précisée"
                                : "Not specified")}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Devise source"
                              : "Source currency"}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {selectedCurrency}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            {isFrench
                              ? "Devise de destination"
                              : "Destination currency"}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {
                              destinationCurrency
                            }
                          </dd>
                        </div>
                      </dl>

                      {requiresCurrencyConversion && (
                        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                          <p className="font-bold">
                            {isFrench
                              ? "Conversion de devise requise"
                              : "Currency conversion required"}
                          </p>

                          <p className="mt-1">
                            {isFrench
                              ? `Ce transfert nécessite une conversion ${selectedCurrency} → ${destinationCurrency}. Pour protéger les soldes, NdakoCare ne traitera pas ce transfert avant l'activation du moteur de change.`
                              : `This transfer requires ${selectedCurrency} → ${destinationCurrency} conversion. To protect wallet balances, NdakoCare will not process it until the FX engine is enabled.`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-slate-700">
                      {isFrench
                        ? "Montant à envoyer"
                        : "Amount to send"}
                    </span>

                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => {
                          setAmount(
                            event.target.value
                          );
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                        placeholder="0.00"
                        className="min-h-12 w-full rounded-xl border border-slate-300 p-3 pr-20 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-bold text-slate-500">
                        {selectedCurrency}
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-slate-700">
                      {isFrench
                        ? "Motif"
                        : "Purpose"}
                    </span>

                    <select
                      value={purpose}
                      onChange={(event) =>
                        setPurpose(
                          event.target.value
                        )
                      }
                      className="min-h-12 rounded-xl border border-slate-300 bg-white p-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="Family Support">
                        {isFrench
                          ? "Soutien familial"
                          : "Family Support"}
                      </option>

                      <option value="Education">
                        {isFrench
                          ? "Éducation"
                          : "Education"}
                      </option>

                      <option value="Medical">
                        {isFrench
                          ? "Frais médicaux"
                          : "Medical"}
                      </option>

                      <option value="Bills">
                        {isFrench
                          ? "Factures"
                          : "Bills"}
                      </option>

                      <option value="Gift">
                        {isFrench
                          ? "Cadeau"
                          : "Gift"}
                      </option>

                      <option value="Other">
                        {isFrench
                          ? "Autre"
                          : "Other"}
                      </option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      {isFrench
                        ? "Note facultative"
                        : "Optional note"}
                    </span>

                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value
                        )
                      }
                      rows={3}
                      maxLength={250}
                      placeholder={
                        isFrench
                          ? "Ajoutez une courte description..."
                          : "Add a short description..."
                      }
                      className="resize-none rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />

                    <span className="text-right text-xs text-slate-500">
                      {notes.length}/250
                    </span>
                  </label>
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-bold text-slate-950">
                      {isFrench
                        ? "Résumé du transfert"
                        : "Transfer summary"}
                    </h3>

                    <span className="text-sm font-semibold text-slate-500">
                      {selectedCurrency}
                    </span>
                  </div>

                  <dl className="mt-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-600">
                        {isFrench
                          ? "Montant"
                          : "Amount"}
                      </dt>

                      <dd className="font-semibold text-slate-900">
                        {money(
                          transferAmount,
                          selectedCurrency
                        )}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-600">
                        {isFrench
                          ? "Frais de transfert"
                          : "Transfer fee"}
                      </dt>

                      <dd className="font-semibold text-slate-900">
                        {money(
                          transferFee,
                          selectedCurrency
                        )}
                      </dd>
                    </div>

                    <div className="border-t border-slate-300 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-bold text-slate-900">
                          {isFrench
                            ? "Total débité"
                            : "Total debit"}
                        </dt>

                        <dd className="text-lg font-bold text-emerald-700">
                          {money(
                            totalDebit,
                            selectedCurrency
                          )}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-600">
                        {isFrench
                          ? "Solde après transfert"
                          : "Balance after transfer"}
                      </dt>

                      <dd
                        className={`font-semibold ${
                          remainingBalance < 0
                            ? "text-red-600"
                            : "text-slate-900"
                        }`}
                      >
                        {money(
                          remainingBalance,
                          selectedCurrency
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void sendMoney()
                  }
                  disabled={
                    isSending ||
                    !selectedBeneficiary ||
                    transferAmount <= 0 ||
                    totalDebit > balance ||
                    requiresCurrencyConversion ||
                    !selectedWallet
                  }
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:w-auto"
                >
                  {isSending
                    ? isFrench
                      ? "Envoi en cours..."
                      : "Sending..."
                    : requiresCurrencyConversion
                      ? isFrench
                        ? "Conversion requise"
                        : "FX required"
                      : isFrench
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