"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

type GroceryOrder = {
  id: number;
  recipient_name: string;
  phone_number: string;
  country: string;
  city: string;
  delivery_type: string;
  grocery_items: string;
  status: string;
  created_at: string;
};

type ParsedOrderItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  lineTotal: number;
  currency: string;
  rawLine: string;
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

function parseAmount(value: string): number {
  const normalizedValue = value
    .replace(/\s/g, "")
    .replace(/,/g, "");

  const amount = Number(normalizedValue);

  return Number.isFinite(amount) ? amount : 0;
}

function parseGroceryItems(
  groceryItems: string
): ParsedOrderItem[] {
  if (!groceryItems?.trim()) {
    return [];
  }

  const lines = groceryItems
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.flatMap((line, index) => {
    /*
     * Grocery V2 format:
     *
     * Rice — 5 kg × 3 — 19,500 XAF
     */
    const match = line.match(
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
        id: `${index}-${name}`,
        name: name.trim(),
        unit: unit.trim(),
        quantity: Number(quantity),
        lineTotal: parseAmount(lineTotal),
        currency,
        rawLine: line,
      },
    ];
  });
}

function getProductEmoji(productName: string): string {
  const normalizedName = productName
    .trim()
    .toLocaleLowerCase();

  const matchingKey = Object.keys(
    PRODUCT_EMOJIS
  ).find((key) =>
    normalizedName.includes(key)
  );

  return matchingKey
    ? PRODUCT_EMOJIS[matchingKey]
    : "🛒";
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [orders, setOrders] = useState<
    GroceryOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] =
    useState<number | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
      .from("grocery_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load grocery orders:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible de charger vos commandes."
          : "Unable to load your grocery orders."
      );

      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders((data as GroceryOrder[]) ?? []);
    setLoading(false);
  };

  const deleteOrder = async (
    orderId: number
  ) => {
    const confirmed = window.confirm(
      isFr
        ? "Voulez-vous vraiment supprimer cette commande ?"
        : "Are you sure you want to delete this grocery order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOrderId(orderId);
      setErrorMessage("");

      const { error } = await supabase
        .from("grocery_orders")
        .delete()
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) => order.id !== orderId
        )
      );
    } catch (error) {
      console.error(
        "Unable to delete grocery order:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible de supprimer cette commande."
          : "Unable to delete this order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
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
    ).format(parsedDate);
  };

  const formatPrice = (
    amount: number,
    currency: string
  ) => {
    return `${new Intl.NumberFormat(
      isFr ? "fr-FR" : "en-US"
    ).format(amount)} ${currency}`;
  };

  const getStatusDetails = (
    statusValue: string
  ): StatusDetails => {
    const normalizedStatus = statusValue
      ?.trim()
      .toLocaleLowerCase();

    if (
      normalizedStatus === "delivered" ||
      normalizedStatus === "completed"
    ) {
      return {
        label: isFr ? "Livrée" : "Delivered",
        badgeClassName:
          "bg-green-100 text-green-800",
        borderClassName: "border-green-500",
        progressClassName: "bg-green-600",
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
        borderClassName: "border-blue-500",
        progressClassName: "bg-blue-600",
        progressWidth: "60%",
        icon: "🛒",
        trackingMessage: isFr
          ? "La commande est en cours de préparation."
          : "The order is being prepared.",
      };
    }

    if (normalizedStatus === "cancelled") {
      return {
        label: isFr ? "Annulée" : "Cancelled",
        badgeClassName:
          "bg-red-100 text-red-800",
        borderClassName: "border-red-500",
        progressClassName: "bg-red-600",
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
      borderClassName: "border-amber-500",
      progressClassName: "bg-amber-500",
      progressWidth: "20%",
      icon: "📦",
      trackingMessage: isFr
        ? "La commande a été reçue."
        : "The order has been received.",
    };
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 px-4 py-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
              <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

              <h1 className="text-2xl font-bold text-gray-900">
                {isFr
                  ? "Chargement des commandes..."
                  : "Loading orders..."}
              </h1>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}

          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 font-semibold text-green-700">
                {isFr
                  ? "Historique des commandes"
                  : "Order History"}
              </p>

              <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
                {isFr
                  ? "Mes commandes de courses"
                  : "My Grocery Orders"}
              </h1>

              <p className="mt-3 text-lg text-gray-600">
                {isFr
                  ? "Consultez vos commandes, leurs produits et leur progression."
                  : "Review your grocery orders, products, and delivery progress."}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/grocery")
              }
              className="rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
            >
              +{" "}
              {isFr
                ? "Nouvelle commande"
                : "New Grocery Order"}
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Empty State */}

          {orders.length === 0 ? (
            <section className="rounded-3xl bg-white p-10 text-center shadow-lg">
              <div className="mb-5 text-6xl">
                🛒
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                {isFr
                  ? "Aucune commande"
                  : "No Orders Yet"}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                {isFr
                  ? "Vous n'avez pas encore passé de commande de courses."
                  : "You have not placed any grocery orders yet."}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/grocery")
                }
                className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
              >
                {isFr
                  ? "Passer ma première commande"
                  : "Place Your First Order"}
              </button>
            </section>
          ) : (
            <div className="space-y-7">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isFr={isFr}
                  deleting={
                    deletingOrderId === order.id
                  }
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                  getStatusDetails={
                    getStatusDetails
                  }
                  onDelete={deleteOrder}
                  onOrderAgain={() =>
                    router.push("/grocery")
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function OrderCard({
  order,
  isFr,
  deleting,
  formatDate,
  formatPrice,
  getStatusDetails,
  onDelete,
  onOrderAgain,
}: {
  order: GroceryOrder;
  isFr: boolean;
  deleting: boolean;
  formatDate: (dateValue: string) => string;
  formatPrice: (
    amount: number,
    currency: string
  ) => string;
  getStatusDetails: (
    statusValue: string
  ) => StatusDetails;
  onDelete: (orderId: number) => void;
  onOrderAgain: () => void;
}) {
  const parsedItems = useMemo(
    () =>
      parseGroceryItems(
        order.grocery_items ?? ""
      ),
    [order.grocery_items]
  );

  const statusDetails = getStatusDetails(
    order.status
  );

  const orderTotal = useMemo(() => {
    return parsedItems.reduce(
      (total, item) =>
        total + item.lineTotal,
      0
    );
  }, [parsedItems]);

  const currency =
    parsedItems[0]?.currency ?? "XAF";

  const hasStructuredItems =
    parsedItems.length > 0;

  return (
    <article
      className={`overflow-hidden rounded-3xl border-l-8 bg-white shadow-lg ${statusDetails.borderClassName}`}
    >
      {/* Order Header */}

      <header className="border-b border-gray-200 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="font-semibold text-green-700">
                {isFr ? "Commande" : "Order"} #
                {order.id}
              </p>

              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${statusDetails.badgeClassName}`}
              >
                {statusDetails.label}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              {order.recipient_name}
            </h2>

            <p className="mt-2 text-gray-500">
              {formatDate(order.created_at)}
            </p>
          </div>

          {hasStructuredItems && (
            <div className="rounded-2xl bg-green-50 px-5 py-4 md:text-right">
              <p className="text-sm font-semibold text-gray-500">
                {isFr
                  ? "Total des produits"
                  : "Product Total"}
              </p>

              <p className="mt-1 text-2xl font-extrabold text-green-700">
                {formatPrice(
                  orderTotal,
                  currency
                )}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-3">
        {/* Main Details */}

        <div className="space-y-7 lg:col-span-2">
          {/* Recipient and Destination */}

          <section>
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              {isFr
                ? "Informations de réception"
                : "Recipient and Fulfillment"}
            </h3>

            <div className="grid gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
              <OrderDetail
                label={
                  isFr ? "Téléphone" : "Phone"
                }
                value={order.phone_number}
              />

              <OrderDetail
                label={isFr ? "Pays" : "Country"}
                value={order.country}
              />

              <OrderDetail
                label={isFr ? "Ville" : "City"}
                value={order.city}
              />

              <OrderDetail
                label={
                  isFr
                    ? "Mode de réception"
                    : "Fulfillment"
                }
                value={
                  isFr
                    ? order.delivery_type ===
                      "Delivery"
                      ? "Livraison"
                      : "Retrait"
                    : order.delivery_type
                }
              />
            </div>
          </section>

          {/* Grocery V2 Items */}

          <section>
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              {isFr
                ? "Produits commandés"
                : "Ordered Products"}
            </h3>

            {hasStructuredItems ? (
              <div className="space-y-3">
                {parsedItems.map((item) => (
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
                          {item.name}
                        </h4>

                        <p className="text-sm text-gray-500">
                          {item.unit} ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="font-bold text-green-700">
                      {formatPrice(
                        item.lineTotal,
                        item.currency
                      )}
                    </p>
                  </div>
                ))}

                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <span className="font-bold text-gray-700">
                    {isFr
                      ? "Total"
                      : "Total"}
                  </span>

                  <span className="text-xl font-extrabold text-green-700">
                    {formatPrice(
                      orderTotal,
                      currency
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-line rounded-2xl bg-gray-50 p-5 leading-8 text-gray-700">
                {order.grocery_items}
              </div>
            )}
          </section>
        </div>

        {/* Tracking Sidebar */}

        <aside className="h-fit rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900">
            {isFr
              ? "Suivi de commande"
              : "Order Tracking"}
          </h3>

          <div className="mt-5">
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all ${statusDetails.progressClassName}`}
                style={{
                  width:
                    statusDetails.progressWidth,
                }}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4">
              <div className="flex gap-3">
                <span className="text-2xl">
                  {statusDetails.icon}
                </span>

                <div>
                  <p className="font-bold text-gray-900">
                    {statusDetails.label}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      statusDetails.trackingMessage
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <TrackingStep
                label={
                  isFr
                    ? "Commande reçue"
                    : "Order received"
                }
                complete={
                  order.status
                    .toLocaleLowerCase() !==
                  "cancelled"
                }
              />

              <TrackingStep
                label={
                  isFr
                    ? "En traitement"
                    : "Processing"
                }
                complete={[
                  "processing",
                  "delivered",
                  "completed",
                ].includes(
                  order.status
                    .trim()
                    .toLocaleLowerCase()
                )}
              />

              <TrackingStep
                label={
                  isFr
                    ? "Livrée"
                    : "Delivered"
                }
                complete={[
                  "delivered",
                  "completed",
                ].includes(
                  order.status
                    .trim()
                    .toLocaleLowerCase()
                )}
              />
            </div>
          </div>

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              onClick={onOrderAgain}
              className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white transition hover:bg-green-800"
            >
              {isFr
                ? "Commander à nouveau"
                : "Order Again"}
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete(order.id)
              }
              disabled={deleting}
              className="rounded-xl border border-red-300 px-4 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting
                ? isFr
                  ? "Suppression..."
                  : "Deleting..."
                : isFr
                ? "Supprimer la commande"
                : "Delete Order"}
            </button>
          </div>
        </aside>
      </div>
    </article>
  );
}

function OrderDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

function TrackingStep({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          complete
            ? "bg-green-700 text-white"
            : "border-2 border-gray-300 bg-white text-gray-400"
        }`}
      >
        {complete ? "✓" : ""}
      </div>

      <p
        className={
          complete
            ? "font-semibold text-gray-900"
            : "text-gray-400"
        }
      >
        {label}
      </p>
    </div>
  );
}