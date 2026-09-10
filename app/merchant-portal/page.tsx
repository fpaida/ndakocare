"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

// ============================================================
// TYPES
// ============================================================

type Merchant = {
  id: string;
  name: string;
  merchant_type: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  country_code: string | null;
  currency: string | null;
  city: string | null;
  address: string | null;
  is_active: boolean | null;
  user_id: string | null;
};

type Pharmacy = {
  id: string;
  merchant_id: string | null;
  name: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  currency: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean | null;
};

type Medicine = {
  id: string;
  pharmacy_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  stock: number | null;
  currency: string | null;
  is_active: boolean | null;
};

type GroceryOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_unit: string | null;
  quantity: number;
  unit_price: number;
  line_total: number | null;
  currency: string;
};

type GroceryOrder = {
  id: number;
  user_id: string | null;
  beneficiary_id: string | null;
  merchant_id: string | null;
  recipient_name: string | null;
  phone_number: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  delivery_type: string | null;
  currency: string | null;
  subtotal: number | null;
  delivery_fee: number | null;
  total_amount: number | null;
  reference: string | null;
  status: string | null;
  created_at: string;
  grocery_order_items?: GroceryOrderItem[];
};

type Beneficiary = {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  country: string;
  relationship: string | null;
  provider: string | null;
  country_code: string | null;
};


type PharmacyOrder = {
  id: string;
  user_id: string | null;
  beneficiary_id: string | null;
  medicine_id: string | null;
  medicine_name: string | null;
  quantity: number | null;
  amount: number | null;
  currency: string | null;
  reference: string | null;
  idempotency_key: string | null;
  status: string | null;
  created_at: string;
  medicines?: Medicine | Medicine[] | null;
  beneficiary?: Beneficiary | null;
};

type SchoolPayment = {
  id: string;
  user_id: string | null;
  merchant_id: string | null;
  student_name: string;
  school_name: string;
  country: string | null;
  amount: number | null;
  currency: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  class_level: string | null;
};

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Ready"
  | "Delivered";

// ============================================================
// TRANSLATIONS
// ============================================================

const PRODUCT_TRANSLATIONS_FR: Record<string, string> = {
  "Drinking Water": "Eau potable",
  "Bottled Water": "Eau en bouteille",
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

// ============================================================
// HELPERS
// ============================================================

function normalizeCurrency(
  value?: string | null
) {
  return (value ?? "").trim().toUpperCase();
}

function translateProductName(
  name: string,
  language: string
) {
  if (language !== "fr") {
    return name;
  }

  return PRODUCT_TRANSLATIONS_FR[name] ?? name;
}

function translateUnit(
  unit: string | null,
  language: string
) {
  if (!unit) {
    return language === "fr"
      ? "Article"
      : "Item";
  }

  if (language !== "fr") {
    return unit;
  }

  return UNIT_TRANSLATIONS_FR[unit] ?? unit;
}

function formatMoney(
  amount: number,
  currency: string,
  language: string
) {
  const normalizedCurrency =
    normalizeCurrency(currency);

  const formatted =
    new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US",
      {
        maximumFractionDigits: 0,
      }
    ).format(amount);

  if (normalizedCurrency === "XAF") {
    return `FCFA ${formatted}`;
  }

  if (normalizedCurrency === "XOF") {
    return `CFA ${formatted}`;
  }

  try {
    return new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : "en-US",
      {
        style: "currency",
        currency:
          normalizedCurrency || "USD",
      }
    ).format(amount);
  } catch {
    return `${formatted} ${normalizedCurrency}`;
  }
}

function getMedicineFromOrder(
  order: PharmacyOrder
): Medicine | null {
  if (!order.medicines) {
    return null;
  }

  if (Array.isArray(order.medicines)) {
    return order.medicines[0] ?? null;
  }

  return order.medicines;
}

// ============================================================
// PAGE
// ============================================================

export default function MerchantPortalPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [merchant, setMerchant] =
    useState<Merchant | null>(null);

  const [pharmacy, setPharmacy] =
    useState<Pharmacy | null>(null);

  const [groceryOrders, setGroceryOrders] =
    useState<GroceryOrder[]>([]);

  const [pharmacyOrders, setPharmacyOrders] =
    useState<PharmacyOrder[]>([]);

  const [schoolPayments, setSchoolPayments] =
    useState<SchoolPayment[]>([]);

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState<string | number | null>(
    null
  );

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const merchantType =
    merchant?.merchant_type
      ?.trim()
      .toLowerCase() ?? "";

  const isGroceryMerchant =
    merchantType === "grocery";

  const isPharmacyMerchant =
    merchantType === "pharmacy";

  const isSchoolMerchant =
    merchantType === "school";

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");
        setSuccessMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        // ------------------------------------------------------
        // AUTHENTICATED MERCHANT
        // ------------------------------------------------------

        const {
          data: merchantData,
          error: merchantError,
        } = await supabase
          .from("merchants")
          .select(
            `
              id,
              name,
              merchant_type,
              email,
              phone,
              country,
              country_code,
              currency,
              city,
              address,
              is_active,
              user_id
            `
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (merchantError) {
          throw merchantError;
        }

        // Normal customer trying /merchant-portal
        if (!merchantData) {
          router.replace("/dashboard");
          return;
        }

        const authenticatedMerchant =
          merchantData as Merchant;

        setMerchant(authenticatedMerchant);

        const type =
          authenticatedMerchant.merchant_type
            ?.trim()
            .toLowerCase() ?? "";

        // ------------------------------------------------------
        // GROCERY MERCHANT
        // ------------------------------------------------------

        if (type === "grocery") {
          setPharmacy(null);
          setPharmacyOrders([]);

          const {
            data: ordersData,
            error: ordersError,
          } = await supabase
            .from("grocery_orders")
            .select(
              `
                id,
                user_id,
                beneficiary_id,
                merchant_id,
                recipient_name,
                phone_number,
                city,
                country,
                country_code,
                delivery_type,
                currency,
                subtotal,
                delivery_fee,
                total_amount,
                reference,
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
                  currency
                )
              `
            )
            .eq(
              "merchant_id",
              authenticatedMerchant.id
            )
            .order("created_at", {
              ascending: false,
            });

          if (ordersError) {
            throw ordersError;
          }

          const normalizedOrders =
            (
              (ordersData ??
                []) as unknown as GroceryOrder[]
            ).map((order) => ({
              ...order,

              subtotal:
                order.subtotal === null
                  ? null
                  : Number(
                      order.subtotal
                    ),

              delivery_fee:
                order.delivery_fee === null
                  ? null
                  : Number(
                      order.delivery_fee
                    ),

              total_amount:
                order.total_amount === null
                  ? null
                  : Number(
                      order.total_amount
                    ),

              grocery_order_items:
                order.grocery_order_items?.map(
                  (item) => ({
                    ...item,

                    quantity: Number(
                      item.quantity
                    ),

                    unit_price: Number(
                      item.unit_price
                    ),

                    line_total:
                      item.line_total === null
                        ? null
                        : Number(
                            item.line_total
                          ),

                    currency:
                      normalizeCurrency(
                        item.currency
                      ),
                  })
                ) ?? [],
            }));

          setGroceryOrders(
            normalizedOrders
          );

          return;
        }

        // ------------------------------------------------------
        // PHARMACY MERCHANT
        // ------------------------------------------------------

        if (type === "pharmacy") {
          setGroceryOrders([]);

          const {
            data: pharmacyData,
            error: pharmacyError,
          } = await supabase
            .from("pharmacies")
            .select(
              `
                id,
                merchant_id,
                name,
                city,
                country,
                country_code,
                currency,
                phone,
                address,
                is_active
              `
            )
            .eq(
              "merchant_id",
              authenticatedMerchant.id
            )
            .eq("is_active", true)
            .maybeSingle();

          if (pharmacyError) {
            throw pharmacyError;
          }

          if (!pharmacyData) {
            setPharmacy(null);
            setPharmacyOrders([]);

            setErrorMessage(
              isFr
                ? "Aucune pharmacie active n'est associée à ce compte marchand."
                : "No active pharmacy is associated with this merchant account."
            );

            return;
          }

          const authenticatedPharmacy =
            pharmacyData as Pharmacy;

          setPharmacy(
            authenticatedPharmacy
          );

          /*
           * RLS restricts pharmacy_orders
           * to orders belonging to this
           * authenticated pharmacy merchant.
           */

          const {
            data: pharmacyOrdersData,
            error: pharmacyOrdersError,
          } = await supabase
            .from("pharmacy_orders")
            .select(
              `
                id,
                user_id,
                beneficiary_id,
                medicine_id,
                medicine_name,
                quantity,
                amount,
                currency,
                reference,
                idempotency_key,
                status,
                created_at,
                medicines (
                  id,
                  pharmacy_id,
                  name,
                  description,
                  price,
                  stock,
                  currency,
                  is_active
                )
              `
            )
            .order("created_at", {
              ascending: false,
            });

          if (pharmacyOrdersError) {
            throw pharmacyOrdersError;
          }

          const beneficiaryIds = Array.from(
            new Set(
              (pharmacyOrdersData ?? [])
                .map((order) => order.beneficiary_id)
                .filter((id): id is string => Boolean(id))
            )
          );

          const beneficiaryMap = new Map<string, Beneficiary>();

          if (beneficiaryIds.length > 0) {
            const {
              data: beneficiariesData,
              error: beneficiariesError,
            } = await supabase
              .from("beneficiaries")
              .select(
                `
                  id,
                  user_id,
                  name,
                  phone,
                  country,
                  relationship,
                  provider,
                  country_code
                `
              )
              .in("id", beneficiaryIds);

            if (beneficiariesError) {
              throw beneficiariesError;
            }

            for (const beneficiary of (beneficiariesData ?? []) as Beneficiary[]) {
              beneficiaryMap.set(beneficiary.id, beneficiary);
            }
          }

          const normalizedPharmacyOrders =
            (
              (pharmacyOrdersData ??
                []) as unknown as PharmacyOrder[]
            )
              .map((order) => {
                const medicine =
                  getMedicineFromOrder(
                    order
                  );

                return {
                  ...order,

                  beneficiary: order.beneficiary_id
                    ? beneficiaryMap.get(order.beneficiary_id) ?? null
                    : null,

                  quantity:
                    order.quantity === null
                      ? null
                      : Number(
                          order.quantity
                        ),

                  amount:
                    order.amount === null
                      ? null
                      : Number(
                          order.amount
                        ),

                  medicines: medicine
                    ? {
                        ...medicine,
                        price:
                          medicine.price ===
                          null
                            ? null
                            : Number(
                                medicine.price
                              ),

                        stock:
                          medicine.stock ===
                          null
                            ? null
                            : Number(
                                medicine.stock
                              ),
                      }
                    : null,
                };
              })
              .filter((order) => {
                const medicine =
                  getMedicineFromOrder(
                    order
                  );

                return (
                  !medicine ||
                  medicine.pharmacy_id ===
                    authenticatedPharmacy.id
                );
              });

          setPharmacyOrders(
            normalizedPharmacyOrders
          );

          return;
        }

        // ------------------------------------------------------
        // SCHOOL MERCHANT
        // ------------------------------------------------------

        if (type === "school") {
          setGroceryOrders([]);
          setPharmacyOrders([]);
          setPharmacy(null);

          const {
            data: schoolPaymentsData,
            error: schoolPaymentsError,
          } = await supabase
            .from("school_payments")
            .select(
              `
                id,
                user_id,
                merchant_id,
                student_name,
                school_name,
                country,
                amount,
                currency,
                notes,
                status,
                created_at,
                class_level
              `
            )
            .eq(
              "merchant_id",
              authenticatedMerchant.id
            )
            .order("created_at", {
              ascending: false,
            });

          if (schoolPaymentsError) {
            throw schoolPaymentsError;
          }

          const normalizedSchoolPayments =
            (
              (schoolPaymentsData ?? []) as SchoolPayment[]
            ).map((payment) => ({
              ...payment,
              amount:
                payment.amount === null
                  ? null
                  : Number(payment.amount),
            }));

          setSchoolPayments(
            normalizedSchoolPayments
          );

          return;
        }


        // ------------------------------------------------------
        // UNSUPPORTED MERCHANT TYPE
        // ------------------------------------------------------

        setGroceryOrders([]);
	setPharmacyOrders([]);
	setSchoolPayments([]);
	setPharmacy(null);

        setErrorMessage(
          isFr
            ? `Le type de marchand « ${
                authenticatedMerchant.merchant_type ??
                "inconnu"
              } » n'est pas encore pris en charge.`
            : `Merchant type "${
                authenticatedMerchant.merchant_type ??
                "unknown"
              }" is not supported yet.`
        );
      } catch (error) {
        console.error(
          "Unable to load merchant portal:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        setErrorMessage(
          isFr
            ? `Impossible de charger le portail marchand. ${message}`
            : `Unable to load the merchant portal. ${message}`
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isFr, router]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ==========================================================
  // FILTER ORDERS
  // ==========================================================

  const filteredGroceryOrders =
    useMemo(() => {
      return groceryOrders.filter(
        (order) => {
          if (
            selectedStatus === "all"
          ) {
            return true;
          }

          return (
            (order.status ?? "Pending")
              .trim()
              .toLowerCase() ===
            selectedStatus.toLowerCase()
          );
        }
      );
    }, [
      groceryOrders,
      selectedStatus,
    ]);

  const filteredPharmacyOrders =
    useMemo(() => {
      return pharmacyOrders.filter(
        (order) => {
          if (
            selectedStatus === "all"
          ) {
            return true;
          }

          return (
            (order.status ?? "Pending")
              .trim()
              .toLowerCase() ===
            selectedStatus.toLowerCase()
          );
        }
      );
    }, [
      pharmacyOrders,
      selectedStatus,
    ]);

  const filteredSchoolPayments =
    useMemo(() => {
      return schoolPayments.filter(
        (payment) => {
          if (selectedStatus === "all") {
            return true;
          }

          return (
            (payment.status ?? "Pending")
              .trim()
              .toLowerCase() ===
            selectedStatus.toLowerCase()
          );
        }
      );
    }, [
      schoolPayments,
      selectedStatus,
    ]);

  const schoolPendingTotal =
    useMemo(() => {
      return schoolPayments
        .filter(
          (payment) =>
            (payment.status ?? "Pending")
              .trim()
              .toLowerCase() === "pending"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount ?? 0),
          0
        );
    }, [schoolPayments]);

  const schoolCompletedTotal =
    useMemo(() => {
      return schoolPayments
        .filter(
          (payment) =>
            (payment.status ?? "Pending")
              .trim()
              .toLowerCase() === "completed"
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount ?? 0),
          0
        );
    }, [schoolPayments]);

  const activeOrderStatuses =
    isSchoolMerchant
      ? schoolPayments
      : isPharmacyMerchant
      ? pharmacyOrders
      : groceryOrders;

  // ==========================================================
  // STATUS
  // ==========================================================

  function getStatusCount(
    status: string
  ) {
    return activeOrderStatuses.filter(
      (order) =>
        (order.status ?? "Pending")
          .trim()
          .toLowerCase() ===
        status.toLowerCase()
    ).length;
  }

  function getStatusLabel(
    status?: string | null
  ) {
    const value = (
      status ?? "Pending"
    )
      .trim()
      .toLowerCase();

    switch (value) {
      case "processing":
      case "preparing":
        return isFr
          ? "En traitement"
          : "Processing";

      case "ready":
      case "ready for pickup":
        return isFr
          ? "Prête"
          : "Ready";

      case "completed":
        return isSchoolMerchant
          ? isFr
            ? "Terminée"
            : "Completed"
          : isFr
          ? "Livrée"
          : "Delivered";

      case "delivered":
        return isFr
          ? "Livrée"
          : "Delivered";

      case "cancelled":
      case "canceled":
        return isFr
          ? "Annulée"
          : "Cancelled";

      default:
        return isFr
          ? "En attente"
          : "Pending";
    }
  }

  function getStatusClass(
    status?: string | null
  ) {
    const value = (
      status ?? "Pending"
    )
      .trim()
      .toLowerCase();

    switch (value) {
      case "processing":
      case "preparing":
        return "bg-blue-100 text-blue-800";

      case "ready":
      case "ready for pickup":
        return "bg-purple-100 text-purple-800";

      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800";

      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(
    dateValue: string
  ) {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
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

  // ==========================================================
  // GROCERY TOTAL
  // ==========================================================

  function getGroceryOrderTotal(
    order: GroceryOrder
  ) {
    if (
      order.total_amount !== null
    ) {
      return Number(
        order.total_amount
      );
    }

    return (
      order.grocery_order_items?.reduce(
        (sum, item) => {
          const lineTotal =
            item.line_total !== null
              ? Number(
                  item.line_total
                )
              : Number(
                  item.unit_price
                ) *
                Number(
                  item.quantity
                );

          return sum + lineTotal;
        },
        0
      ) ?? 0
    );
  }

  // ==========================================================
  // GROCERY STATUS UPDATE
  // ==========================================================

  async function updateGroceryOrderStatus(
    order: GroceryOrder,
    newStatus: OrderStatus
  ) {
    if (!merchant) {
      return;
    }

    const currentStatus =
      order.status ?? "Pending";

    if (
      currentStatus
        .trim()
        .toLowerCase() ===
      newStatus.toLowerCase()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isFr
          ? `Passer la commande #${
              order.id
            } de « ${getStatusLabel(
              currentStatus
            )} » à « ${getStatusLabel(
              newStatus
            )} » ?`
          : `Change Order #${
              order.id
            } from "${getStatusLabel(
              currentStatus
            )}" to "${getStatusLabel(
              newStatus
            )}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);
      setErrorMessage("");
      setSuccessMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("grocery_orders")
        .update({
          status: newStatus,
        })
        .eq("id", order.id)
        .eq(
          "merchant_id",
          merchant.id
        )
        .select("id, status")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          isFr
            ? "La commande n'a pas pu être mise à jour."
            : "The order could not be updated."
        );
      }

      setGroceryOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              order.id
                ? {
                    ...currentOrder,
                    status:
                      newStatus,
                  }
                : currentOrder
          )
      );

      setSuccessMessage(
        isFr
          ? `Commande #${
              order.id
            } mise à jour : ${getStatusLabel(
              newStatus
            )}.`
          : `Order #${
              order.id
            } updated to ${getStatusLabel(
              newStatus
            )}.`
      );
    } catch (error) {
      console.error(
        "Unable to update grocery order:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setErrorMessage(
        isFr
          ? `Impossible de mettre à jour la commande. ${message}`
          : `Unable to update the order. ${message}`
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ==========================================================
  // PHARMACY STATUS UPDATE
  // ==========================================================

  async function updatePharmacyOrderStatus(
    order: PharmacyOrder,
    newStatus: OrderStatus
  ) {
    const currentStatus =
      order.status ?? "Pending";

    if (
      currentStatus
        .trim()
        .toLowerCase() ===
      newStatus.toLowerCase()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isFr
          ? `Passer la commande de pharmacie de « ${getStatusLabel(
              currentStatus
            )} » à « ${getStatusLabel(
              newStatus
            )} » ?`
          : `Change pharmacy order from "${getStatusLabel(
              currentStatus
            )}" to "${getStatusLabel(
              newStatus
            )}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingOrderId(
        order.id
      );

      setErrorMessage("");
      setSuccessMessage("");

      /*
       * The pharmacy RLS policy verifies:
       *
       * pharmacy_orders.medicine_id
       *       ↓
       * medicines.pharmacy_id
       *       ↓
       * pharmacies.merchant_id
       *       ↓
       * merchants.user_id = auth.uid()
       */

      const {
        data,
        error,
      } = await supabase
        .from("pharmacy_orders")
        .update({
          status: newStatus,
        })
        .eq("id", order.id)
        .select("id, status")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          isFr
            ? "La commande de pharmacie n'a pas pu être mise à jour."
            : "The pharmacy order could not be updated."
        );
      }

      setPharmacyOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              order.id
                ? {
                    ...currentOrder,
                    status:
                      newStatus,
                  }
                : currentOrder
          )
      );

      setSuccessMessage(
        isFr
          ? `Commande de pharmacie mise à jour : ${getStatusLabel(
              newStatus
            )}.`
          : `Pharmacy order updated to ${getStatusLabel(
              newStatus
            )}.`
      );
    } catch (error) {
      console.error(
        "Unable to update pharmacy order:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setErrorMessage(
        isFr
          ? `Impossible de mettre à jour la commande de pharmacie. ${message}`
          : `Unable to update the pharmacy order. ${message}`
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ==========================================================
  // SCHOOL PAYMENT STATUS UPDATE
  // ==========================================================

  async function updateSchoolPaymentStatus(
    payment: SchoolPayment,
    newStatus: "Pending" | "Completed"
  ) {
    if (!merchant) {
      return;
    }

    const currentStatus =
      payment.status ?? "Pending";

    if (
      currentStatus
        .trim()
        .toLowerCase() ===
      newStatus.toLowerCase()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isFr
          ? `Passer le paiement scolaire de « ${getStatusLabel(
              currentStatus
            )} » à « ${getStatusLabel(
              newStatus
            )} » ?`
          : `Change school payment from "${getStatusLabel(
              currentStatus
            )}" to "${getStatusLabel(
              newStatus
            )}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingOrderId(payment.id);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } =
        await supabase
          .from("school_payments")
          .update({
            status: newStatus,
          })
          .eq("id", payment.id)
          .eq("merchant_id", merchant.id)
          .select("id, status")
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          isFr
            ? "Le paiement scolaire n'a pas pu être mis à jour."
            : "The school payment could not be updated."
        );
      }

      setSchoolPayments(
        (currentPayments) =>
          currentPayments.map(
            (currentPayment) =>
              currentPayment.id === payment.id
                ? {
                    ...currentPayment,
                    status: newStatus,
                  }
                : currentPayment
          )
      );

      setSuccessMessage(
        isFr
          ? `Paiement scolaire mis à jour : ${getStatusLabel(
              newStatus
            )}.`
          : `School payment updated to ${getStatusLabel(
              newStatus
            )}.`
      );
    } catch (error) {
      console.error(
        "Unable to update school payment:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setErrorMessage(
        isFr
          ? `Impossible de mettre à jour le paiement scolaire. ${message}`
          : `Unable to update the school payment. ${message}`
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 p-6">
          <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-gray-600">
              {isFr
                ? "Chargement du portail marchand..."
                : "Loading merchant portal..."}
            </p>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

              <div>
                <Link
                  href="/merchant-portal"
                  className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
                >
                  ←{" "}
                  {isFr
                    ? "Retour"
                    : "Back"}
                </Link>

                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                  NdakoCare •{" "}
                  {isFr
                    ? "Opérations marchand"
                    : "Merchant Operations"}
                </p>

                <h1 className="text-4xl font-bold text-gray-900">
                  {isSchoolMerchant
                    ? "🏫"
                    : isPharmacyMerchant
                    ? "💊"
                    : "🏪"}{" "}
                  {isSchoolMerchant
                    ? isFr
                      ? "Portail Scolaire"
                      : "School Portal"
                    : isPharmacyMerchant
                    ? isFr
                      ? "Portail Pharmacie"
                      : "Pharmacy Portal"
                    : isFr
                    ? "Portail Marchand"
                    : "Merchant Portal"}
                </h1>

                <p className="mt-3 max-w-3xl text-gray-600">
                  {isSchoolMerchant
                    ? isFr
                      ? "Gérez les demandes de frais scolaires, suivez les paiements et mettez à jour leur statut."
                      : "Manage school fee requests, track payments, and update payment status."
                    : isPharmacyMerchant
                    ? isFr
                      ? "Gérez les commandes de médicaments, préparez les produits et mettez à jour leur statut."
                      : "Manage medicine orders, prepare prescriptions and products, and update fulfillment status."
                    : isFr
                    ? "Gérez les commandes reçues, préparez les produits et mettez à jour leur statut."
                    : "Manage incoming orders, prepare products, and update fulfillment status."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadData(true)
                }
                disabled={refreshing}
                className="rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
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
          </section>

          {/* ==================================================
              MESSAGES
          ================================================== */}

          {successMessage && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-800">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              {errorMessage}
            </div>
          )}

          {/* ==================================================
              MERCHANT
          ================================================== */}

          {merchant && (
            <>
              <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      {isFr
                        ? "Compte marchand connecté"
                        : "Signed-in Merchant"}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {isSchoolMerchant
                        ? "🏫"
                        : isPharmacyMerchant
                        ? "💊"
                        : "🏪"}{" "}
                      {merchant.name}
                    </h2>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">
                    {isFr
                      ? "Actif"
                      : "Active"}
                  </span>

                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      {isFr
                        ? "Nom"
                        : "Name"}
                    </p>

                    <p className="font-bold">
                      {merchant.name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Type
                    </p>

                    <p className="font-bold">
                      {isSchoolMerchant
                        ? isFr
                          ? "École"
                          : "School"
                        : isPharmacyMerchant
                        ? isFr
                          ? "Pharmacie"
                          : "Pharmacy"
                        : merchant.merchant_type ??
                          "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      {isFr
                        ? "Localisation"
                        : "Location"}
                    </p>

                    <p className="font-bold">
                      {isPharmacyMerchant
                        ? pharmacy?.city ??
                          merchant.city ??
                          "—"
                        : merchant.city ??
                          "—"}

                      {isPharmacyMerchant &&
                      pharmacy?.country
                        ? `, ${pharmacy.country}`
                        : !isPharmacyMerchant &&
                          merchant.country
                        ? `, ${merchant.country}`
                        : ""}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      {isFr
                        ? "Devise"
                        : "Currency"}
                    </p>

                    <p className="font-bold">
                      {isPharmacyMerchant
                        ? pharmacy?.currency ??
                          merchant.currency ??
                          "—"
                        : merchant.currency ??
                          "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ==============================================
                  COUNTS
              ============================================== */}

              {isSchoolMerchant ? (
                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Paiements en attente" : "Pending Payments"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-amber-700">
                      {getStatusCount("Pending")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Paiements terminés" : "Completed Payments"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-green-700">
                      {getStatusCount("Completed")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Total en attente" : "Pending Total"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">
                      {formatMoney(
                        schoolPendingTotal,
                        merchant.currency ?? "XAF",
                        language
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Total reçu" : "Total Received"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-700">
                      {formatMoney(
                        schoolCompletedTotal,
                        merchant.currency ?? "XAF",
                        language
                      )}
                    </p>
                  </div>

                </section>
              ) : (
                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "En attente" : "Pending"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-amber-700">
                      {getStatusCount("Pending")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "En traitement" : "Processing"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">
                      {getStatusCount("Processing")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Prêtes" : "Ready"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-purple-700">
                      {getStatusCount("Ready")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      {isFr ? "Livrées" : "Delivered"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-green-700">
                      {getStatusCount("Delivered")}
                    </p>
                  </div>

                </section>
              )}

              {/* ==============================================
                  ORDER / PAYMENT FILTER
              ============================================== */}

              <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                  <div>
                    <h2 className="text-xl font-bold">
                      {isSchoolMerchant
                        ? isFr
                          ? "Paiements scolaires"
                          : "School Payments"
                        : isPharmacyMerchant
                        ? isFr
                          ? "Commandes de pharmacie"
                          : "Pharmacy Orders"
                        : isFr
                        ? "Commandes"
                        : "Orders"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {isSchoolMerchant
                        ? filteredSchoolPayments.length
                        : isPharmacyMerchant
                        ? filteredPharmacyOrders.length
                        : filteredGroceryOrders.length}{" "}
                      {isSchoolMerchant
                        ? isFr
                          ? "paiement(s)"
                          : "payment(s)"
                        : isFr
                        ? "commande(s)"
                        : "order(s)"}
                    </p>
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value)
                    }
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3"
                  >
                    <option value="all">
                      {isFr ? "Tous les statuts" : "All Statuses"}
                    </option>

                    <option value="Pending">
                      {isFr ? "En attente" : "Pending"}
                    </option>

                    {isSchoolMerchant ? (
                      <option value="Completed">
                        {isFr ? "Terminée" : "Completed"}
                      </option>
                    ) : (
                      <>
                        <option value="Processing">
                          {isFr ? "En traitement" : "Processing"}
                        </option>
                        <option value="Ready">
                          {isFr ? "Prête" : "Ready"}
                        </option>
                        <option value="Delivered">
                          {isFr ? "Livrée" : "Delivered"}
                        </option>
                      </>
                    )}
                  </select>

                </div>
              </section>

              {/* ==============================================
                  SCHOOL PAYMENTS
              ============================================== */}

              {isSchoolMerchant &&
                (filteredSchoolPayments.length === 0 ? (
                  <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
                    <div className="mb-3 text-5xl">🏫</div>
                    <h2 className="text-2xl font-bold">
                      {isFr ? "Aucun paiement scolaire" : "No School Payments"}
                    </h2>
                    <p className="mt-2 text-gray-500">
                      {isFr
                        ? "Aucun paiement scolaire ne correspond au statut sélectionné."
                        : "No school payments match the selected status."}
                    </p>
                  </section>
                ) : (
                  <div className="space-y-6">
                    {filteredSchoolPayments.map((payment) => {
                      const status = payment.status ?? "Pending";
                      const currency = normalizeCurrency(
                        payment.currency ?? merchant.currency ?? "XAF"
                      );
                      const amount = Number(payment.amount ?? 0);
                      const isCompleted =
                        status.trim().toLowerCase() === "completed";

                      return (
                        <article
                          key={payment.id}
                          className="overflow-hidden rounded-3xl bg-white shadow-sm"
                        >
                          <div className="border-b border-gray-200 p-6 md:p-7">
                            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h2 className="text-2xl font-bold">
                                    🏫 {isFr ? "Paiement scolaire" : "School Payment"}
                                  </h2>
                                  <span
                                    className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusClass(
                                      status
                                    )}`}
                                  >
                                    {getStatusLabel(status)}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm text-gray-500">
                                  {formatDate(payment.created_at)}
                                </p>
                              </div>

                              <div className="lg:text-right">
                                <p className="text-sm text-gray-500">
                                  {isFr ? "Montant" : "Amount"}
                                </p>
                                <p className="text-3xl font-extrabold text-green-700">
                                  {formatMoney(amount, currency, language)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-6 border-b border-gray-200 p-6 md:grid-cols-2 md:p-7">
                            <div>
                              <h3 className="mb-3 font-bold">
                                {isFr ? "Élève" : "Student"}
                              </h3>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Nom" : "Name"}:
                                  </span>{" "}
                                  <strong>{payment.student_name}</strong>
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Classe / Niveau" : "Class / Grade"}:
                                  </span>{" "}
                                  <strong>{payment.class_level || "—"}</strong>
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Pays" : "Country"}:
                                  </span>{" "}
                                  <strong>{payment.country || "—"}</strong>
                                </p>
                              </div>
                            </div>

                            <div>
                              <h3 className="mb-3 font-bold">
                                {isFr ? "École" : "School"}
                              </h3>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Nom" : "Name"}:
                                  </span>{" "}
                                  <strong>{payment.school_name}</strong>
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Devise" : "Currency"}:
                                  </span>{" "}
                                  <strong>{currency}</strong>
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    {isFr ? "Identifiant du paiement" : "Payment ID"}:
                                  </span>{" "}
                                  <strong className="font-mono text-xs">
                                    {payment.id}
                                  </strong>
                                </p>
                              </div>
                            </div>
                          </div>

                          {payment.notes && (
                            <div className="border-b border-gray-200 p-6 md:p-7">
                              <h3 className="mb-2 font-bold">
                                {isFr ? "Notes" : "Notes"}
                              </h3>
                              <p className="text-gray-600">{payment.notes}</p>
                            </div>
                          )}

                          <div className="p-6 md:p-7">
                            <h3 className="mb-2 text-xl font-bold">
                              {isFr ? "Traitement du paiement" : "Payment Processing"}
                            </h3>

                            <p className="mb-5 text-sm text-gray-500">
                              {isFr ? "Statut actuel :" : "Current status:"}{" "}
                              <strong>{getStatusLabel(status)}</strong>
                            </p>

                            {!isCompleted && (
                              <button
                                type="button"
                                disabled={updatingOrderId === payment.id}
                                onClick={() =>
                                  void updateSchoolPaymentStatus(
                                    payment,
                                    "Completed"
                                  )
                                }
                                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isFr ? "Marquer comme terminé" : "Mark as Completed"}
                              </button>
                            )}

                            {updatingOrderId === payment.id && (
                              <p className="mt-4 text-sm font-medium text-gray-500">
                                {isFr
                                  ? "Mise à jour du paiement..."
                                  : "Updating payment..."}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}

              {/* ==============================================
                  GROCERY ORDERS
              ============================================== */}

              {isGroceryMerchant &&
                (filteredGroceryOrders.length ===
                0 ? (
                  <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
                    <div className="mb-3 text-5xl">
                      📦
                    </div>

                    <h2 className="text-2xl font-bold">
                      {isFr
                        ? "Aucune commande"
                        : "No Orders"}
                    </h2>

                    <p className="mt-2 text-gray-500">
                      {isFr
                        ? "Aucune commande ne correspond au statut sélectionné."
                        : "No orders match the selected status."}
                    </p>
                  </section>
                ) : (
                  <div className="space-y-6">

                    {filteredGroceryOrders.map(
                      (order) => {
                        const currency =
                          normalizeCurrency(
                            order.currency ??
                              merchant.currency ??
                              "XAF"
                          );

                        const total =
                          getGroceryOrderTotal(
                            order
                          );

                        const items =
                          order.grocery_order_items ??
                          [];

                        const status =
                          order.status ??
                          "Pending";

                        return (
                          <article
                            key={order.id}
                            className="overflow-hidden rounded-3xl bg-white shadow-sm"
                          >

                            <div className="border-b border-gray-200 p-6 md:p-7">
                              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                                <div>
                                  <div className="flex flex-wrap items-center gap-3">

                                    <h2 className="text-2xl font-bold">
                                      {isFr
                                        ? `Commande #${order.id}`
                                        : `Order #${order.id}`}
                                    </h2>

                                    <span
                                      className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusClass(
                                        status
                                      )}`}
                                    >
                                      {getStatusLabel(
                                        status
                                      )}
                                    </span>
                                  </div>

                                  {order.reference && (
                                    <p className="mt-2 font-mono text-sm font-semibold text-green-700">
                                      {
                                        order.reference
                                      }
                                    </p>
                                  )}

                                  <p className="mt-2 text-sm text-gray-500">
                                    {formatDate(
                                      order.created_at
                                    )}
                                  </p>
                                </div>

                                <div className="lg:text-right">
                                  <p className="text-sm text-gray-500">
                                    Total
                                  </p>

                                  <p className="text-3xl font-extrabold text-green-700">
                                    {formatMoney(
                                      total,
                                      currency,
                                      language
                                    )}
                                  </p>
                                </div>

                              </div>
                            </div>

                            {/* CUSTOMER */}

                            <div className="grid gap-6 border-b border-gray-200 p-6 md:grid-cols-2 md:p-7">

                              <div>
                                <h3 className="mb-3 font-bold">
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
                                      {order.country ??
                                        "—"}

                                      {order.country_code
                                        ? ` (${order.country_code})`
                                        : ""}
                                    </strong>
                                  </p>

                                </div>
                              </div>

                              <div>
                                <h3 className="mb-3 font-bold">
                                  {isFr
                                    ? "Exécution"
                                    : "Fulfillment"}
                                </h3>

                                <div className="space-y-2 text-sm">

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr
                                        ? "Magasin"
                                        : "Store"}
                                      :
                                    </span>{" "}
                                    <strong>
                                      {
                                        merchant.name
                                      }
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr
                                        ? "Mode"
                                        : "Method"}
                                      :
                                    </span>{" "}
                                    <strong>
                                      {order.delivery_type
                                        ?.trim()
                                        .toLowerCase() ===
                                      "pickup"
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
                                      {currency}
                                    </strong>
                                  </p>

                                  {order.city && (
                                    <p>
                                      <span className="text-gray-500">
                                        {isFr
                                          ? "Ville"
                                          : "City"}
                                        :
                                      </span>{" "}
                                      <strong>
                                        {
                                          order.city
                                        }
                                      </strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* PRODUCTS */}

                            <div className="border-b border-gray-200 p-6 md:p-7">

                              <h3 className="mb-4 text-xl font-bold">
                                {isFr
                                  ? "Produits à préparer"
                                  : "Products to Prepare"}
                              </h3>

                              {items.length ===
                              0 ? (
                                <p className="text-gray-500">
                                  {isFr
                                    ? "Aucun produit structuré disponible pour cette commande."
                                    : "No structured products are available for this order."}
                                </p>
                              ) : (
                                <div className="space-y-3">

                                  {items.map(
                                    (item) => {
                                      const lineTotal =
                                        item.line_total !==
                                        null
                                          ? Number(
                                              item.line_total
                                            )
                                          : Number(
                                              item.unit_price
                                            ) *
                                            Number(
                                              item.quantity
                                            );

                                      return (
                                        <div
                                          key={
                                            item.id
                                          }
                                          className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"
                                        >

                                          <div>
                                            <p className="font-bold">
                                              {translateProductName(
                                                item.product_name,
                                                language
                                              )}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                              {translateUnit(
                                                item.product_unit,
                                                language
                                              )}{" "}
                                              ×{" "}
                                              {
                                                item.quantity
                                              }
                                            </p>
                                          </div>

                                          <div className="sm:text-right">
                                            <p className="text-sm text-gray-500">
                                              {formatMoney(
                                                Number(
                                                  item.unit_price
                                                ),
                                                item.currency,
                                                language
                                              )}{" "}
                                              ×{" "}
                                              {
                                                item.quantity
                                              }
                                            </p>

                                            <p className="font-bold text-green-700">
                                              {formatMoney(
                                                lineTotal,
                                                item.currency,
                                                language
                                              )}
                                            </p>
                                          </div>

                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>

                            {/* TOTAL */}

                            <div className="border-b border-gray-200 bg-gray-50 p-6 md:p-7">

                              <div className="ml-auto max-w-md space-y-2">

                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    {isFr
                                      ? "Sous-total"
                                      : "Subtotal"}
                                  </span>

                                  <strong>
                                    {formatMoney(
                                      Number(
                                        order.subtotal ??
                                          total
                                      ),
                                      currency,
                                      language
                                    )}
                                  </strong>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    {isFr
                                      ? "Frais de livraison"
                                      : "Delivery Fee"}
                                  </span>

                                  <strong>
                                    {formatMoney(
                                      Number(
                                        order.delivery_fee ??
                                          0
                                      ),
                                      currency,
                                      language
                                    )}
                                  </strong>
                                </div>

                                <div className="flex justify-between border-t border-gray-300 pt-3 text-lg">
                                  <strong>
                                    Total
                                  </strong>

                                  <strong className="text-green-700">
                                    {formatMoney(
                                      total,
                                      currency,
                                      language
                                    )}
                                  </strong>
                                </div>

                              </div>
                            </div>

                            {/* STATUS */}

                            <div className="p-6 md:p-7">

                              <h3 className="mb-2 text-xl font-bold">
                                {isFr
                                  ? "Traitement de la commande"
                                  : "Order Processing"}
                              </h3>

                              <p className="mb-5 text-sm text-gray-500">
                                {isFr
                                  ? "Statut actuel :"
                                  : "Current status:"}{" "}
                                <strong>
                                  {getStatusLabel(
                                    status
                                  )}
                                </strong>
                              </p>

                              <div className="flex flex-wrap gap-3">

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "processing"
                                  }
                                  onClick={() =>
                                    void updateGroceryOrderStatus(
                                      order,
                                      "Processing"
                                    )
                                  }
                                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "En traitement"
                                    : "Processing"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "ready"
                                  }
                                  onClick={() =>
                                    void updateGroceryOrderStatus(
                                      order,
                                      "Ready"
                                    )
                                  }
                                  className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "Prête"
                                    : "Ready"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "delivered"
                                  }
                                  onClick={() =>
                                    void updateGroceryOrderStatus(
                                      order,
                                      "Delivered"
                                    )
                                  }
                                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "Livrée"
                                    : "Delivered"}
                                </button>
                              </div>

                            </div>

                          </article>
                        );
                      }
                    )}
                  </div>
                ))}

              {/* ==============================================
                  PHARMACY ORDERS
              ============================================== */}

              {isPharmacyMerchant &&
                (filteredPharmacyOrders.length ===
                0 ? (
                  <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
                    <div className="mb-3 text-5xl">
                      💊
                    </div>

                    <h2 className="text-2xl font-bold">
                      {isFr
                        ? "Aucune commande de pharmacie"
                        : "No Pharmacy Orders"}
                    </h2>

                    <p className="mt-2 text-gray-500">
                      {isFr
                        ? "Aucune commande ne correspond au statut sélectionné."
                        : "No pharmacy orders match the selected status."}
                    </p>
                  </section>
                ) : (
                  <div className="space-y-6">

                    {filteredPharmacyOrders.map(
                      (order) => {
                        const medicine =
                          getMedicineFromOrder(
                            order
                          );

                        const quantity =
                          Number(
                            order.quantity ??
                              1
                          );

                        const currency =
                          normalizeCurrency(
                            order.currency ??
                              medicine?.currency ??
                              pharmacy?.currency ??
                              "XAF"
                          );

                        const amount =
                          Number(
                            order.amount ??
                              (medicine?.price ??
                                0) *
                                quantity
                          );

                        const status =
                          order.status ??
                          "Pending";

                        const medicineName =
                          order.medicine_name ??
                          medicine?.name ??
                          (isFr
                            ? "Médicament"
                            : "Medicine");

                        return (
                          <article
                            key={order.id}
                            className="overflow-hidden rounded-3xl bg-white shadow-sm"
                          >

                            {/* HEADER */}

                            <div className="border-b border-gray-200 p-6 md:p-7">

                              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                                <div>

                                  <div className="flex flex-wrap items-center gap-3">

                                    <h2 className="text-2xl font-bold">
                                      💊{" "}
                                      {isFr
                                        ? "Commande pharmacie"
                                        : "Pharmacy Order"}
                                    </h2>

                                    <span
                                      className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusClass(
                                        status
                                      )}`}
                                    >
                                      {getStatusLabel(
                                        status
                                      )}
                                    </span>
                                  </div>

                                  {order.reference && (
                                    <p className="mt-2 font-mono text-sm font-semibold text-green-700">
                                      {
                                        order.reference
                                      }
                                    </p>
                                  )}

                                  <p className="mt-2 text-sm text-gray-500">
                                    {formatDate(
                                      order.created_at
                                    )}
                                  </p>
                                </div>

                                <div className="lg:text-right">

                                  <p className="text-sm text-gray-500">
                                    {isFr
                                      ? "Total"
                                      : "Total"}
                                  </p>

                                  <p className="text-3xl font-extrabold text-green-700">
                                    {formatMoney(
                                      amount,
                                      currency,
                                      language
                                    )}
                                  </p>

                                </div>
                              </div>
                            </div>

                            {/* PHARMACY / ORDER DETAILS */}

                            <div className="grid gap-6 border-b border-gray-200 p-6 md:grid-cols-2 md:p-7">

                              <div>

                                <h3 className="mb-3 font-bold">
                                  {isFr
                                    ? "Pharmacie"
                                    : "Pharmacy"}
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
                                      {pharmacy?.name ??
                                        merchant.name}
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr
                                        ? "Ville"
                                        : "City"}
                                      :
                                    </span>{" "}
                                    <strong>
                                      {pharmacy?.city ??
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
                                      {pharmacy?.country ??
                                        "—"}

                                      {pharmacy?.country_code
                                        ? ` (${pharmacy.country_code})`
                                        : ""}
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
                                      {currency}
                                    </strong>
                                  </p>

                                </div>
                              </div>

                              <div>

                                <h3 className="mb-3 font-bold">
                                  {isFr
                                    ? "Commande"
                                    : "Order"}
                                </h3>

                                <div className="space-y-2 text-sm">

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr ? "B n ficiaire" : "Beneficiary"}:
                                    </span>{" "}
                                    <strong>
                                      {order.beneficiary?.name ?? " "}
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr ? "T l phone" : "Phone"}:
                                    </span>{" "}
                                    <strong>
                                      {order.beneficiary?.phone ?? " "}
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr ? "Pays" : "Country"}:
                                    </span>{" "}
                                    <strong>
                                      {order.beneficiary?.country ?? " "}
                                      {order.beneficiary?.country_code
                                        ? ` (${order.beneficiary.country_code})`
                                        : ""}
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr ? "Relation" : "Relationship"}:
                                    </span>{" "}
                                    <strong>
                                      {order.beneficiary?.relationship ?? " "}
                                    </strong>
                                  </p>

                                  <p>
                                    <span className="text-gray-500">
                                      {isFr ? "Quantit " : "Quantity"}:
                                    </span>{" "}
                                    <strong>{quantity}</strong>
                                  </p>

                                </div>
                              </div>
                            </div>

                            {/* MEDICINE */}

                            <div className="border-b border-gray-200 p-6 md:p-7">

                              <h3 className="mb-4 text-xl font-bold">
                                {isFr
                                  ? "Médicament à préparer"
                                  : "Medicine to Prepare"}
                              </h3>

                              <div className="rounded-2xl border border-gray-200 p-5">

                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                                  <div>

                                    <div className="flex items-center gap-3">

                                      <div className="text-3xl">
                                        💊
                                      </div>

                                      <div>
                                        <h4 className="text-xl font-bold">
                                          {
                                            medicineName
                                          }
                                        </h4>

                                        {medicine?.description && (
                                          <p className="mt-1 text-sm text-gray-500">
                                            {
                                              medicine.description
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-4 space-y-1 text-sm text-gray-600">

                                      <p>
                                        {isFr
                                          ? "Quantité"
                                          : "Quantity"}
                                        :{" "}
                                        <strong>
                                          {
                                            quantity
                                          }
                                        </strong>
                                      </p>

                                      {medicine?.price !==
                                        null &&
                                        medicine?.price !==
                                          undefined && (
                                          <p>
                                            {isFr
                                              ? "Prix unitaire"
                                              : "Unit price"}
                                            :{" "}
                                            <strong>
                                              {formatMoney(
                                                Number(
                                                  medicine.price
                                                ),
                                                currency,
                                                language
                                              )}
                                            </strong>
                                          </p>
                                        )}

                                      {medicine?.stock !==
                                        null &&
                                        medicine?.stock !==
                                          undefined && (
                                          <p>
                                            {isFr
                                              ? "Stock disponible"
                                              : "Available stock"}
                                            :{" "}
                                            <strong>
                                              {
                                                medicine.stock
                                              }
                                            </strong>
                                          </p>
                                        )}

                                    </div>
                                  </div>

                                  <div className="md:text-right">

                                    <p className="text-sm text-gray-500">
                                      {isFr
                                        ? "Montant"
                                        : "Amount"}
                                    </p>

                                    <p className="text-2xl font-bold text-green-700">
                                      {formatMoney(
                                        amount,
                                        currency,
                                        language
                                      )}
                                    </p>

                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* FINANCIAL SUMMARY */}

                            <div className="border-b border-gray-200 bg-gray-50 p-6 md:p-7">

                              <div className="ml-auto max-w-md">

                                <div className="flex justify-between text-lg">

                                  <strong>
                                    Total
                                  </strong>

                                  <strong className="text-green-700">
                                    {formatMoney(
                                      amount,
                                      currency,
                                      language
                                    )}
                                  </strong>

                                </div>
                              </div>
                            </div>

                            {/* STATUS */}

                            <div className="p-6 md:p-7">

                              <h3 className="mb-2 text-xl font-bold">
                                {isFr
                                  ? "Traitement de la commande"
                                  : "Order Processing"}
                              </h3>

                              <p className="mb-5 text-sm text-gray-500">
                                {isFr
                                  ? "Statut actuel :"
                                  : "Current status:"}{" "}
                                <strong>
                                  {getStatusLabel(
                                    status
                                  )}
                                </strong>
                              </p>

                              <div className="flex flex-wrap gap-3">

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "processing"
                                  }
                                  onClick={() =>
                                    void updatePharmacyOrderStatus(
                                      order,
                                      "Processing"
                                    )
                                  }
                                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "En traitement"
                                    : "Processing"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "ready"
                                  }
                                  onClick={() =>
                                    void updatePharmacyOrderStatus(
                                      order,
                                      "Ready"
                                    )
                                  }
                                  className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "Prête"
                                    : "Ready"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                      order.id ||
                                    status
                                      .trim()
                                      .toLowerCase() ===
                                      "delivered"
                                  }
                                  onClick={() =>
                                    void updatePharmacyOrderStatus(
                                      order,
                                      "Delivered"
                                    )
                                  }
                                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isFr
                                    ? "Livrée"
                                    : "Delivered"}
                                </button>

                              </div>

                              {updatingOrderId ===
                                order.id && (
                                <p className="mt-4 text-sm font-medium text-gray-500">
                                  {isFr
                                    ? "Mise à jour de la commande..."
                                    : "Updating order..."}
                                </p>
                              )}

                            </div>

                          </article>
                        );
                      }
                    )}
                  </div>
                ))}
            </>
          )}
        </div>
      </main>
    </>
  );
}