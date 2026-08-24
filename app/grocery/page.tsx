"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

type Beneficiary = {
  id: string;
  name: string;
  phone: string;
  country: string;
  country_code: string | null;
  relationship: string | null;
  provider: string | null;
};

type Merchant = {
  id: string;
  name: string;
  merchant_type: string | null;
  country: string | null;
  country_code: string | null;
  currency: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean | null;
};

type GroceryProduct = {
  id: string;
  merchant_id: string;
  name: string;
  category: string | null;
  unit: string | null;
  price: number;
  currency: string;
  stock: number;
  is_active: boolean | null;
};

type CartItem = GroceryProduct & {
  quantity: number;
};

type WalletBalance = {
  id: string;
  currency: string;
  balance: number;
};

type GroceryRpcResult = {
  success: boolean;
  duplicate: boolean;

  order_id: number;
  merchant_order_id: string | null;
  transaction_id: string | null;

  reference: string;
  status: string;

  merchant_id: string;
  merchant_name: string;

  beneficiary_id: string;

  country: string;
  country_code: string;

  item_count: number;

  subtotal: number;
  delivery_fee: number;
  total: number;

  currency: string;

  balance_before: number;
  balance_after: number;
};

function normalizeCurrency(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function normalizeCountryCode(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function formatMoney(
  amount: number,
  currency: string,
  language: string
) {
  const normalizedCurrency = normalizeCurrency(currency);

  if (normalizedCurrency === "XAF") {
    return `FCFA ${new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US",
      {
        maximumFractionDigits: 0,
      }
    ).format(amount)}`;
  }

  if (normalizedCurrency === "XOF") {
    return `CFA ${new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US",
      {
        maximumFractionDigits: 0,
      }
    ).format(amount)}`;
  }

  try {
    return new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US",
      {
        style: "currency",
        currency: normalizedCurrency || "USD",
      }
    ).format(amount);
  } catch {
    return `${new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US"
    ).format(amount)} ${normalizedCurrency}`;
  }
}

function createIdempotencyKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `grocery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

// ============================================================
// GROCERY CATALOG TRANSLATIONS
//
// Database values remain canonical.
// Translation is presentation-only.
// ============================================================

const PRODUCT_TRANSLATIONS_FR: Record<string, string> = {
  "Drinking Water": "Eau potable",
  "Cooking Oil": "Huile de cuisson",
  Milk: "Lait",
  Rice: "Riz",
  Soap: "Savon",
  Flour: "Farine",
  Sugar: "Sucre",
  Bananas: "Bananes",
  Onions: "Oignons",
  Tomatoes: "Tomates",
  Chicken: "Poulet",
  Eggs: "Œufs",
};

const CATEGORY_TRANSLATIONS_FR: Record<string, string> = {
  Beverages: "Boissons",
  Cooking: "Cuisine",
  Dairy: "Produits laitiers",
  Grains: "Céréales",
  Household: "Produits ménagers",
  Pantry: "Épicerie",
  Produce: "Fruits et légumes",
  Protein: "Protéines",
};

const UNIT_TRANSLATIONS_FR: Record<string, string> = {
  "6 bottles": "6 bouteilles",
  "1 L": "1 L",
  "5 kg": "5 kg",
  "1 bar": "1 savon",
  "1 kg": "1 kg",
  "1 bunch": "1 régime",
  "1 whole": "1 entier",
  "12 eggs": "12 œufs",
};

function getProductName(
  productName: string,
  language: string
) {
  if (language !== "fr") {
    return productName;
  }

  return PRODUCT_TRANSLATIONS_FR[productName] ?? productName;
}

function getCategoryName(
  category: string | null,
  language: string
) {
  if (!category) {
    return language === "fr" ? "Autres" : "Other";
  }

  if (language !== "fr") {
    return category;
  }

  return CATEGORY_TRANSLATIONS_FR[category] ?? category;
}

function getUnitName(
  unit: string | null,
  language: string
) {
  if (!unit) {
    return language === "fr" ? "Article" : "Item";
  }

  if (language !== "fr") {
    return unit;
  }

  return UNIT_TRANSLATIONS_FR[unit] ?? unit;
}

export default function GroceryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [beneficiaries, setBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<GroceryProduct[]>([]);

  const [cart, setCart] = useState<Record<string, number>>({});

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] =
    useState("");

  const [selectedMerchantId, setSelectedMerchantId] =
    useState("");

  const [deliveryType, setDeliveryType] =
    useState("Delivery");

  const [wallet, setWallet] =
    useState<WalletBalance | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingMerchants, setLoadingMerchants] =
    useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================================
  // SELECTED BENEFICIARY
  // ============================================================

  const selectedBeneficiary = useMemo(
    () =>
      beneficiaries.find(
        (beneficiary) =>
          beneficiary.id === selectedBeneficiaryId
      ) ?? null,
    [beneficiaries, selectedBeneficiaryId]
  );

  // ============================================================
  // SELECTED MERCHANT
  // ============================================================

  const selectedMerchant = useMemo(
    () =>
      merchants.find(
        (merchant) => merchant.id === selectedMerchantId
      ) ?? null,
    [merchants, selectedMerchantId]
  );

  // ============================================================
  // CART ITEMS
  // ============================================================

  const cartItems = useMemo<CartItem[]>(() => {
    return products
      .filter((product) => (cart[product.id] ?? 0) > 0)
      .map((product) => ({
        ...product,
        quantity: cart[product.id],
      }));
  }, [products, cart]);

  // ============================================================
  // TOTALS
  // ============================================================

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.price) * item.quantity,
      0
    );
  }, [cartItems]);

  const deliveryFee = 0;

  const total = subtotal + deliveryFee;

  const balance = Number(wallet?.balance ?? 0);

  const balanceAfter = balance - total;

  const hasEnoughBalance =
    wallet !== null && balance >= total;

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(
            (category): category is string =>
              Boolean(category)
          )
      )
    );
  }, [products]);

  // ============================================================
  // INITIAL PAGE LOAD
  // ============================================================

  useEffect(() => {
    void initializePage();
  }, []);

  // ============================================================
  // BENEFICIARY CHANGE
  // ============================================================

  useEffect(() => {
    if (!selectedBeneficiary) {
      setMerchants([]);
      setSelectedMerchantId("");
      setProducts([]);
      setCart({});
      setWallet(null);
      return;
    }

    void loadMerchantsForBeneficiary(selectedBeneficiary);
  }, [selectedBeneficiary]);

  // ============================================================
  // MERCHANT CHANGE
  // ============================================================

  useEffect(() => {
    if (!selectedMerchant) {
      setProducts([]);
      setCart({});
      setWallet(null);
      return;
    }

    void Promise.all([
      loadProducts(selectedMerchant),
      loadWallet(selectedMerchant.currency),
    ]);
  }, [selectedMerchant]);

  // ============================================================
  // INITIALIZE
  // ============================================================

  async function initializePage() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("beneficiaries")
        .select(
          `
            id,
            name,
            phone,
            country,
            country_code,
            relationship,
            provider
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const loadedBeneficiaries =
        (data as Beneficiary[]) ?? [];

      setBeneficiaries(loadedBeneficiaries);

      if (loadedBeneficiaries.length > 0) {
        setSelectedBeneficiaryId(
          loadedBeneficiaries[0].id
        );
      }
    } catch (error) {
      console.error(
        "Unable to initialize grocery page:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible de charger le service d'épicerie."
          : "Unable to load the grocery service."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD MERCHANTS FOR BENEFICIARY COUNTRY
  // ============================================================

  async function loadMerchantsForBeneficiary(
    beneficiary: Beneficiary
  ) {
    try {
      setLoadingMerchants(true);
      setErrorMessage("");
      setSuccessMessage("");

      setSelectedMerchantId("");
      setProducts([]);
      setCart({});
      setWallet(null);

      const countryCode = normalizeCountryCode(
        beneficiary.country_code
      );

      if (!countryCode) {
        setMerchants([]);

        setErrorMessage(
          isFr
            ? "Ce bénéficiaire n'a pas de code pays. Modifiez le bénéficiaire avant de continuer."
            : "This beneficiary does not have a country code. Update the beneficiary before continuing."
        );

        return;
      }

      const { data, error } = await supabase
        .from("merchants")
        .select(
          `
            id,
            name,
            merchant_type,
            country,
            country_code,
            currency,
            city,
            address,
            phone,
            is_active
          `
        )
        .eq("is_active", true)
        .ilike("merchant_type", "grocery")
        .eq("country_code", countryCode)
        .order("name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const loadedMerchants =
        (data as Merchant[]) ?? [];

      setMerchants(loadedMerchants);

      if (loadedMerchants.length === 1) {
        setSelectedMerchantId(loadedMerchants[0].id);
      }
    } catch (error) {
      console.error(
        "Unable to load grocery merchants:",
        error
      );

      setMerchants([]);

      setErrorMessage(
        isFr
          ? "Impossible de charger les magasins disponibles."
          : "Unable to load available grocery merchants."
      );
    } finally {
      setLoadingMerchants(false);
    }
  }

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  async function loadProducts(merchant: Merchant) {
    try {
      setLoadingProducts(true);
      setErrorMessage("");
      setCart({});

      const { data, error } = await supabase
        .from("grocery_products")
        .select(
          `
            id,
            merchant_id,
            name,
            category,
            unit,
            price,
            currency,
            stock,
            is_active
          `
        )
        .eq("merchant_id", merchant.id)
        .eq("is_active", true)
        .gt("stock", 0)
        .order("category", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const loadedProducts =
        ((data ?? []) as GroceryProduct[]).map(
          (product) => ({
            ...product,
            price: Number(product.price),
            stock: Number(product.stock),
            currency: normalizeCurrency(product.currency),
          })
        );

      setProducts(loadedProducts);
    } catch (error) {
      console.error(
        "Unable to load grocery products:",
        error
      );

      setProducts([]);

      setErrorMessage(
        isFr
          ? "Impossible de charger les produits de ce magasin."
          : "Unable to load products for this merchant."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  // ============================================================
  // LOAD MATCHING WALLET
  // ============================================================

  async function loadWallet(currency?: string | null) {
    try {
      setWallet(null);

      const normalizedCurrency =
        normalizeCurrency(currency);

      if (!normalizedCurrency) {
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("wallet_balances")
        .select("id, currency, balance")
        .eq("user_id", user.id)
        .eq("currency", normalizedCurrency)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setWallet(null);
        return;
      }

      setWallet({
        id: data.id,
        currency: normalizeCurrency(data.currency),
        balance: Number(data.balance ?? 0),
      });
    } catch (error) {
      console.error("Unable to load wallet:", error);

      setWallet(null);

      setErrorMessage(
        isFr
          ? "Impossible de charger le portefeuille correspondant."
          : "Unable to load the matching wallet."
      );
    }
  }

  // ============================================================
  // CART
  // ============================================================

  function updateQuantity(
    product: GroceryProduct,
    quantity: number
  ) {
    const safeQuantity = Math.max(
      0,
      Math.min(quantity, Number(product.stock))
    );

    setCart((current) => {
      const next = { ...current };

      if (safeQuantity <= 0) {
        delete next[product.id];
      } else {
        next[product.id] = safeQuantity;
      }

      return next;
    });
  }

  function addToCart(product: GroceryProduct) {
    const currentQuantity = cart[product.id] ?? 0;

    if (currentQuantity >= product.stock) {
      return;
    }

    updateQuantity(product, currentQuantity + 1);
  }

  function removeFromCart(product: GroceryProduct) {
    const currentQuantity = cart[product.id] ?? 0;

    updateQuantity(product, currentQuantity - 1);
  }

  // ============================================================
  // REFRESH AFTER PURCHASE
  // ============================================================

  async function refreshAfterPurchase(
    merchant: Merchant
  ) {
    await Promise.all([
      loadProducts(merchant),
      loadWallet(merchant.currency),
    ]);
  }

  // ============================================================
  // PURCHASE
  // ============================================================

  async function handlePurchase() {
    if (
      !selectedBeneficiary ||
      !selectedMerchant ||
      cartItems.length === 0
    ) {
      return;
    }

    if (!wallet) {
      setErrorMessage(
        isFr
          ? `Vous n'avez pas de portefeuille ${normalizeCurrency(
              selectedMerchant.currency
            )}.`
          : `You do not have a ${normalizeCurrency(
              selectedMerchant.currency
            )} wallet.`
      );

      return;
    }

    if (!hasEnoughBalance) {
      setErrorMessage(
        isFr
          ? "Solde insuffisant pour cette commande."
          : "Insufficient balance for this order."
      );

      return;
    }

    const confirmationLines = [
      isFr
        ? "Confirmer l'achat d'épicerie ?"
        : "Confirm grocery purchase?",
      "",
      `${isFr ? "Bénéficiaire" : "Beneficiary"}: ${
        selectedBeneficiary.name
      }`,
      `${isFr ? "Magasin" : "Merchant"}: ${
        selectedMerchant.name
      }`,
      `${isFr ? "Mode de réception" : "Fulfillment"}: ${
        deliveryType === "Delivery"
          ? isFr
            ? "Livraison"
            : "Delivery"
          : isFr
          ? "Retrait"
          : "Pickup"
      }`,
      "",
      ...cartItems.map(
        (item) =>
          `${getProductName(item.name, language)} × ${
            item.quantity
          } — ${formatMoney(
            item.price * item.quantity,
            item.currency,
            language
          )}`
      ),
      "",
      `${isFr ? "Sous-total" : "Subtotal"}: ${formatMoney(
        subtotal,
        selectedMerchant.currency ?? "",
        language
      )}`,
      `${isFr ? "Total" : "Total"}: ${formatMoney(
        total,
        selectedMerchant.currency ?? "",
        language
      )}`,
      `${
        isFr ? "Solde après achat" : "Balance after purchase"
      }: ${formatMoney(
        balanceAfter,
        selectedMerchant.currency ?? "",
        language
      )}`,
    ];

    const confirmed = window.confirm(
      confirmationLines.join("\n")
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const idempotencyKey =
        createIdempotencyKey();

      // SECURITY:
      // Only product IDs and quantities are sent.
      // Price, currency and stock are validated by PostgreSQL.
      const rpcItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.rpc(
        "ndakocare_create_grocery_order_v2",
        {
          p_beneficiary_id: selectedBeneficiary.id,
          p_merchant_id: selectedMerchant.id,
          p_items: rpcItems,
          p_delivery_type: deliveryType,
          p_idempotency_key: idempotencyKey,
        }
      );

      if (error) {
        throw error;
      }

      const result = data as GroceryRpcResult;

      if (!result?.success) {
        throw new Error(
          isFr
            ? "La commande n'a pas été créée."
            : "The grocery order was not created."
        );
      }

      setCart({});

      setSuccessMessage(
        isFr
          ? `Commande créée avec succès. ${formatMoney(
              Number(result.total),
              result.currency,
              language
            )}. Référence : ${result.reference}`
          : `Order submitted successfully. ${formatMoney(
              Number(result.total),
              result.currency,
              language
            )}. Reference: ${result.reference}`
      );

      await refreshAfterPurchase(selectedMerchant);
    } catch (error) {
      console.error(
        "Grocery checkout failed:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setErrorMessage(
        isFr
          ? `Impossible de créer la commande. ${message}`
          : `Unable to create the grocery order. ${message}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="mx-auto max-w-6xl p-6">
          <p>
            {isFr
              ? "Chargement de l'épicerie..."
              : "Loading grocery service..."}
          </p>
        </main>
      </>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-6xl p-6">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-green-700 hover:underline"
          >
            ← {isFr ? "Retour" : "Back"}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
            NdakoCare • {isFr ? "Épicerie" : "Grocery"}
          </p>

          <h1 className="text-3xl font-bold">
            {isFr ? "Épicerie" : "Grocery"}
          </h1>

          <p className="mt-2 text-gray-600">
            {isFr
              ? "Achetez des produits auprès d'un magasin disponible dans le pays de votre bénéficiaire en utilisant le portefeuille local correspondant."
              : "Purchase groceries from an available merchant in your beneficiary's country using the matching local-currency wallet."}
          </p>
        </div>

        {/* Success */}
        {successMessage && (
          <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 font-medium text-green-800">
            {successMessage}
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
            {errorMessage}
          </div>
        )}

        {/* ====================================================
            BENEFICIARY
        ==================================================== */}

        <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <label className="font-semibold">
              {isFr ? "Bénéficiaire" : "Beneficiary"}
            </label>

            <Link
              href="/beneficiaries"
              className="font-semibold text-green-700 hover:underline"
            >
              +{" "}
              {isFr
                ? "Ajouter un bénéficiaire"
                : "Add New Beneficiary"}
            </Link>
          </div>

          <select
            value={selectedBeneficiaryId}
            onChange={(event) =>
              setSelectedBeneficiaryId(event.target.value)
            }
            className="w-full rounded-lg border p-3"
          >
            <option value="">
              {isFr
                ? "Sélectionner un bénéficiaire"
                : "Select Beneficiary"}
            </option>

            {beneficiaries.map((beneficiary) => (
              <option
                key={beneficiary.id}
                value={beneficiary.id}
              >
                {beneficiary.name}
                {beneficiary.country_code
                  ? ` — ${beneficiary.country_code}`
                  : ""}
              </option>
            ))}
          </select>

          <p className="mt-2 text-sm text-gray-500">
            {beneficiaries.length}{" "}
            {isFr
              ? "bénéficiaire(s) enregistré(s)"
              : "saved beneficiaries"}
          </p>

          {selectedBeneficiary && (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">
                  {isFr ? "Pays" : "Country"}
                </p>

                <p className="font-semibold">
                  {selectedBeneficiary.country}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {isFr ? "Code pays" : "Country code"}
                </p>

                <p className="font-semibold">
                  {selectedBeneficiary.country_code ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {isFr ? "Téléphone" : "Phone"}
                </p>

                <p className="font-semibold">
                  {selectedBeneficiary.phone}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ====================================================
            MERCHANT
        ==================================================== */}

        {selectedBeneficiary && (
          <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
            <label className="mb-2 block font-semibold">
              {isFr ? "Magasin" : "Grocery Merchant"}
            </label>

            <select
              value={selectedMerchantId}
              onChange={(event) =>
                setSelectedMerchantId(event.target.value)
              }
              disabled={loadingMerchants}
              className="w-full rounded-lg border p-3 disabled:bg-gray-100"
            >
              <option value="">
                {loadingMerchants
                  ? isFr
                    ? "Chargement..."
                    : "Loading..."
                  : isFr
                  ? "Sélectionner un magasin"
                  : "Select Grocery Merchant"}
              </option>

              {merchants.map((merchant) => (
                <option
                  key={merchant.id}
                  value={merchant.id}
                >
                  {merchant.name}
                  {merchant.city
                    ? ` — ${merchant.city}`
                    : ""}
                  {merchant.currency
                    ? ` — ${merchant.currency}`
                    : ""}
                </option>
              ))}
            </select>

            {!loadingMerchants &&
              merchants.length === 0 && (
                <p className="mt-3 text-sm text-amber-700">
                  {isFr
                    ? `Aucun magasin NdakoCare actif n'est disponible pour ${selectedBeneficiary.country_code}.`
                    : `No active NdakoCare grocery merchant is currently available for ${selectedBeneficiary.country_code}.`}
                </p>
              )}

            {selectedMerchant && (
              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {isFr ? "Magasin" : "Merchant"}
                  </p>

                  <p className="font-semibold">
                    {selectedMerchant.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {isFr ? "Ville" : "City"}
                  </p>

                  <p className="font-semibold">
                    {selectedMerchant.city ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {isFr ? "Devise" : "Currency"}
                  </p>

                  <p className="font-semibold">
                    {selectedMerchant.currency ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {isFr ? "Pays" : "Country"}
                  </p>

                  <p className="font-semibold">
                    {selectedMerchant.country ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {selectedMerchant && (
          <>
            {/* ==================================================
                WALLET
            ================================================== */}

            <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    {normalizeCurrency(
                      selectedMerchant.currency
                    )}{" "}
                    {isFr
                      ? "Portefeuille"
                      : "Wallet"}
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-green-700">
                    {wallet
                      ? formatMoney(
                          balance,
                          wallet.currency,
                          language
                        )
                      : "—"}
                  </h2>
                </div>

                <Link
                  href="/wallet"
                  className="rounded-lg border border-green-700 px-4 py-2 font-semibold text-green-700"
                >
                  {isFr
                    ? "Voir le portefeuille"
                    : "View Wallet"}
                </Link>
              </div>

              {!wallet && (
                <p className="mt-4 text-sm text-amber-700">
                  {isFr
                    ? `Aucun portefeuille ${normalizeCurrency(
                        selectedMerchant.currency
                      )} trouvé.`
                    : `No ${normalizeCurrency(
                        selectedMerchant.currency
                      )} wallet was found.`}
                </p>
              )}
            </section>

            {/* ==================================================
                PRODUCTS
            ================================================== */}

            <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">
                {isFr
                  ? "Produits disponibles"
                  : "Available Products"}
              </h2>

              {loadingProducts ? (
                <p>
                  {isFr
                    ? "Chargement des produits..."
                    : "Loading products..."}
                </p>
              ) : products.length === 0 ? (
                <p className="text-gray-600">
                  {isFr
                    ? "Aucun produit disponible actuellement."
                    : "No products are currently available."}
                </p>
              ) : (
                <div className="space-y-8">
                  {categories.map((category) => (
                    <div key={category}>
                      <h3 className="mb-3 text-lg font-bold">
                        {getCategoryName(
                          category,
                          language
                        )}
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {products
                          .filter(
                            (product) =>
                              product.category ===
                              category
                          )
                          .map((product) => {
                            const quantity =
                              cart[product.id] ?? 0;

                            return (
                              <div
                                key={product.id}
                                className="rounded-xl border p-4"
                              >
                                <h4 className="font-bold">
                                  {getProductName(
                                    product.name,
                                    language
                                  )}
                                </h4>

                                <p className="mt-1 text-sm text-gray-500">
                                  {getUnitName(
                                    product.unit,
                                    language
                                  )}
                                </p>

                                <p className="mt-3 text-xl font-bold text-green-700">
                                  {formatMoney(
                                    product.price,
                                    product.currency,
                                    language
                                  )}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  {product.stock}{" "}
                                  {isFr
                                    ? "disponible(s)"
                                    : "available"}
                                </p>

                                <div className="mt-4 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFromCart(
                                        product
                                      )
                                    }
                                    disabled={
                                      quantity === 0
                                    }
                                    className="h-9 w-9 rounded-lg border font-bold disabled:opacity-40"
                                  >
                                    −
                                  </button>

                                  <span className="min-w-8 text-center font-bold">
                                    {quantity}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addToCart(product)
                                    }
                                    disabled={
                                      quantity >=
                                      product.stock
                                    }
                                    className="h-9 w-9 rounded-lg border font-bold disabled:opacity-40"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ==================================================
                DELIVERY / PICKUP
            ================================================== */}

            <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <label className="mb-2 block font-semibold">
                {isFr
                  ? "Mode de réception"
                  : "Fulfillment Method"}
              </label>

              <select
                value={deliveryType}
                onChange={(event) =>
                  setDeliveryType(event.target.value)
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="Delivery">
                  {isFr ? "Livraison" : "Delivery"}
                </option>

                <option value="Pickup">
                  {isFr ? "Retrait" : "Pickup"}
                </option>
              </select>
            </section>

            {/* ==================================================
                ORDER SUMMARY
            ================================================== */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">
                {isFr
                  ? "Résumé de la commande"
                  : "Order Summary"}
              </h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-600">
                  {isFr
                    ? "Ajoutez des produits pour voir le résumé."
                    : "Add products to see the order summary."}
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 border-b pb-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {getProductName(
                              item.name,
                              language
                            )}
                          </p>

                          <p className="text-sm text-gray-500">
                            {getUnitName(
                              item.unit,
                              language
                            )}{" "}
                            × {item.quantity}
                          </p>
                        </div>

                        <p className="font-semibold">
                          {formatMoney(
                            item.price *
                              item.quantity,
                            item.currency,
                            language
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between">
                      <span>
                        {isFr
                          ? "Sous-total"
                          : "Subtotal"}
                      </span>

                      <strong>
                        {formatMoney(
                          subtotal,
                          selectedMerchant.currency ??
                            "",
                          language
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        {isFr
                          ? "Frais de livraison"
                          : "Delivery fee"}
                      </span>

                      <strong>
                        {formatMoney(
                          deliveryFee,
                          selectedMerchant.currency ??
                            "",
                          language
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between border-t pt-4 text-xl">
                      <strong>Total</strong>

                      <strong>
                        {formatMoney(
                          total,
                          selectedMerchant.currency ??
                            "",
                          language
                        )}
                      </strong>
                    </div>

                    {wallet && (
                      <div className="flex justify-between">
                        <span>
                          {isFr
                            ? "Solde après achat"
                            : "Balance after purchase"}
                        </span>

                        <strong
                          className={
                            balanceAfter >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }
                        >
                          {formatMoney(
                            balanceAfter,
                            wallet.currency,
                            language
                          )}
                        </strong>
                      </div>
                    )}

                    {wallet &&
                      total > 0 &&
                      !hasEnoughBalance && (
                        <div className="rounded-lg bg-red-50 p-3 font-semibold text-red-700">
                          {isFr
                            ? `Solde insuffisant. Il vous manque ${formatMoney(
                                total - balance,
                                wallet.currency,
                                language
                              )}.`
                            : `Insufficient balance. You need ${formatMoney(
                                total - balance,
                                wallet.currency,
                                language
                              )} more.`}
                        </div>
                      )}
                  </div>
                </>
              )}

              {/* PURCHASE */}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={
                  submitting ||
                  cartItems.length === 0 ||
                  !wallet ||
                  !hasEnoughBalance
                }
                className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? isFr
                    ? "Traitement..."
                    : "Processing..."
                  : isFr
                  ? "Acheter les produits"
                  : "Buy Groceries"}
              </button>

              {/* LINKS */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/my-orders"
                  className="rounded-lg border px-4 py-2 font-semibold"
                >
                  {isFr
                    ? "Voir mes commandes"
                    : "View My Orders"}
                </Link>

                <Link
                  href="/activity"
                  className="rounded-lg border px-4 py-2 font-semibold"
                >
                  {isFr
                    ? "Voir l'activité financière"
                    : "View Financial Activity"}
                </Link>

                <Link
                  href="/wallet"
                  className="rounded-lg border px-4 py-2 font-semibold"
                >
                  {isFr
                    ? "Voir le portefeuille"
                    : "View Wallet"}
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded-lg border px-4 py-2 font-semibold"
                >
                  {isFr
                    ? "Retour au tableau de bord"
                    : "Back to Dashboard"}
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}