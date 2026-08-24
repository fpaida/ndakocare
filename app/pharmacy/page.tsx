"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

/* ============================================================
   TYPES
============================================================ */

type Beneficiary = {
  id: string;
  name: string;
  phone?: string | null;
  country: string;
  country_code?: string | null;
};

type Pharmacy = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  currency?: string | null;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean | null;
};

type Medicine = {
  id: string;
  pharmacy_id: string | null;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number | null;
  currency?: string | null;
  is_active?: boolean | null;
};

type WalletBalance = {
  id: string;
  currency: string;
  balance: number | string | null;
};

type PharmacyResult = {
  success?: boolean;
  duplicate?: boolean;

  order_id?: string;
  transaction_id?: string;

  reference?: string;
  status?: string;

  pharmacy_id?: string;
  pharmacy_name?: string;
  pharmacy_country?: string;
  pharmacy_country_code?: string;

  medicine_id?: string;
  medicine_name?: string;

  quantity?: number;
  unit_price?: number | string;

  amount?: number | string;
  currency?: string;

  balance_before?: number | string;
  balance_after?: number | string;

  stock_before?: number;
  stock_after?: number;
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeCurrency(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toUpperCase();
}

function normalizeCountryCode(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toUpperCase();
}

function errorMessageFromUnknown(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown })
      .message === "string"
  ) {
    return (
      error as { message: string }
    ).message;
  }

  return fallback;
}

/* ============================================================
   PAGE
============================================================ */

export default function PharmacyPage() {
  const { language } = useLanguage();

  const isFrench =
    language === "fr";

  /* ----------------------------------------------------------
     DATA
  ---------------------------------------------------------- */

  const [
    beneficiaries,
    setBeneficiaries,
  ] = useState<Beneficiary[]>([]);

  const [
    pharmacies,
    setPharmacies,
  ] = useState<Pharmacy[]>([]);

  const [
    medicines,
    setMedicines,
  ] = useState<Medicine[]>([]);

  const [
    walletBalances,
    setWalletBalances,
  ] = useState<WalletBalance[]>([]);

  /* ----------------------------------------------------------
     SELECTION
  ---------------------------------------------------------- */

  const [
    selectedBeneficiaryId,
    setSelectedBeneficiaryId,
  ] = useState("");

  const [
    selectedPharmacyId,
    setSelectedPharmacyId,
  ] = useState("");

  const [
    selectedMedicineId,
    setSelectedMedicineId,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  /* ----------------------------------------------------------
     UI STATE
  ---------------------------------------------------------- */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* ==========================================================
     MONEY FORMATTER
  ========================================================== */

  const money = useCallback(
    (
      amount: number,
      currency: string
    ) => {
      const normalized =
        normalizeCurrency(currency);

      if (!normalized) {
        return amount.toLocaleString(
          isFrench
            ? "fr-FR"
            : "en-US"
        );
      }

      try {
        return new Intl.NumberFormat(
          isFrench
            ? "fr-FR"
            : "en-US",
          {
            style: "currency",
            currency: normalized,
            maximumFractionDigits:
              normalized === "XAF" ||
              normalized === "XOF"
                ? 0
                : 2,
          }
        ).format(amount);
      } catch {
        return `${amount.toLocaleString(
          isFrench
            ? "fr-FR"
            : "en-US"
        )} ${normalized}`;
      }
    },
    [isFrench]
  );

  /* ==========================================================
     LOAD AUTHORITATIVE DATA
  ========================================================== */

  const loadData =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

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

        const userId =
          session.user.id;

        const [
          beneficiaryResponse,
          walletResponse,
          pharmacyResponse,
          medicineResponse,
        ] = await Promise.all([
          /* -----------------------------------------------
             BENEFICIARIES
          ----------------------------------------------- */

          supabase
            .from("beneficiaries")
            .select(
              `
                id,
                name,
                phone,
                country,
                country_code
              `
            )
            .eq(
              "user_id",
              userId
            )
            .order("name"),

          /* -----------------------------------------------
             ALL USER CURRENCY WALLETS
          ----------------------------------------------- */

          supabase
            .from("wallet_balances")
            .select(
              `
                id,
                currency,
                balance
              `
            )
            .eq(
              "user_id",
              userId
            )
            .order("currency"),

          /* -----------------------------------------------
             ACTIVE PHARMACIES
          ----------------------------------------------- */

          supabase
            .from("pharmacies")
            .select(
              `
                id,
                name,
                city,
                country,
                country_code,
                currency,
                address,
                phone,
                is_active
              `
            )
            .eq(
              "is_active",
              true
            )
            .order("country")
            .order("city")
            .order("name"),

          /* -----------------------------------------------
             ACTIVE / IN-STOCK MEDICINES
          ----------------------------------------------- */

          supabase
            .from("medicines")
            .select(
              `
                id,
                pharmacy_id,
                name,
                description,
                price,
                stock,
                currency,
                is_active
              `
            )
            .eq(
              "is_active",
              true
            )
            .gt(
              "stock",
              0
            )
            .not(
              "pharmacy_id",
              "is",
              null
            )
            .order("name"),
        ]);

        if (
          beneficiaryResponse.error
        ) {
          throw beneficiaryResponse.error;
        }

        if (walletResponse.error) {
          throw walletResponse.error;
        }

        if (
          pharmacyResponse.error
        ) {
          throw pharmacyResponse.error;
        }

        if (
          medicineResponse.error
        ) {
          throw medicineResponse.error;
        }

        setBeneficiaries(
          (
            beneficiaryResponse.data ||
            []
          ) as Beneficiary[]
        );

        setWalletBalances(
          (
            walletResponse.data ||
            []
          ) as WalletBalance[]
        );

        setPharmacies(
          (
            pharmacyResponse.data ||
            []
          ) as Pharmacy[]
        );

        setMedicines(
          (
            medicineResponse.data ||
            []
          ) as Medicine[]
        );
      } catch (error) {
        console.error(
          "Pharmacy load error:",
          error
        );

        setErrorMessage(
          errorMessageFromUnknown(
            error,
            isFrench
              ? "Impossible de charger les informations de la pharmacie."
              : "Unable to load pharmacy information."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [isFrench]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ==========================================================
     SELECTED BENEFICIARY
  ========================================================== */

  const selectedBeneficiary =
    useMemo(() => {
      return beneficiaries.find(
        (beneficiary) =>
          beneficiary.id ===
          selectedBeneficiaryId
      );
    }, [
      beneficiaries,
      selectedBeneficiaryId,
    ]);

  const beneficiaryCountryCode =
    useMemo(() => {
      return normalizeCountryCode(
        selectedBeneficiary
          ?.country_code
      );
    }, [selectedBeneficiary]);

  /* ==========================================================
     COUNTRY PHARMACIES
  ========================================================== */

  const availablePharmacies =
    useMemo(() => {
      if (
        !selectedBeneficiary
      ) {
        return [];
      }

      /*
       * country_code is authoritative.
       *
       * A readable-country fallback is kept for
       * legacy records that may not yet have an
       * ISO country code.
       */
      return pharmacies.filter(
        (pharmacy) => {
          const pharmacyCode =
            normalizeCountryCode(
              pharmacy.country_code
            );

          if (
            beneficiaryCountryCode
          ) {
            return (
              pharmacyCode ===
              beneficiaryCountryCode
            );
          }

          const beneficiaryCountry =
            (
              selectedBeneficiary.country ||
              ""
            )
              .trim()
              .toLowerCase();

          const pharmacyCountry =
            (
              pharmacy.country ||
              ""
            )
              .trim()
              .toLowerCase();

          return (
            beneficiaryCountry &&
            pharmacyCountry ===
              beneficiaryCountry
          );
        }
      );
    }, [
      pharmacies,
      selectedBeneficiary,
      beneficiaryCountryCode,
    ]);

  /* ----------------------------------------------------------
     Reset / automatically select pharmacy
  ---------------------------------------------------------- */

  useEffect(() => {
    setSelectedMedicineId("");
    setQuantity(1);

    if (
      availablePharmacies.length ===
      1
    ) {
      setSelectedPharmacyId(
        availablePharmacies[0].id
      );

      return;
    }

    const currentStillValid =
      availablePharmacies.some(
        (pharmacy) =>
          pharmacy.id ===
          selectedPharmacyId
      );

    if (!currentStillValid) {
      setSelectedPharmacyId("");
    }
  }, [
    availablePharmacies,
    selectedPharmacyId,
  ]);

  /* ==========================================================
     SELECTED PHARMACY
  ========================================================== */

  const selectedPharmacy =
    useMemo(() => {
      return availablePharmacies.find(
        (pharmacy) =>
          pharmacy.id ===
          selectedPharmacyId
      );
    }, [
      availablePharmacies,
      selectedPharmacyId,
    ]);

  /* ==========================================================
     PHARMACY MEDICINES
  ========================================================== */

  const availableMedicines =
    useMemo(() => {
      if (
        !selectedPharmacyId
      ) {
        return [];
      }

      return medicines.filter(
        (medicine) =>
          medicine.pharmacy_id ===
            selectedPharmacyId &&
          medicine.is_active !==
            false &&
          Number(
            medicine.stock ?? 0
          ) > 0
      );
    }, [
      medicines,
      selectedPharmacyId,
    ]);

  useEffect(() => {
    setSelectedMedicineId("");
    setQuantity(1);
  }, [selectedPharmacyId]);

  /* ==========================================================
     SELECTED MEDICINE
  ========================================================== */

  const selectedMedicine =
    useMemo(() => {
      return availableMedicines.find(
        (medicine) =>
          medicine.id ===
          selectedMedicineId
      );
    }, [
      availableMedicines,
      selectedMedicineId,
    ]);

  /* ==========================================================
     TRANSACTION CURRENCY
  ========================================================== */

  const transactionCurrency =
    useMemo(() => {
      const medicineCurrency =
        normalizeCurrency(
          selectedMedicine?.currency
        );

      if (medicineCurrency) {
        return medicineCurrency;
      }

      return normalizeCurrency(
        selectedPharmacy?.currency
      );
    }, [
      selectedMedicine,
      selectedPharmacy,
    ]);

  /* ==========================================================
     MATCHING WALLET
  ========================================================== */

  const activeWallet =
    useMemo(() => {
      if (
        !transactionCurrency
      ) {
        return undefined;
      }

      return walletBalances.find(
        (wallet) =>
          normalizeCurrency(
            wallet.currency
          ) ===
          transactionCurrency
      );
    }, [
      walletBalances,
      transactionCurrency,
    ]);

  const walletBalance =
    Number(
      activeWallet?.balance ?? 0
    );

  /* ==========================================================
     ORDER CALCULATIONS
  ========================================================== */

  const unitPrice =
    selectedMedicine
      ? Number(
          selectedMedicine.price
        )
      : 0;

  const total =
    Number.isFinite(unitPrice)
      ? unitPrice * quantity
      : 0;

  const availableStock =
    Number(
      selectedMedicine?.stock ??
        0
    );

  const balanceAfter =
    walletBalance - total;

  const hasEnoughFunds =
    Boolean(activeWallet) &&
    total > 0 &&
    walletBalance >= total;

  const hasEnoughStock =
    Boolean(selectedMedicine) &&
    quantity > 0 &&
    quantity <= availableStock;

  /* ==========================================================
     BENEFICIARY CHANGE
  ========================================================== */

  const handleBeneficiaryChange = (
    beneficiaryId: string
  ) => {
    setSelectedBeneficiaryId(
      beneficiaryId
    );

    setSelectedPharmacyId("");
    setSelectedMedicineId("");
    setQuantity(1);

    setSuccessMessage("");
    setErrorMessage("");
  };

  /* ==========================================================
     PURCHASE
  ========================================================== */

  const handleOrder =
    async () => {
      setSuccessMessage("");
      setErrorMessage("");

      /* ------------------------------------------------------
         Beneficiary
      ------------------------------------------------------ */

      if (
        !selectedBeneficiary
      ) {
        setErrorMessage(
          isFrench
            ? "Veuillez sélectionner un bénéficiaire."
            : "Please select a beneficiary."
        );

        return;
      }

      if (
        !beneficiaryCountryCode
      ) {
        setErrorMessage(
          isFrench
            ? "Ce bénéficiaire n’a pas de code pays valide. Veuillez mettre à jour le bénéficiaire."
            : "This beneficiary does not have a valid country code. Please update the beneficiary."
        );

        return;
      }

      /* ------------------------------------------------------
         Pharmacy
      ------------------------------------------------------ */

      if (
        !selectedPharmacy
      ) {
        setErrorMessage(
          isFrench
            ? "Veuillez sélectionner une pharmacie."
            : "Please select a pharmacy."
        );

        return;
      }

      /* ------------------------------------------------------
         Medicine
      ------------------------------------------------------ */

      if (
        !selectedMedicine
      ) {
        setErrorMessage(
          isFrench
            ? "Veuillez sélectionner un médicament."
            : "Please select a medicine."
        );

        return;
      }

      /* ------------------------------------------------------
         Currency consistency
      ------------------------------------------------------ */

      const medicineCurrency =
        normalizeCurrency(
          selectedMedicine.currency
        );

      const pharmacyCurrency =
        normalizeCurrency(
          selectedPharmacy.currency
        );

      if (
        !medicineCurrency ||
        !pharmacyCurrency
      ) {
        setErrorMessage(
          isFrench
            ? "La devise de la pharmacie ou du médicament n’est pas configurée."
            : "The pharmacy or medicine currency is not configured."
        );

        return;
      }

      if (
        medicineCurrency !==
        pharmacyCurrency
      ) {
        setErrorMessage(
          isFrench
            ? `La devise du médicament (${medicineCurrency}) ne correspond pas à celle de la pharmacie (${pharmacyCurrency}).`
            : `Medicine currency (${medicineCurrency}) does not match pharmacy currency (${pharmacyCurrency}).`
        );

        return;
      }

      /* ------------------------------------------------------
         Quantity
      ------------------------------------------------------ */

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        setErrorMessage(
          isFrench
            ? "La quantité doit être un nombre entier supérieur à zéro."
            : "Quantity must be a whole number greater than zero."
        );

        return;
      }

      if (
        quantity >
        availableStock
      ) {
        setErrorMessage(
          isFrench
            ? `Stock insuffisant. Disponible : ${availableStock}.`
            : `Insufficient stock. Available: ${availableStock}.`
        );

        return;
      }

      /* ------------------------------------------------------
         Wallet
      ------------------------------------------------------ */

      if (!activeWallet) {
        setErrorMessage(
          isFrench
            ? `Vous n’avez pas de portefeuille ${transactionCurrency} pour effectuer cet achat.`
            : `You do not have a ${transactionCurrency} wallet for this purchase.`
        );

        return;
      }

      if (
        walletBalance < total
      ) {
        setErrorMessage(
          isFrench
            ? `Solde ${transactionCurrency} insuffisant. Requis : ${money(
                total,
                transactionCurrency
              )}. Disponible : ${money(
                walletBalance,
                transactionCurrency
              )}.`
            : `Insufficient ${transactionCurrency} balance. Required: ${money(
                total,
                transactionCurrency
              )}. Available: ${money(
                walletBalance,
                transactionCurrency
              )}.`
        );

        return;
      }

      /* ------------------------------------------------------
         Confirmation
      ------------------------------------------------------ */

      const confirmation =
        isFrench
          ? [
              "Confirmer l’achat en pharmacie ?",
              "",
              `Bénéficiaire : ${selectedBeneficiary.name}`,
              `Pharmacie : ${selectedPharmacy.name}`,
              `Médicament : ${selectedMedicine.name}`,
              `Quantité : ${quantity}`,
              `Prix unitaire : ${money(
                unitPrice,
                transactionCurrency
              )}`,
              `Total : ${money(
                total,
                transactionCurrency
              )}`,
              `Solde après achat : ${money(
                balanceAfter,
                transactionCurrency
              )}`,
            ].join("\n")
          : [
              "Confirm pharmacy purchase?",
              "",
              `Beneficiary: ${selectedBeneficiary.name}`,
              `Pharmacy: ${selectedPharmacy.name}`,
              `Medicine: ${selectedMedicine.name}`,
              `Quantity: ${quantity}`,
              `Unit price: ${money(
                unitPrice,
                transactionCurrency
              )}`,
              `Total: ${money(
                total,
                transactionCurrency
              )}`,
              `Balance after purchase: ${money(
                balanceAfter,
                transactionCurrency
              )}`,
            ].join("\n");

      if (
        !window.confirm(
          confirmation
        )
      ) {
        return;
      }

      setIsSubmitting(true);

      /*
       * One idempotency key per user action.
       *
       * The database unique indexes and RPC protect against
       * accidental duplicate submissions / double charging.
       */
      const idempotencyKey =
        crypto.randomUUID();

      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

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
         * The PostgreSQL RPC performs the financial operation
         * atomically:
         *
         * 1. validates authentication
         * 2. validates beneficiary ownership
         * 3. checks idempotency
         * 4. validates active pharmacy
         * 5. validates active medicine
         * 6. checks medicine/pharmacy currency consistency
         * 7. locks medicine inventory
         * 8. validates stock
         * 9. locks the matching-currency wallet
         * 10. validates available funds
         * 11. creates the pharmacy order
         * 12. decreases inventory
         * 13. debits the wallet
         * 14. creates the financial ledger entry
         *
         * Any failure rolls the full operation back.
         */

        const {
          data,
          error,
        } = await supabase.rpc(
          "ndakocare_create_pharmacy_order_v2",
          {
            p_beneficiary_id:
              selectedBeneficiary.id,

            p_medicine_id:
              selectedMedicine.id,

            p_quantity:
              quantity,

            p_idempotency_key:
              idempotencyKey,
          }
        );

        if (error) {
          throw error;
        }

        const result =
          data as
            | PharmacyResult
            | null;

        if (
          !result?.success
        ) {
          throw new Error(
            isFrench
              ? "Le moteur de transaction de la pharmacie n’a pas confirmé la commande."
              : "The pharmacy transaction engine did not confirm the order."
          );
        }

        const reference =
          result.reference ||
          (isFrench
            ? "Référence indisponible"
            : "Reference unavailable");

        const returnedCurrency =
          normalizeCurrency(
            result.currency
          ) ||
          transactionCurrency;

        const returnedAmount =
          Number(
            result.amount ??
              total
          );

        setSuccessMessage(
          isFrench
            ? `Commande envoyée avec succès. ${result.medicine_name ?? selectedMedicine.name} — ${money(
                returnedAmount,
                returnedCurrency
              )}. Référence : ${reference}`
            : `Order submitted successfully. ${result.medicine_name ?? selectedMedicine.name} — ${money(
                returnedAmount,
                returnedCurrency
              )}. Reference: ${reference}`
        );

        setSelectedMedicineId(
          ""
        );

        setQuantity(1);

        /*
         * Reload authoritative state from Supabase so
         * wallet balance and inventory reflect the committed
         * transaction.
         */
        await loadData();
      } catch (error) {
        console.error(
          "Pharmacy order error:",
          error
        );

        setErrorMessage(
          errorMessageFromUnknown(
            error,
            isFrench
              ? "La commande de pharmacie n’a pas pu être effectuée."
              : "The pharmacy order could not be completed."
          )
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
              NdakoCare •{" "}
              {isFrench
                ? "Pharmacie"
                : "Pharmacy"}
            </p>

            <h1 className="text-3xl font-bold text-gray-950 sm:text-4xl">
              {isFrench
                ? "Pharmacie"
                : "Pharmacy"}
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              {isFrench
                ? "Sélectionnez un bénéficiaire, une pharmacie disponible dans son pays et un médicament dans la devise locale."
                : "Select a beneficiary, an available pharmacy in their country, and medicine priced in the local currency."}
            </p>
          </header>

          {/* ==================================================
              SUCCESS / ERROR
          ================================================== */}

          {successMessage && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 font-medium text-green-800"
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {/* ==================================================
              MAIN CARD
          ================================================== */}

          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">

            {/* ================================================
                BENEFICIARY
            ================================================ */}

            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">

                <label
                  htmlFor="beneficiary"
                  className="font-semibold text-gray-800"
                >
                  {isFrench
                    ? "Bénéficiaire"
                    : "Beneficiary"}
                </label>

                <Link
                  href="/beneficiaries"
                  className="inline-flex items-center rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  {isFrench
                    ? "+ Ajouter un bénéficiaire"
                    : "+ Add New Beneficiary"}
                </Link>

              </div>

              <select
                id="beneficiary"
                value={
                  selectedBeneficiaryId
                }
                onChange={(event) =>
                  handleBeneficiaryChange(
                    event.target.value
                  )
                }
                disabled={
                  loading ||
                  isSubmitting
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  {isFrench
                    ? "Sélectionner un bénéficiaire"
                    : "Select Beneficiary"}
                </option>

                {beneficiaries.map(
                  (beneficiary) => (
                    <option
                      key={
                        beneficiary.id
                      }
                      value={
                        beneficiary.id
                      }
                    >
                      {
                        beneficiary.name
                      }
                      {beneficiary.country_code
                        ? ` — ${beneficiary.country_code}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-sm text-gray-500">
                {beneficiaries.length ===
                0
                  ? isFrench
                    ? "Aucun bénéficiaire enregistré."
                    : "No saved beneficiary yet."
                  : isFrench
                    ? `${beneficiaries.length} bénéficiaire(s) enregistré(s)`
                    : `${beneficiaries.length} saved ${
                        beneficiaries.length ===
                        1
                          ? "beneficiary"
                          : "beneficiaries"
                      }`}
              </p>

              {selectedBeneficiary && (
                <div className="mt-4 grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-3">

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Pays"
                        : "Country"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {
                        selectedBeneficiary.country
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Code pays"
                        : "Country code"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedBeneficiary.country_code ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Téléphone"
                        : "Phone"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedBeneficiary.phone ||
                        "—"}
                    </p>
                  </div>

                </div>
              )}
            </div>

            {/* ================================================
                PHARMACY
            ================================================ */}

            <div className="mb-7">
              <label
                htmlFor="pharmacy"
                className="mb-2 block font-semibold text-gray-800"
              >
                {isFrench
                  ? "Pharmacie"
                  : "Pharmacy"}
              </label>

              <select
                id="pharmacy"
                value={
                  selectedPharmacyId
                }
                onChange={(event) =>
                  setSelectedPharmacyId(
                    event.target.value
                  )
                }
                disabled={
                  loading ||
                  isSubmitting ||
                  !selectedBeneficiary
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  {!selectedBeneficiary
                    ? isFrench
                      ? "Sélectionnez d’abord un bénéficiaire"
                      : "Select a beneficiary first"
                    : isFrench
                      ? "Sélectionner une pharmacie"
                      : "Select Pharmacy"}
                </option>

                {availablePharmacies.map(
                  (pharmacy) => (
                    <option
                      key={
                        pharmacy.id
                      }
                      value={
                        pharmacy.id
                      }
                    >
                      {
                        pharmacy.name
                      }
                      {pharmacy.city
                        ? ` — ${pharmacy.city}`
                        : ""}
                      {pharmacy.currency
                        ? ` — ${pharmacy.currency}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              {selectedBeneficiary &&
                !loading &&
                availablePharmacies.length ===
                  0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    {isFrench
                      ? `Aucune pharmacie NdakoCare active n’est actuellement disponible pour le pays ${selectedBeneficiary.country_code || selectedBeneficiary.country}.`
                      : `No active NdakoCare pharmacy is currently available for ${selectedBeneficiary.country_code || selectedBeneficiary.country}.`}
                  </div>
                )}

              {selectedPharmacy && (
                <div className="mt-4 grid gap-3 rounded-2xl bg-green-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Pharmacie"
                        : "Pharmacy"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {
                        selectedPharmacy.name
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Ville"
                        : "City"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedPharmacy.city ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Devise"
                        : "Currency"}
                    </p>

                    <p className="mt-1 font-semibold text-green-700">
                      {selectedPharmacy.currency ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isFrench
                        ? "Téléphone"
                        : "Phone"}
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedPharmacy.phone ||
                        "—"}
                    </p>
                  </div>

                </div>
              )}
            </div>

            {/* ================================================
                MEDICINE
            ================================================ */}

            <div className="mb-7">
              <label
                htmlFor="medicine"
                className="mb-2 block font-semibold text-gray-800"
              >
                {isFrench
                  ? "Médicament"
                  : "Medicine"}
              </label>

              <select
                id="medicine"
                value={
                  selectedMedicineId
                }
                onChange={(event) => {
                  setSelectedMedicineId(
                    event.target.value
                  );

                  setQuantity(1);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                disabled={
                  loading ||
                  isSubmitting ||
                  !selectedPharmacy
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  {!selectedPharmacy
                    ? isFrench
                      ? "Sélectionnez d’abord une pharmacie"
                      : "Select a pharmacy first"
                    : isFrench
                      ? "Sélectionner un médicament"
                      : "Select Medicine"}
                </option>

                {availableMedicines.map(
                  (medicine) => {
                    const currency =
                      normalizeCurrency(
                        medicine.currency ||
                          selectedPharmacy?.currency
                      );

                    return (
                      <option
                        key={
                          medicine.id
                        }
                        value={
                          medicine.id
                        }
                      >
                        {
                          medicine.name
                        }{" "}
                        —{" "}
                        {money(
                          Number(
                            medicine.price
                          ),
                          currency
                        )}{" "}
                        —{" "}
                        {
                          medicine.stock ??
                          0
                        }{" "}
                        {isFrench
                          ? "disponible(s)"
                          : "available"}
                      </option>
                    );
                  }
                )}
              </select>

              {selectedPharmacy &&
                !loading &&
                availableMedicines.length ===
                  0 && (
                  <p className="mt-3 text-sm text-gray-500">
                    {isFrench
                      ? "Aucun médicament n’est actuellement disponible dans cette pharmacie."
                      : "No medicines are currently available at this pharmacy."}
                  </p>
                )}

              {selectedMedicine
                ?.description && (
                <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  {
                    selectedMedicine.description
                  }
                </p>
              )}
            </div>

            {/* ================================================
                WALLET
            ================================================ */}

            {transactionCurrency && (
              <div className="mb-7 rounded-2xl bg-green-50 p-6">

                <div className="flex flex-wrap items-end justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {isFrench
                        ? `Portefeuille ${transactionCurrency}`
                        : `${transactionCurrency} Wallet`}
                    </p>

                    <h2 className="mt-2 text-4xl font-bold text-green-700 sm:text-5xl">
                      {activeWallet
                        ? money(
                            walletBalance,
                            transactionCurrency
                          )
                        : "—"}
                    </h2>
                  </div>

                  <Link
                    href="/wallet"
                    className="rounded-xl border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                  >
                    {isFrench
                      ? "Voir le portefeuille"
                      : "View Wallet"}
                  </Link>

                </div>

                {!activeWallet && (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {isFrench
                      ? `Aucun compte ${transactionCurrency} n’est actuellement disponible dans votre portefeuille.`
                      : `You do not currently have a ${transactionCurrency} wallet account.`}
                  </p>
                )}

              </div>
            )}

            {/* ================================================
                QUANTITY
            ================================================ */}

            <div className="mb-7">
              <label
                htmlFor="quantity"
                className="mb-2 block font-semibold text-gray-800"
              >
                {isFrench
                  ? "Quantité"
                  : "Quantity"}
              </label>

              <input
                id="quantity"
                type="number"
                min={1}
                max={
                  selectedMedicine
                    ?.stock ??
                  undefined
                }
                step={1}
                value={quantity}
                onChange={(event) => {
                  const value =
                    Number(
                      event.target.value
                    );

                  setQuantity(
                    Number.isFinite(
                      value
                    )
                      ? Math.max(
                          1,
                          Math.floor(
                            value
                          )
                        )
                      : 1
                  );
                }}
                disabled={
                  loading ||
                  isSubmitting ||
                  !selectedMedicine
                }
                className="w-full rounded-xl border border-gray-300 p-4 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* ================================================
                ORDER SUMMARY
            ================================================ */}

            <div className="rounded-2xl bg-gray-50 p-6">

              <h2 className="mb-5 text-xl font-bold text-gray-900">
                {isFrench
                  ? "Résumé de la commande"
                  : "Order Summary"}
              </h2>

              {selectedMedicine ? (
                <div className="space-y-3 text-gray-700">

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Pharmacie"
                        : "Pharmacy"}
                    </span>

                    <strong className="text-right">
                      {
                        selectedPharmacy?.name
                      }
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Médicament"
                        : "Medicine"}
                    </span>

                    <strong>
                      {
                        selectedMedicine.name
                      }
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Devise"
                        : "Currency"}
                    </span>

                    <strong>
                      {
                        transactionCurrency
                      }
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Prix unitaire"
                        : "Unit price"}
                    </span>

                    <strong>
                      {money(
                        unitPrice,
                        transactionCurrency
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Stock disponible"
                        : "Available stock"}
                    </span>

                    <strong>
                      {
                        availableStock
                      }
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>
                      {isFrench
                        ? "Quantité"
                        : "Quantity"}
                    </span>

                    <strong>
                      {quantity}
                    </strong>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-4">

                    <span className="text-xl font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-3xl font-bold text-gray-950">
                      {money(
                        total,
                        transactionCurrency
                      )}
                    </span>

                  </div>

                  {activeWallet && (
                    <div className="flex justify-between gap-4 text-sm">

                      <span>
                        {isFrench
                          ? "Solde après achat"
                          : "Balance after purchase"}
                      </span>

                      <strong
                        className={
                          balanceAfter < 0
                            ? "text-red-600"
                            : "text-green-700"
                        }
                      >
                        {money(
                          balanceAfter,
                          transactionCurrency
                        )}
                      </strong>

                    </div>
                  )}

                  {!hasEnoughFunds &&
                    activeWallet &&
                    total > 0 && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {isFrench
                          ? `Solde insuffisant. Il manque ${money(
                              Math.max(
                                total -
                                  walletBalance,
                                0
                              ),
                              transactionCurrency
                            )}.`
                          : `Insufficient balance. You need ${money(
                              Math.max(
                                total -
                                  walletBalance,
                                0
                              ),
                              transactionCurrency
                            )} more.`}
                      </div>
                    )}

                </div>
              ) : (
                <p className="text-gray-500">
                  {isFrench
                    ? "Sélectionnez un médicament pour afficher le résumé."
                    : "Select a medicine to see the order summary."}
                </p>
              )}

            </div>

            {/* ================================================
                PURCHASE
            ================================================ */}

            <button
              type="button"
              onClick={
                handleOrder
              }
              disabled={
                loading ||
                isSubmitting ||
                !selectedBeneficiary ||
                !selectedPharmacy ||
                !selectedMedicine ||
                !activeWallet ||
                !hasEnoughStock ||
                !hasEnoughFunds
              }
              className="mt-7 w-full rounded-xl bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting
                ? isFrench
                  ? "Traitement..."
                  : "Processing..."
                : isFrench
                  ? "Acheter le médicament"
                  : "Buy Medicine"}
            </button>

            {/* ================================================
                NAVIGATION
            ================================================ */}

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                href="/activity"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:text-green-700"
              >
                {isFrench
                  ? "Voir l’activité financière"
                  : "View Financial Activity"}
              </Link>

              <Link
                href="/wallet"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:text-green-700"
              >
                {isFrench
                  ? "Voir le portefeuille"
                  : "View Wallet"}
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:text-green-700"
              >
                {isFrench
                  ? "Retour au tableau de bord"
                  : "Back to Dashboard"}
              </Link>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}