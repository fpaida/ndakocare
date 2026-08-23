"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import AdminGuard from "../../components/AdminGuard";
import { supabase } from "../../lib/supabase";
import {
  formatCurrency,
} from "../../lib/currency";
import { useLanguage } from "../../context/LanguageContext";

type MoneyRequest = {
  id: string;
  reference: string | null;
  requester_name: string;
  requester_phone: string;
  country: string;
  request_type: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
};

export default function AdminRequestsPage() {
  const { language } = useLanguage();

  const [requests, setRequests] =
    useState<MoneyRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("money_requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }

  async function markPaid(
    request: MoneyRequest
  ) {
    if (!request.reference) {
      setErrorMessage(
        "This request does not have a reference."
      );
      return;
    }

    const confirmed = window.confirm(
      `Mark request ${request.reference} as paid?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/admin/requests/mark-paid",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            reference: request.reference,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to mark request as paid."
        );
      }

      setMessage(
        `Request ${request.reference} marked as paid successfully.`
      );

      await loadRequests();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to mark request as paid."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function displayAmount(
    amount: number,
    currency: string
  ) {
    return formatCurrency(
      Number(amount),
      currency,
      language === "fr" ? "fr" : "en"
    );
  }

  function displayDate(
    value: string | null
  ) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      language === "fr"
        ? "fr-FR"
        : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "Pending"
    ).length;

  const paidCount =
    requests.filter(
      (request) =>
        request.status === "Paid"
    ).length;

  const cancelledCount =
    requests.filter(
      (request) =>
        request.status === "Cancelled"
    ).length;

  function statusStyle(status: string) {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <AdminGuard>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
              NDAKOCARE · ADMIN
            </p>

            <h1 className="text-4xl font-bold text-gray-950">
              Money Requests
            </h1>

            <p className="mt-3 text-gray-600">
              Review financial requests and
              securely mark completed payments.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-800">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="All"
              value={requests.length}
            />

            <SummaryCard
              label="Pending"
              value={pendingCount}
            />

            <SummaryCard
              label="Paid"
              value={paidCount}
            />

            <SummaryCard
              label="Cancelled"
              value={cancelledCount}
            />
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 shadow-sm">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              No money requests found.
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => {
                const isProcessing =
                  processingId === request.id;

                const canMarkPaid =
                  request.status === "Pending" &&
                  Boolean(request.reference);

                return (
                  <section
                    key={request.id}
                    className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold text-gray-950">
                            {request.request_type}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </div>

                        <p className="mt-2 font-mono text-sm text-gray-600">
                          {request.reference ||
                            "No reference"}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          {displayDate(
                            request.created_at
                          )}
                        </p>
                      </div>

                      <div className="lg:text-right">
                        <p className="text-sm text-gray-500">
                          Requested amount
                        </p>

                        <p className="mt-1 text-3xl font-bold text-gray-950">
                          {displayAmount(
                            request.amount,
                            request.currency
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-gray-600">
                          {request.currency}
                        </p>
                      </div>
                    </div>

                    <div className="my-7 border-t border-gray-200" />

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <Info
                        label="Requester"
                        value={
                          request.requester_name
                        }
                      />

                      <Info
                        label="Phone"
                        value={
                          request.requester_phone
                        }
                      />

                      <Info
                        label="Country"
                        value={request.country}
                      />

                      <Info
                        label="Currency"
                        value={request.currency}
                      />
                    </div>

                    {request.message && (
                      <div className="mt-7 rounded-2xl bg-gray-50 p-5">
                        <p className="text-sm font-semibold text-gray-600">
                          Message
                        </p>

                        <p className="mt-2 text-gray-900">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "Paid" && (
                      <p className="mt-6 text-sm text-green-700">
                        Paid:{" "}
                        <strong>
                          {displayDate(
                            request.paid_at
                          )}
                        </strong>
                      </p>
                    )}

                    {request.status ===
                      "Cancelled" && (
                      <p className="mt-6 text-sm text-red-700">
                        Cancelled:{" "}
                        <strong>
                          {displayDate(
                            request.cancelled_at
                          )}
                        </strong>
                      </p>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      {canMarkPaid ? (
                        <button
                          type="button"
                          onClick={() =>
                            markPaid(request)
                          }
                          disabled={isProcessing}
                          className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Mark Paid"}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {request.status ===
                          "Paid"
                            ? "Payment completed."
                            : request.status ===
                                "Cancelled"
                              ? "Cancelled requests cannot be paid."
                              : "Payment action unavailable."}
                        </span>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-950">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-gray-950">
        {value || "—"}
      </p>
    </div>
  );
}