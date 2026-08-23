"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import {
  SUPPORTED_CURRENCIES,
  formatCurrency,
} from "../lib/currency";
import { useLanguage } from "../context/LanguageContext";

const REQUEST_TYPES = [
  "School Fees",
  "Medical Emergency",
  "Food Assistance",
  "Rent Assistance",
  "Transportation",
  "Other",
];

export default function RequestMoneyPage() {
  const { language } = useLanguage();

  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [country, setCountry] = useState("");
  const [requestType, setRequestType] = useState("School Fees");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [successReference, setSuccessReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const numericAmount = Number(amount);

  const validAmount =
    Number.isFinite(numericAmount) && numericAmount > 0;

  function generateReference() {
    const randomPart = crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 16)
      .toUpperCase();

    return `NDR-${randomPart}`;
  }

  async function submitRequest() {
    setErrorMessage("");
    setSuccessReference("");

    if (!requesterName.trim()) {
      setErrorMessage(
        language === "fr"
          ? "Le nom du demandeur est requis."
          : "Requester name is required."
      );
      return;
    }

    if (!requesterPhone.trim()) {
      setErrorMessage(
        language === "fr"
          ? "Le numéro de téléphone est requis."
          : "Requester phone is required."
      );
      return;
    }

    if (!country.trim()) {
      setErrorMessage(
        language === "fr"
          ? "Le pays est requis."
          : "Country is required."
      );
      return;
    }

    if (!validAmount) {
      setErrorMessage(
        language === "fr"
          ? "Le montant doit être supérieur à zéro."
          : "Amount must be greater than zero."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          language === "fr"
            ? "Veuillez vous connecter."
            : "Please log in."
        );
      }

      const reference = generateReference();

      const { error } = await supabase
        .from("money_requests")
        .insert({
          user_id: user.id,
          requester_name: requesterName.trim(),
          requester_phone: requesterPhone.trim(),
          country: country.trim(),
          request_type: requestType,
          amount: numericAmount,
          currency,
          message: message.trim() || null,
          status: "Pending",
          reference,
        });

      if (error) {
        throw error;
      }

      setSuccessReference(reference);

      setRequesterName("");
      setRequesterPhone("");
      setCountry("");
      setRequestType("School Fees");
      setAmount("");
      setCurrency("XAF");
      setMessage("");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : language === "fr"
          ? "Impossible d'envoyer la demande."
          : "Unable to submit the request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold tracking-wider text-green-700">
              NDAKOCARE · REQUESTS
            </p>

            <h1 className="text-4xl font-bold text-gray-950">
              {language === "fr"
                ? "Demander de l'argent"
                : "Request Money"}
            </h1>

            <p className="mt-3 text-gray-600">
              {language === "fr"
                ? "Créez une demande d'aide financière et suivez son statut."
                : "Create a financial assistance request and track its status."}
            </p>
          </div>

          {successReference && (
            <div className="mb-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-800">
              <p className="font-semibold">
                {language === "fr"
                  ? "Demande envoyée avec succès."
                  : "Request submitted successfully."}
              </p>

              <p className="mt-1 text-sm">
                {language === "fr" ? "Référence" : "Reference"}:{" "}
                <span className="font-bold">
                  {successReference}
                </span>
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-700">
              {errorMessage}
            </div>
          )}

          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-10">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr"
                    ? "Nom du demandeur"
                    : "Requester name"}
                </label>

                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) =>
                    setRequesterName(e.target.value)
                  }
                  placeholder={
                    language === "fr"
                      ? "Nom complet"
                      : "Full name"
                  }
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr"
                    ? "Téléphone"
                    : "Phone"}
                </label>

                <input
                  type="tel"
                  value={requesterPhone}
                  onChange={(e) =>
                    setRequesterPhone(e.target.value)
                  }
                  placeholder="+236..."
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr" ? "Pays" : "Country"}
                </label>

                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={
                    language === "fr"
                      ? "Pays du demandeur"
                      : "Requester country"
                  }
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr"
                    ? "Type de demande"
                    : "Request type"}
                </label>

                <select
                  value={requestType}
                  onChange={(e) =>
                    setRequestType(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-4"
                >
                  {REQUEST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr" ? "Montant" : "Amount"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-800">
                  {language === "fr" ? "Devise" : "Currency"}
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-4"
                >
                  {SUPPORTED_CURRENCIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block font-semibold text-gray-800">
                {language === "fr"
                  ? "Message"
                  : "Message"}
              </label>

              <textarea
                rows={5}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  language === "fr"
                    ? "Décrivez brièvement la demande..."
                    : "Briefly describe the request..."
                }
                className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {message.length}/500
              </p>
            </div>

            {validAmount && (
              <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {language === "fr"
                      ? "Montant demandé"
                      : "Requested amount"}
                  </span>

                  <span className="text-xl font-bold text-green-700">
                  {formatCurrency(
                   numericAmount,
                   currency,
                   language === "fr" ? "fr" : "en"
      )} 
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-gray-600">
                    {language === "fr" ? "Statut" : "Status"}
                  </span>

                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                    {language === "fr"
                      ? "En attente"
                      : "Pending"}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={submitRequest}
              disabled={loading}
              className="mt-8 w-full rounded-xl bg-green-700 p-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? language === "fr"
                  ? "Envoi..."
                  : "Submitting..."
                : language === "fr"
                ? "Envoyer la demande"
                : "Submit Request"}
            </button>
          </section>
        </div>
      </main>
    </>
  );
}