"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

import {
  getCountryName,
  getSortedAfricanCountries,
} from "../lib/africa";

import {
  GROCERY_CATEGORIES,
  getGroceryProductsByCountry,
} from "../lib/groceryProducts";

type CartItem = {
  productId: string;
  quantity: number;
};

export default function GroceryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("CF");
  const [city, setCity] = useState("");
  const [deliveryType, setDeliveryType] = useState("Pickup");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [additionalItems, setAdditionalItems] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /*
   * Countries
   */

  const countries = useMemo(() => {
    return getSortedAfricanCountries(isFr ? "fr" : "en");
  }, [isFr]);

  const selectedCountry = useMemo(() => {
    return countries.find(
      (item) => item.code === country
    );
  }, [countries, country]);

  /*
   * Grocery catalog
   */

  const countryProducts = useMemo(() => {
    return getGroceryProductsByCountry(country);
  }, [country]);

  const groceryProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return countryProducts;
    }

    return countryProducts.filter(
      (product) =>
        product.category === selectedCategory
    );
  }, [countryProducts, selectedCategory]);

  /*
   * Cart
   */

  const cartDetails = useMemo(() => {
    return cart
      .map((cartItem) => {
        const product = countryProducts.find(
          (item) => item.id === cartItem.productId
        );

        if (!product) {
          return null;
        }

        return {
          ...cartItem,
          product,
          lineTotal:
            product.price * cartItem.quantity,
        };
      })
      .filter(
        (
          item
        ): item is NonNullable<typeof item> =>
          item !== null
      );
  }, [cart, countryProducts]);

  const cartSubtotal = useMemo(() => {
    return cartDetails.reduce(
      (total, item) =>
        total + item.lineTotal,
      0
    );
  }, [cartDetails]);

  const cartItemCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  const getQuantity = (productId: string) => {
    return (
      cart.find(
        (item) => item.productId === productId
      )?.quantity ?? 0
    );
  };

  const increaseQuantity = (productId: string) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.productId === productId
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId,
          quantity: 1,
        },
      ];
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.productId !== productId
      )
    );
  };

  /*
   * Formatting
   */

  const formatPrice = (
    amount: number,
    currency: string
  ) => {
    return `${new Intl.NumberFormat(
      isFr ? "fr-FR" : "en-US"
    ).format(amount)} ${currency}`;
  };

  const buildOrderItemsText = () => {
    const catalogLines = cartDetails.map(
      ({ product, quantity, lineTotal }) => {
        const productName = isFr
          ? product.name.fr
          : product.name.en;

        return `${productName} — ${
          product.unit
        } × ${quantity} — ${formatPrice(
          lineTotal,
          product.currency
        )}`;
      }
    );

    if (additionalItems.trim()) {
      catalogLines.push(
        `${
          isFr
            ? "Articles supplémentaires"
            : "Additional items"
        }: ${additionalItems.trim()}`
      );
    }

    return catalogLines.join("\n");
  };

  /*
   * Order submission
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (
      !recipientName.trim() ||
      !phone.trim() ||
      !country ||
      !city.trim()
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez remplir tous les champs obligatoires."
          : "Please complete all required fields."
      );

      return;
    }

    if (
      cart.length === 0 &&
      !additionalItems.trim()
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez sélectionner au moins un produit ou ajouter une demande supplémentaire."
          : "Please select at least one product or enter an additional grocery request."
      );

      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          isFr
            ? "Veuillez vous connecter avant de passer une commande."
            : "Please log in before placing an order."
        );

        return;
      }

      const countryName = selectedCountry
        ? getCountryName(
            selectedCountry,
            isFr ? "fr" : "en"
          )
        : country;

      const orderItems = buildOrderItemsText();

const { data: createdOrder, error } = await supabase
  .from("grocery_orders")
  .insert([
    {
      user_id: user.id,
      recipient_name: recipientName.trim(),
      phone_number: phone.trim(),
      country: countryName,
      city: city.trim(),
      delivery_type: deliveryType,
      grocery_items: orderItems,
      status: "Pending",
    },
  ])
  .select("id")
  .single();

if (error) {
  throw error;
}

if (!createdOrder) {
  throw new Error(
    "The grocery order was created without returning an order ID."
  );
}

const structuredItems = cartDetails.map((item) => ({
  order_id: createdOrder.id,
  product_name:
    item.product.name[isFr ? "fr" : "en"],
  product_unit: item.product.unit,
  quantity: item.quantity,
  unit_price: item.product.price,
  currency: item.product.currency,
}));

if (structuredItems.length > 0) {
  const { error: itemsError } = await supabase
    .from("grocery_order_items")
    .insert(structuredItems);

  if (itemsError) {
    throw itemsError;
  }
}
      try {
        const emailResponse = await fetch(
          "/api/send-order-email",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              customerEmail: user.email,
              customerName:
                recipientName.trim(),
              country: countryName,
              city: city.trim(),
              deliveryType,
              items: orderItems,
              subtotal: cartSubtotal,
              currency:
                selectedCountry?.currency ??
                "XAF",
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error(
            "The order was saved, but the email API returned an error."
          );
        }
      } catch (emailError) {
        console.error(
          "Order saved, but confirmation email failed:",
          emailError
        );
      }

      setMessage(
        isFr
          ? "Commande enregistrée avec succès."
          : "Grocery order submitted successfully."
      );

      setTimeout(() => {
        router.push("/my-orders");
      }, 800);
    } catch (error) {
      console.error(
        "Grocery order error:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible d'enregistrer la commande. Veuillez réessayer."
          : "Unable to submit the order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}

          <div className="mb-8">
            <p className="mb-2 font-semibold text-green-700">
              {isFr
                ? "Services familiaux"
                : "Family Services"}
            </p>

            <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
              {isFr
                ? "Commande de courses"
                : "Grocery Order"}
            </h1>

            <p className="mt-3 max-w-3xl text-lg text-gray-600">
              {isFr
                ? "Commandez des produits essentiels pour votre famille et vos proches."
                : "Order essential groceries for your family and loved ones."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl bg-white shadow-lg"
          >
            {/* Recipient Information */}

            <section className="border-b border-gray-200 p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isFr
                    ? "Informations du bénéficiaire"
                    : "Recipient Information"}
                </h2>

                <p className="mt-1 text-gray-500">
                  {isFr
                    ? "Indiquez les informations de la personne qui recevra la commande."
                    : "Enter the information for the person receiving the order."}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold text-gray-700">
                    {isFr
                      ? "Nom complet"
                      : "Full Name"}{" "}
                    *
                  </label>

                  <input
                    type="text"
                    value={recipientName}
                    onChange={(event) =>
                      setRecipientName(
                        event.target.value
                      )
                    }
                    placeholder={
                      isFr
                        ? "Nom du bénéficiaire"
                        : "Recipient name"
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">
                    {isFr
                      ? "Numéro de téléphone"
                      : "Phone Number"}{" "}
                    *
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder={
                      selectedCountry
                        ? `${selectedCountry.phoneCode} ...`
                        : "+..."
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">
                    {isFr ? "Pays" : "Country"} *
                  </label>

                  <select
                    value={country}
                    onChange={(event) => {
                      setCountry(
                        event.target.value
                      );
                      setCart([]);
                      setSelectedCategory("all");
                    }}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    {countries.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                      >
                        {item.flag}{" "}
                        {getCountryName(
                          item,
                          isFr ? "fr" : "en"
                        )}{" "}
                        ({item.phoneCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-700">
                    {isFr ? "Ville" : "City"} *
                  </label>

                  <input
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    placeholder={
                      isFr
                        ? "Ville de livraison ou retrait"
                        : "Delivery or pickup city"
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </section>

            {/* Fulfillment Method */}

            <section className="border-b border-gray-200 p-6 md:p-8">
              <h2 className="mb-5 text-2xl font-bold text-gray-900">
                {isFr
                  ? "Mode de réception"
                  : "Fulfillment Method"}
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition ${
                    deliveryType === "Pickup"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="Pickup"
                    checked={
                      deliveryType === "Pickup"
                    }
                    onChange={(event) =>
                      setDeliveryType(
                        event.target.value
                      )
                    }
                    className="mr-3"
                  />

                  <span className="font-bold">
                    {isFr ? "Retrait" : "Pickup"}
                  </span>

                  <p className="mt-2 text-sm text-gray-500">
                    {isFr
                      ? "Le bénéficiaire récupère la commande au point de retrait."
                      : "The recipient collects the order from the pickup location."}
                  </p>
                </label>

                <label
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition ${
                    deliveryType === "Delivery"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="Delivery"
                    checked={
                      deliveryType === "Delivery"
                    }
                    onChange={(event) =>
                      setDeliveryType(
                        event.target.value
                      )
                    }
                    className="mr-3"
                  />

                  <span className="font-bold">
                    {isFr
                      ? "Livraison"
                      : "Delivery"}
                  </span>

                  <p className="mt-2 text-sm text-gray-500">
                    {isFr
                      ? "La commande sera livrée au bénéficiaire."
                      : "The order will be delivered to the recipient."}
                  </p>
                </label>
              </div>
            </section>

            {/* Product Catalog */}

            <section className="border-b border-gray-200 p-6 md:p-8">
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                  {isFr
                    ? "Marché NdakoCare"
                    : "NdakoCare Market"}
                </p>

                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isFr
                        ? "Choisissez vos produits"
                        : "Choose Your Products"}
                    </h2>

                    <p className="mt-2 text-gray-500">
                      {isFr
                        ? "Parcourez les produits actuellement disponibles pour cette destination."
                        : "Browse products currently available for this destination."}
                    </p>
                  </div>

                  <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                    {cartItemCount}{" "}
                    {isFr
                      ? cartItemCount > 1
                        ? "articles"
                        : "article"
                      : cartItemCount === 1
                      ? "item"
                      : "items"}
                  </div>
                </div>
              </div>

              {/* Categories */}

              <div className="mb-7 flex flex-wrap gap-3">
                {GROCERY_CATEGORIES.map(
                  (category) => {
                    const active =
                      selectedCategory ===
                      category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            category.id
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-green-700 text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:border-green-600 hover:text-green-700"
                        }`}
                      >
                        {isFr
                          ? category.fr
                          : category.en}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Product Grid */}

              {groceryProducts.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {groceryProducts.map(
                    (product) => {
                      const quantity =
                        getQuantity(product.id);

                      return (
                        <article
                          key={product.id}
                          className={`flex flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                            quantity > 0
                              ? "border-green-500 ring-2 ring-green-100"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-4xl">
                            {product.emoji}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {isFr
                                ? product.name.fr
                                : product.name.en}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {isFr
                                ? product
                                    .description.fr
                                : product
                                    .description.en}
                            </p>

                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                              {product.unit}
                            </p>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xs text-gray-500">
                                {isFr
                                  ? "Prix"
                                  : "Price"}
                              </p>

                              <p className="text-lg font-extrabold text-green-700">
                                {formatPrice(
                                  product.price,
                                  product.currency
                                )}
                              </p>
                            </div>

                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      product.id
                                    )
                                  }
                                  aria-label={
                                    isFr
                                      ? `Réduire la quantité de ${
                                          product
                                            .name.fr
                                        }`
                                      : `Decrease ${
                                          product
                                            .name.en
                                        } quantity`
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-700 font-bold text-green-700 transition hover:bg-green-50"
                                >
                                  −
                                </button>

                                <span className="min-w-6 text-center font-bold text-gray-900">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      product.id
                                    )
                                  }
                                  aria-label={
                                    isFr
                                      ? `Augmenter la quantité de ${
                                          product
                                            .name.fr
                                        }`
                                      : `Increase ${
                                          product
                                            .name.en
                                        } quantity`
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 font-bold text-white transition hover:bg-green-800"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    product.id
                                  )
                                }
                                className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-800"
                              >
                                +{" "}
                                {isFr
                                  ? "Ajouter"
                                  : "Add"}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <div className="mb-3 text-4xl">
                    🛒
                  </div>

                  <h3 className="font-bold text-gray-900">
                    {isFr
                      ? "Aucun produit disponible"
                      : "No products available"}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {isFr
                      ? "Le catalogue pour cette destination sera bientôt disponible."
                      : "The catalog for this destination will be available soon."}
                  </p>
                </div>
              )}
            </section>

            {/* Cart and Order Summary */}

            <section className="p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFr
                      ? "Résumé de la commande"
                      : "Order Summary"}
                  </h2>

                  <p className="mb-5 mt-1 text-gray-500">
                    {isFr
                      ? "Vérifiez les produits et les quantités avant d'envoyer la commande."
                      : "Review the selected products and quantities before submitting the order."}
                  </p>

                  {cartDetails.length > 0 ? (
                    <div className="space-y-3">
                      {cartDetails.map(
                        ({
                          product,
                          quantity,
                          lineTotal,
                        }) => (
                          <div
                            key={product.id}
                            className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                                {product.emoji}
                              </div>

                              <div>
                                <h3 className="font-bold text-gray-900">
                                  {isFr
                                    ? product.name.fr
                                    : product.name.en}
                                </h3>

                                <p className="text-sm text-gray-500">
                                  {product.unit} ×{" "}
                                  {quantity}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                              <p className="font-bold text-green-700">
                                {formatPrice(
                                  lineTotal,
                                  product.currency
                                )}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    product.id
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                {isFr
                                  ? "Supprimer"
                                  : "Remove"}
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center text-gray-500">
                      {isFr
                        ? "Aucun produit sélectionné."
                        : "No products selected."}
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="mb-2 block font-semibold text-gray-700">
                      {isFr
                        ? "Demande supplémentaire"
                        : "Additional Request"}
                    </label>

                    <textarea
                      value={additionalItems}
                      onChange={(event) =>
                        setAdditionalItems(
                          event.target.value
                        )
                      }
                      rows={5}
                      placeholder={
                        isFr
                          ? "Ajoutez ici un produit qui ne figure pas dans le catalogue."
                          : "Enter any product that is not currently listed in the catalog."
                      }
                      className="w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* Summary Sidebar */}

                <aside className="h-fit rounded-2xl bg-gray-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {isFr
                      ? "Total de la commande"
                      : "Order Total"}
                  </h2>

                  <div className="mt-5 space-y-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">
                        {isFr
                          ? "Articles"
                          : "Items"}
                      </span>

                      <span className="font-bold">
                        {cartItemCount}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">
                        {isFr
                          ? "Sous-total"
                          : "Subtotal"}
                      </span>

                      <span className="font-bold">
                        {formatPrice(
                          cartSubtotal,
                          selectedCountry?.currency ??
                            "XAF"
                        )}
                      </span>
                    </div>

                    <div className="border-t border-gray-300 pt-4">
                      <p className="text-sm text-gray-500">
                        {isFr
                          ? "Les frais de livraison et le prix final seront confirmés après vérification par le marchand."
                          : "Delivery fees and the final price will be confirmed after merchant review."}
                      </p>
                    </div>

                    {selectedCountry && (
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Destination
                        </p>

                        <p className="mt-2 font-bold text-gray-900">
                          {selectedCountry.flag}{" "}
                          {getCountryName(
                            selectedCountry,
                            isFr ? "fr" : "en"
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {isFr
                            ? "Devise"
                            : "Currency"}
                          :{" "}
                          {
                            selectedCountry.currency
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              {/* Messages */}

              {errorMessage && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                  {message}
                </div>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? isFr
                    ? "Envoi en cours..."
                    : "Submitting..."
                  : isFr
                  ? "Envoyer la commande"
                  : "Submit Grocery Order"}
              </button>
            </section>
          </form>
        </div>
      </main>
    </>
  );
}