"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
import {
  getSortedAfricanCountries,
  getCountryName,
} from "../lib/africa";

export default function GroceryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("CF");
  const [city, setCity] = useState("");
  const [deliveryType, setDeliveryType] = useState("Pickup");
  const [items, setItems] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const countries = useMemo(() => {
    return getSortedAfricanCountries(isFr ? "fr" : "en");
  }, [isFr]);

  const selectedCountry = useMemo(() => {
    return countries.find((item) => item.code === country);
  }, [countries, country]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (
      !recipientName.trim() ||
      !phone.trim() ||
      !country ||
      !city.trim() ||
      !items.trim()
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez remplir tous les champs obligatoires."
          : "Please complete all required fields."
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
        ? getCountryName(selectedCountry, isFr ? "fr" : "en")
        : country;

      const { error } = await supabase
        .from("grocery_orders")
        .insert([
          {
            user_id: user.id,
            recipient_name: recipientName.trim(),
            phone_number: phone.trim(),

            // Keep the existing database format for now.
            country: countryName,

            city: city.trim(),
            delivery_type: deliveryType,
            grocery_items: items.trim(),
            status: "Pending",
          },
        ]);

      if (error) {
        throw error;
      }

      try {
        await fetch("/api/send-order-email", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            customerEmail: user.email,
            customerName: recipientName.trim(),
            country: countryName,
            city: city.trim(),
            deliveryType,
            items: items.trim(),
          }),
        });
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
      console.error("Grocery order error:", error);

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
        <div className="mx-auto max-w-5xl">

          {/* Page Header */}

          <div className="mb-8">
            <p className="mb-2 font-semibold text-green-700">
              {isFr ? "Services familiaux" : "Family Services"}
            </p>

            <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
              {isFr ? "Commande de courses" : "Grocery Order"}
            </h1>

            <p className="mt-3 max-w-3xl text-lg text-gray-600">
              {isFr
                ? "Commandez des produits essentiels pour votre famille et vos proches."
                : "Order essential groceries for your family and loved ones."}
            </p>
          </div>

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl bg-white shadow-lg"
          >

            {/* Recipient */}

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
                    {isFr ? "Nom complet" : "Full Name"} *
                  </label>

                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) =>
                      setRecipientName(e.target.value)
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
                    onChange={(e) =>
                      setPhone(e.target.value)
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
                    onChange={(e) =>
                      setCountry(e.target.value)
                    }
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
                    onChange={(e) =>
                      setCity(e.target.value)
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

            {/* Fulfillment */}

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
                    checked={deliveryType === "Pickup"}
                    onChange={(e) =>
                      setDeliveryType(e.target.value)
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
                    checked={deliveryType === "Delivery"}
                    onChange={(e) =>
                      setDeliveryType(e.target.value)
                    }
                    className="mr-3"
                  />

                  <span className="font-bold">
                    {isFr ? "Livraison" : "Delivery"}
                  </span>

                  <p className="mt-2 text-sm text-gray-500">
                    {isFr
                      ? "La commande sera livrée au bénéficiaire."
                      : "The order will be delivered to the recipient."}
                  </p>
                </label>
              </div>
            </section>

            {/* Grocery Request */}

            <section className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isFr
                  ? "Liste des courses"
                  : "Grocery List"}
              </h2>

              <p className="mb-5 mt-1 text-gray-500">
                {isFr
                  ? "Indiquez les produits et quantités souhaités."
                  : "Enter the products and quantities you would like to order."}
              </p>

              <textarea
                value={items}
                onChange={(e) =>
                  setItems(e.target.value)
                }
                rows={8}
                required
                placeholder={
                  isFr
                    ? "Exemple :\nRiz - 10 kg\nHuile - 5 litres\nSucre - 5 kg\nLait - 2 boîtes"
                    : "Example:\nRice - 10 kg\nCooking oil - 5 liters\nSugar - 5 kg\nMilk - 2 boxes"
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              {/* Selected Country Summary */}

              {selectedCountry && (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {isFr
                      ? "Destination"
                      : "Destination"}
                  </p>

                  <p className="mt-2 text-lg font-bold text-gray-900">
                    {selectedCountry.flag}{" "}
                    {getCountryName(
                      selectedCountry,
                      isFr ? "fr" : "en"
                    )}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {isFr ? "Devise" : "Currency"}:{" "}
                    {selectedCountry.currency}
                  </p>
                </div>
              )}

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