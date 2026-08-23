"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/currency";
import { useLanguage } from "../context/LanguageContext";

type MoneyRequest = {
  id: string;
  user_id: string | null;
  requester_name: string;
  requester_phone: string;
  country: string;
  request_type: string;
  amount: number;
  currency: string;
  message: string | null;
  status: "Pending" | "Paid" | "Cancelled";
  reference: string | null;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
};

export default function MyRequestsPage() {
  const { language } = useLanguage();

  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setErrorMessage("");

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

      const { data, error } = await supabase
        .from("money_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setRequests((data || []) as MoneyRequest[]);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : language === "fr"
          ? "Impossible de charger les demandes."
          : "Unable to load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelRequest(request: MoneyRequest) {
    if (request.status !== "Pending") {
      return;
    }

    const confirmed = window.confirm(
      language === "fr"
        ? `Annuler la demande ${request.reference || ""} ?`
        : `Cancel request ${request.reference || ""}?`
    );

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setErrorMessage("");
    setSuccessMessage("");

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

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("money_requests")
        .update({
          status: "Cancelled",
          cancelled_at: now,
          updated_at: now,
        })
        .eq("id", request.id)
        .eq("user_id", user.id)
        .eq("status", "Pending")
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length !== 1) {
        throw new Error(
          language === "fr"
            ? "Cette demande ne peut plus être annulée."
            : "This request can no longer be cancelled."
        );
      }

      setSuccessMessage(
        language === "fr"
          ? "Demande annulée avec succès."
          : "Request cancelled successfully."
      );

      await loadRequests();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : language === "fr"
          ? "Impossible d'annuler la demande."
          : "Unable to cancel request."
      );
    } finally {
      setActionId(null);
    }
  }

  function getStatusClasses(status: MoneyRequest["status"]) {
    if (status === "Paid") {
      return "bg-green-100 text-green-800";
    }

    if (status === "Cancelled") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-800";
  }

  function getStatusLabel(status: MoneyRequest["status"]) {
    if (language !== "fr") {
      return status;
    }

    if (status === "Paid") return "Payée";
    if (status === "Cancelled") return "Annulée";

    return "En attente";
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      language === "fr" ? "fr-FR" : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const paidCount = requests.filter(
    (request) => request.status === "Paid"
  ).length;

  const cancelledCount = requests.filter(
    (request) => request.status === "Cancelled"
  ).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold tracking-wider text-green-700">
              NDAKOCARE · REQUESTS
            </p>

            <h1 className="text-4xl font-bold text-gray-950">
              {language === "fr"
                ? "Mes demandes"
                : "My Money Requests"}
            </h1>

            <p className="mt-3 text-gray-600">
              {language === "fr"
                ? "Suivez vos demandes d'aide financière et gérez celles qui sont encore en attente."
                : "Track your financial requests and manage requests that are still pending."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800">
              {successMessage}
            </div>
          )}

          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                {language === "fr" ? "Toutes" : "All"}
              </p>
              <p className="mt-1 text-3xl font-bold">
                {requests.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                {language === "fr" ? "En attente" : "Pending"}
              </p>
              <p className="mt-1 text-3xl font-bold text-yellow-700">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                {language === "fr" ? "Payées" : "Paid"}
              </p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {paidCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                {language === "fr" ? "Annulées" : "Cancelled"}
              </p>
              <p className="mt-1 text-3xl font-bold text-red-700">
                {cancelledCount}
              </p>
            </div>
          </section>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              {language === "fr"
                ? "Chargement..."
                : "Loading..."}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold">
                {language === "fr"
                  ? "Aucune demande"
                  : "No requests found"}
              </h2>

              <p className="mt-2 text-gray-500">
                {language === "fr"
                  ? "Vos demandes apparaîtront ici."
                  : "Your money requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-950">
                          {request.request_type}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      <p className="mt-2 font-mono text-sm text-gray-500">
                        {request.reference || "No reference"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-sm text-gray-500">
                        {language === "fr"
                          ? "Montant demandé"
                          : "Requested amount"}
                      </p>

                      <p className="mt-1 text-3xl font-bold text-green-700">
                        {formatCurrency(
                          Number(request.amount),
                          request.currency,
                          language === "fr" ? "fr" : "en"
                        )}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-500">
                        {request.currency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "fr"
                          ? "Demandeur"
                          : "Requester"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {request.requester_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "fr"
                          ? "Téléphone"
                          : "Phone"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {request.requester_phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "fr" ? "Pays" : "Country"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {request.country}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "fr" ? "Devise" : "Currency"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {request.currency}
                      </p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                      <p className="text-sm font-semibold text-gray-500">
                        {language === "fr" ? "Message" : "Message"}
                      </p>
                      <p className="mt-2 text-gray-800">
                        {request.message}
                      </p>
                    </div>
                  )}

                  {request.status === "Paid" && (
                    <p className="mt-5 text-sm text-green-700">
                      {language === "fr" ? "Payée" : "Paid"}:{" "}
                      <strong>{formatDate(request.paid_at)}</strong>
                    </p>
                  )}

                  {request.status === "Cancelled" && (
                    <p className="mt-5 text-sm text-red-700">
                      {language === "fr"
                        ? "Annulée"
                        : "Cancelled"}:{" "}
                      <strong>
                        {formatDate(request.cancelled_at)}
                      </strong>
                    </p>
                  )}

                  {request.status === "Pending" && (
                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <button
                        type="button"
                        onClick={() => cancelRequest(request)}
                        disabled={actionId === request.id}
                        className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionId === request.id
                          ? language === "fr"
                            ? "Annulation..."
                            : "Cancelling..."
                          : language === "fr"
                          ? "Annuler la demande"
                          : "Cancel Request"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}