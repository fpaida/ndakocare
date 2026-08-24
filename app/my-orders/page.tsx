"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

// ============================================================
// TYPES
// ============================================================

type GroceryOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_unit: string | null;
  quantity: number;
  unit_price: number;
  line_total: number | null;
  currency: string;
  created_at: string;
};

type MerchantInfo = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  currency: string | null;
};

type GroceryOrder = {
  id: number;
  user_id: string;

  beneficiary_id: string | null;
  merchant_id: string | null;

  recipient_name: string | null;
  phone_number: string | null;

  country: string | null;
  country_code: string | null;
  city: string | null;

  delivery_type: string | null;

  grocery_items: string | null;

  currency: string | null;
  subtotal: number | null;
  delivery_fee: number | null;
  total_amount: number | null;

  reference: string | null;
  idempotency_key: string | null;

  status: string | null;
  created_at: string;

  grocery_order_items?: GroceryOrderItem[];
  merchants?: MerchantInfo | null;
};

type LegacyParsedItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  lineTotal: number;
  currency: string;
};

type DisplayOrderItem = {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number;
  currency: string;
  structured: boolean;
};

type StatusDetails = {
  label: string;
  badgeClassName: string;
  borderClassName: string;
  progressClassName: string;
  progressWidth: string;
  icon: string;
  trackingMessage: string;
};

// ============================================================
// PRODUCT TRANSLATIONS
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

  Fish: "Poisson",
  Toothpaste: "Dentifrice",
};

const UNIT_TRANSLATIONS_FR: Record<string, string> = {
  "6 bottles": "6 bouteilles",
  "1 bottle": "1 bouteille",
  "1 L": "1 L",
  "5 kg": "5 kg",
  "1 kg": "1 kg",
  "1 bar": "1 savon",
  "1 bunch": "1 régime",
  "1 whole": "1 entier",
  "12 eggs": "12 œufs",
};

const PRODUCT_EMOJIS: Record<string, string> = {
  rice: "🍚",
  riz: "🍚",

  oil: "🫗",
  huile: "🫗",

  sugar: "🧂",
  sucre: "🧂",

  flour: "🌾",
  farine: "🌾",

  chicken: "🍗",
  poulet: "🍗",

  fish: "🐟",
  poisson: "🐟",

  eggs: "🥚",
  oeufs: "🥚",
  œufs: "🥚",

  tomatoes: "🍅",
  tomates: "🍅",

  onions: "🧅",
  oignons: "🧅",

  bananas: "🍌",
  bananes: "🍌",

  water: "💧",
  eau: "💧",

  milk: "🥛",
  lait: "🥛",

  soap: "🧼",
  savon: "🧼",

  toothpaste: "🪥",
  dentifrice: "🪥",
};

// ============================================================
// HELPERS
// ============================================================

function normalizeCurrency(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function translateProductName(
  productName: string,
  language: string
) {
  if (language !== "fr") {
    return productName;
  }

  return PRODUCT_TRANSLATIONS_FR[productName] ?? productName;
}

function translateUnit(
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

function getProductEmoji(productName: string) {
  const normalizedName = productName
    .trim()
    .toLocaleLowerCase();

  const key = Object.keys(PRODUCT_EMOJIS).find((item) =>
    normalizedName.includes(item)
  );

  return key ? PRODUCT_EMOJIS[key] : "🛒";
}

function parseAmount(value: string) {
  const cleaned = value
    .replace(/\s/g, "")
    .replace(/,/g, "");

  const amount = Number(cleaned);

  return Number.isFinite(amount) ? amount : 0;
}

// ============================================================
// LEGACY ORDER PARSER
//
// Grocery V2 now uses grocery_order_items.
// This parser remains only so old orders still display.
// ============================================================

function parseLegacyGroceryItems(
  groceryItems?: string | null
): LegacyParsedItem[] {
  if (!groceryItems?.trim()) {
    return [];
  }

  const lines = groceryItems
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.flatMap((line, index) => {
    /*
     * Supported examples:
     *
     * Rice — 5 kg × 2 — 13000 XAF
     * Rice â€” 5 kg Ã— 2 â€” 13000 XAF
     */

    const normalizedLine = line
      .replace(/â€”/g, "—")
      .replace(/Ã—/g, "×");

    const match = normalizedLine.match(
      /^(.+?)\s+—\s+(.+?)\s+×\s+(\d+)\s+—\s+([\d\s,.]+)\s+([A-Z]{3})$/u
    );

    if (!match) {
      return [];
    }

    const [
      ,
      name,
      unit,
      quantity,
      lineTotal,
      currency,
    ] = match;

    return [
      {
        id: `legacy-${index}-${name}`,
        name: name.trim(),
        unit: unit.trim(),
        quantity: Number(quantity),
        lineTotal: parseAmount(lineTotal),
        currency: normalizeCurrency(currency),
      },
    ];
  });
}

function formatMoney(
  amount: number,
  currency: string,
  language: string
) {
  const normalizedCurrency =
    normalizeCurrency(currency);

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

// ============================================================
// PAGE
// ============================================================

export default function MyOrdersPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ============================================================
  // LOAD
  // ============================================================

  useEffect(() => {
    void fetchOrders();
  }, []);

  async function fetchOrders(
    options: { refresh?: boolean } = {}
  ) {
    try {
      if (options.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
        .from("grocery_orders")
        .select(
          `
            id,
            user_id,
            beneficiary_id,
            merchant_id,

            recipient_name,
            phone_number,

            country,
            country_code,
            city,

            delivery_type,
            grocery_items,

            currency,
            subtotal,
            delivery_fee,
            total_amount,

            reference,
            idempotency_key,

            status,
            created_at,

            grocery_order_items (
              id,
              product_id,
              product_name,
              product_unit,
              quantity,
              unit_price,
              line_total,
              currency,
              created_at
            ),

            merchants (
              id,
              name,
              city,
              country,
              country_code,
              currency
            )
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const normalizedOrders =
        ((data ?? []) as unknown as GroceryOrder[]).map(
          (order) => ({
            ...order,

            subtotal:
              order.subtotal === null
                ? null
                : Number(order.subtotal),

            delivery_fee:
              order.delivery_fee === null
                ? null
                : Number(order.delivery_fee),

            total_amount:
              order.total_amount === null
                ? null
                : Number(order.total_amount),

            grocery_order_items:
              order.grocery_order_items?.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                line_total:
                  item.line_total === null
                    ? null
                    : Number(item.line_total),
                currency: normalizeCurrency(item.currency),
              })) ?? [],
          })
        );

      setOrders(normalizedOrders);
    } catch (error) {
      console.error(
        "Unable to load grocery orders:",
        error
      );

      setOrders([]);

      setErrorMessage(
        isFr
          ? "Impossible de charger vos commandes d'épicerie."
          : "Unable to load your grocery orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  function getStatusDetails(
    statusValue?: string | null
  ): StatusDetails {
    const normalizedStatus = (
      statusValue ?? "Pending"
    )
      .trim()
      .toLocaleLowerCase();

    if (
      normalizedStatus === "delivered" ||
      normalizedStatus === "completed"
    ) {
      return {
        label: isFr ? "Livrée" : "Delivered",

        badgeClassName:
          "bg-green-100 text-green-800",

        borderClassName:
          "border-green-500",

        progressClassName:
          "bg-green-600",

        progressWidth: "100%",

        icon: "✅",

        trackingMessage: isFr
          ? "La commande a été livrée."
          : "The order has been delivered.",
      };
    }

    if (
      normalizedStatus === "processing" ||
      normalizedStatus === "preparing"
    ) {
      return {
        label: isFr
          ? "En traitement"
          : "Processing",

        badgeClassName:
          "bg-blue-100 text-blue-800",

        borderClassName:
          "border-blue-500",

        progressClassName:
          "bg-blue-600",

        progressWidth: "60%",

        icon: "🛒",

        trackingMessage: isFr
          ? "La commande est en cours de préparation."
          : "The order is being prepared.",
      };
    }

    if (
      normalizedStatus === "ready" ||
      normalizedStatus === "ready for pickup"
    ) {
      return {
        label: isFr
          ? "Prête"
          : "Ready",

        badgeClassName:
          "bg-purple-100 text-purple-800",

        borderClassName:
          "border-purple-500",

        progressClassName:
          "bg-purple-600",

        progressWidth: "80%",

        icon: "📦",

        trackingMessage: isFr
          ? "La commande est prête."
          : "The order is ready.",
      };
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled"
    ) {
      return {
        label: isFr
          ? "Annulée"
          : "Cancelled",

        badgeClassName:
          "bg-red-100 text-red-800",

        borderClassName:
          "border-red-500",

        progressClassName:
          "bg-red-600",

        progressWidth: "100%",

        icon: "❌",

        trackingMessage: isFr
          ? "La commande a été annulée."
          : "The order has been cancelled.",
      };
    }

    return {
      label: isFr ? "En attente" : "Pending",

      badgeClassName:
        "bg-amber-100 text-amber-800",

      borderClassName:
        "border-amber-500",

      progressClassName:
        "bg-amber-500",

      progressWidth: "25%",

      icon: "⏳",

      trackingMessage: isFr
        ? "La commande a été reçue et attend le traitement du marchand."
        : "The order has been received and is awaiting merchant processing.",
    };
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(dateValue: string) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return isFr
        ? "Date indisponible"
        : "Date unavailable";
    }

    return new Intl.DateTimeFormat(
      isFr ? "fr-FR" : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  }

  // ============================================================
  // ORDER ITEMS
  // ============================================================

  function getDisplayItems(
    order: GroceryOrder
  ): DisplayOrderItem[] {
    const structuredItems =
      order.grocery_order_items ?? [];

    if (structuredItems.length > 0) {
      return structuredItems.map((item) => ({
        id: item.id,
        name: item.product_name,
        unit: item.product_unit,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        lineTotal:
          item.line_total !== null
            ? Number(item.line_total)
            : Number(item.unit_price) *
              Number(item.quantity),
        currency: normalizeCurrency(item.currency),
        structured: true,
      }));
    }

    return parseLegacyGroceryItems(
      order.grocery_items
    ).map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: null,
      lineTotal: item.lineTotal,
      currency: item.currency,
      structured: false,
    }));
  }

  // ============================================================
  // ORDER TOTAL
  // ============================================================

  function getOrderTotal(
    order: GroceryOrder,
    displayItems: DisplayOrderItem[]
  ) {
    if (
      order.total_amount !== null &&
      Number.isFinite(Number(order.total_amount))
    ) {
      return Number(order.total_amount);
    }

    return displayItems.reduce(
      (total, item) => total + item.lineTotal,
      0
    );
  }

  // ============================================================
  // ORDER CURRENCY
  // ============================================================

  function getOrderCurrency(
    order: GroceryOrder,
    displayItems: DisplayOrderItem[]
  ) {
    if (order.currency) {
      return normalizeCurrency(order.currency);
    }

    if (displayItems.length > 0) {
      return normalizeCurrency(
        displayItems[0].currency
      );
    }

    return "XAF";
  }

  // ============================================================
  // ORDER COUNT
  // ============================================================

  const orderCount = useMemo(
    () => orders.length,
    [orders]
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-gray-600">
                {isFr
                  ? "Chargement de vos commandes..."
                  : "Loading your grocery orders..."}
              </p>
            </div>
          </div>
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

      <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ================================================
              HEADER
          ================================================ */}

          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Link
                href="/dashboard"
                className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
              >
                ← {isFr ? "Retour" : "Back"}
              </Link>

              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                NdakoCare •{" "}
                {isFr
                  ? "Suivi des commandes"
                  : "Order Tracking"}
              </p>

              <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
                {isFr
                  ? "Mes commandes"
                  : "My Orders"}
              </h1>

              <p className="mt-3 max-w-3xl text-lg text-gray-600">
                {isFr
                  ? "Consultez vos commandes d'épicerie et suivez leur progression."
                  : "Review your grocery orders and track their progress."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/grocery"
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                +{" "}
                {isFr
                  ? "Nouvelle commande"
                  : "New Grocery Order"}
              </Link>

              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  void fetchOrders({
                    refresh: true,
                  })
                }
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing
                  ? isFr
                    ? "Actualisation..."
                    : "Refreshing..."
                  : isFr
                  ? "Actualiser"
                  : "Refresh"}
              </button>
            </div>
          </div>

          {/* ================================================
              SUMMARY
          ================================================ */}

          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              {isFr
                ? "Nombre total de commandes"
                : "Total grocery orders"}
            </p>

            <p className="mt-1 text-3xl font-bold text-green-700">
              {orderCount}
            </p>
          </div>

          {/* ================================================
              ERROR
          ================================================ */}

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          {/* ================================================
              EMPTY STATE
          ================================================ */}

          {orders.length === 0 ? (
            <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="mb-4 text-5xl">
                🛒
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                {isFr
                  ? "Aucune commande"
                  : "No Grocery Orders"}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                {isFr
                  ? "Vous n'avez pas encore passé de commande d'épicerie."
                  : "You have not placed a grocery order yet."}
              </p>

              <Link
                href="/grocery"
                className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
              >
                {isFr
                  ? "Passer une commande"
                  : "Place Grocery Order"}
              </Link>
            </section>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const status =
                  getStatusDetails(order.status);

                const items =
                  getDisplayItems(order);

                const orderCurrency =
                  getOrderCurrency(order, items);

                const orderTotal =
                  getOrderTotal(order, items);

                const subtotal =
                  order.subtotal !== null
                    ? Number(order.subtotal)
                    : items.reduce(
                        (sum, item) =>
                          sum + item.lineTotal,
                        0
                      );

                const deliveryFee =
                  Number(order.delivery_fee ?? 0);

                const merchantName =
                  order.merchants?.name ??
                  (isFr
                    ? "Marchand NdakoCare"
                    : "NdakoCare Merchant");

                const merchantCity =
                  order.merchants?.city ?? null;

                return (
                  <article
                    key={order.id}
                    className={`overflow-hidden rounded-3xl border-l-4 bg-white shadow-sm ${status.borderClassName}`}
                  >
                    {/* ======================================
                        ORDER HEADER
                    ====================================== */}

                    <div className="border-b border-gray-200 p-6 md:p-7">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {isFr
                                ? `Commande #${order.id}`
                                : `Order #${order.id}`}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-sm font-bold ${status.badgeClassName}`}
                            >
                              {status.icon}{" "}
                              {status.label}
                            </span>
                          </div>

                          {order.reference && (
                            <p className="font-mono text-sm font-semibold text-green-700">
                              {order.reference}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-gray-500">
                            {formatDate(
                              order.created_at
                            )}
                          </p>
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="text-sm text-gray-500">
                            {isFr
                              ? "Total"
                              : "Order Total"}
                          </p>

                          <p className="text-3xl font-extrabold text-green-700">
                            {formatMoney(
                              orderTotal,
                              orderCurrency,
                              language
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-6">
                        <div className="mb-2 flex justify-between gap-4 text-sm">
                          <span className="font-semibold text-gray-700">
                            {isFr
                              ? "Progression"
                              : "Order Progress"}
                          </span>

                          <span className="text-gray-500">
                            {status.trackingMessage}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${status.progressClassName}`}
                            style={{
                              width:
                                status.progressWidth,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ======================================
                        ORDER DETAILS
                    ====================================== */}

                    <div className="grid gap-6 border-b border-gray-200 p-6 md:grid-cols-2 md:p-7">
                      {/* Recipient */}
                      <div>
                        <h3 className="mb-3 font-bold text-gray-900">
                          {isFr
                            ? "Bénéficiaire"
                            : "Beneficiary"}
                        </h3>

                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Nom"
                                : "Name"}
                              :
                            </span>{" "}
                            <strong>
                              {order.recipient_name ??
                                "—"}
                            </strong>
                          </p>

                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Téléphone"
                                : "Phone"}
                              :
                            </span>{" "}
                            <strong>
                              {order.phone_number ??
                                "—"}
                            </strong>
                          </p>

                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Pays"
                                : "Country"}
                              :
                            </span>{" "}
                            <strong>
                              {order.country ?? "—"}

                              {order.country_code
                                ? ` (${order.country_code})`
                                : ""}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Merchant */}
                      <div>
                        <h3 className="mb-3 font-bold text-gray-900">
                          {isFr
                            ? "Exécution"
                            : "Fulfillment"}
                        </h3>

                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Magasin"
                                : "Merchant"}
                              :
                            </span>{" "}
                            <strong>
                              {merchantName}
                            </strong>
                          </p>

                          {merchantCity && (
                            <p>
                              <span className="text-gray-500">
                                {isFr
                                  ? "Ville"
                                  : "City"}
                                :
                              </span>{" "}
                              <strong>
                                {merchantCity}
                              </strong>
                            </p>
                          )}

                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Mode"
                                : "Method"}
                              :
                            </span>{" "}
                            <strong>
                              {order.delivery_type ===
                              "Pickup"
                                ? isFr
                                  ? "Retrait"
                                  : "Pickup"
                                : isFr
                                ? "Livraison"
                                : "Delivery"}
                            </strong>
                          </p>

                          <p>
                            <span className="text-gray-500">
                              {isFr
                                ? "Devise"
                                : "Currency"}
                              :
                            </span>{" "}
                            <strong>
                              {orderCurrency}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ======================================
                        ITEMS
                    ====================================== */}

                    <div className="p-6 md:p-7">
                      <h3 className="mb-4 text-xl font-bold text-gray-900">
                        {isFr
                          ? "Produits"
                          : "Products"}
                      </h3>

                      {items.length > 0 ? (
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                                  {getProductEmoji(
                                    item.name
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-bold text-gray-900">
                                    {translateProductName(
                                      item.name,
                                      language
                                    )}
                                  </h4>

                                  <p className="text-sm text-gray-500">
                                    {translateUnit(
                                      item.unit,
                                      language
                                    )}{" "}
                                    × {item.quantity}
                                  </p>

                                  {item.unitPrice !==
                                    null && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      {isFr
                                        ? "Prix unitaire"
                                        : "Unit price"}
                                      :{" "}
                                      {formatMoney(
                                        item.unitPrice,
                                        item.currency,
                                        language
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <p className="font-bold text-green-700">
                                {formatMoney(
                                  item.lineTotal,
                                  item.currency,
                                  language
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : order.grocery_items ? (
                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {isFr
                              ? "Commande historique"
                              : "Legacy Order"}
                          </p>

                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                            {order.grocery_items}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {isFr
                            ? "Aucun détail de produit disponible pour cette ancienne commande."
                            : "No product details are available for this legacy order."}
                        </p>
                      )}

                      {/* ==================================
                          FINANCIAL SUMMARY
                      ================================== */}

                      <div className="mt-6 ml-auto max-w-md rounded-2xl bg-gray-50 p-5">
                        <div className="space-y-3">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-600">
                              {isFr
                                ? "Sous-total"
                                : "Subtotal"}
                            </span>

                            <strong>
                              {formatMoney(
                                subtotal,
                                orderCurrency,
                                language
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-gray-600">
                              {isFr
                                ? "Frais de livraison"
                                : "Delivery fee"}
                            </span>

                            <strong>
                              {formatMoney(
                                deliveryFee,
                                orderCurrency,
                                language
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-4 border-t border-gray-300 pt-3 text-lg">
                            <strong>
                              Total
                            </strong>

                            <strong className="text-green-700">
                              {formatMoney(
                                orderTotal,
                                orderCurrency,
                                language
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* ==================================
                          ACTIONS
                      ================================== */}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href="/grocery"
                          className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                        >
                          {isFr
                            ? "Nouvelle commande"
                            : "New Order"}
                        </Link>

                        <Link
                          href="/activity"
                          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:border-green-600 hover:text-green-700"
                        >
                          {isFr
                            ? "Activité financière"
                            : "Financial Activity"}
                        </Link>

                        <Link
                          href="/wallet"
                          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:border-green-600 hover:text-green-700"
                        >
                          {isFr
                            ? "Portefeuille"
                            : "Wallet"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}