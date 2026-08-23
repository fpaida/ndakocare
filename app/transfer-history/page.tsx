"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

type TransferStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | string;

type TransferRecord = {
  id: string;
  user_id: string | null;
  recipient_name: string | null;
  phone: string | null;
  country: string | null;
  amount: number | string | null;
  method: string | null;
  notes: string | null;
  status: TransferStatus | null;
  created_at: string | null;
  currency: string | null;
  purpose: string | null;
  relationship: string | null;

  reference: string | null;
  source_amount: number | string | null;
  source_currency: string | null;
  fee: number | string | null;
  total_debit: number | string | null;
  exchange_rate: number | string | null;
  destination_amount: number | string | null;
  destination_currency: string | null;
  provider_reference: string | null;
  completed_at: string | null;
};

type LedgerRecord = {
  related_transfer_id: string | null;
  transaction_type: string | null;
  direction: string | null;
};

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined
): string {
  const amount = toNumber(value);
  const code = (currency || "USD").toUpperCase();

  if (code === "XAF") {
    return `FCFA ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  if (code === "XOF") {
    return `CFA ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

function formatDate(value: string | null, language: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "fr" ? "fr-FR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function getStatusClasses(status: string | null): string {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";

    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";

    case "failed":
      return "bg-red-100 text-red-800 border-red-200";

    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

export default function TransferHistoryPage() {
  const { language } = useLanguage();

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [refundedTransferIds, setRefundedTransferIds] = useState<Set<string>>(
    new Set()
  );

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const text =
    language === "fr"
      ? {
          eyebrow: "NDAKOCARE · TRANSFERTS",
          title: "Historique des transferts",
          subtitle:
            "Consultez vos transferts, leurs statuts et les informations financières associées.",
          loading: "Chargement des transferts...",
          noTransfers: "Aucun transfert trouvé.",
          noMatches: "Aucun transfert ne correspond à votre recherche.",
          searchPlaceholder:
            "Rechercher par bénéficiaire, référence, pays...",
          all: "Tous",
          pending: "En attente",
          processing: "En traitement",
          completed: "Terminé",
          failed: "Échoué",
          refunded: "Remboursé",
          recipient: "Bénéficiaire",
          reference: "Référence",
          date: "Date",
          destination: "Destination",
          method: "Méthode",
          amount: "Montant",
          fee: "Frais",
          totalDebit: "Débit total",
          status: "Statut",
          purpose: "Motif",
          providerReference: "Référence fournisseur",
          completedAt: "Terminé le",
          legacy: "Ancien transfert",
          transfers: "transferts",
        }
      : {
          eyebrow: "NDAKOCARE · TRANSFERS",
          title: "Transfer History",
          subtitle:
            "Review your transfers, their statuses, and associated financial details.",
          loading: "Loading transfers...",
          noTransfers: "No transfers found.",
          noMatches: "No transfers match your search.",
          searchPlaceholder:
            "Search recipient, reference, country...",
          all: "All",
          pending: "Pending",
          processing: "Processing",
          completed: "Completed",
          failed: "Failed",
          refunded: "Refunded",
          recipient: "Recipient",
          reference: "Reference",
          date: "Date",
          destination: "Destination",
          method: "Method",
          amount: "Amount",
          fee: "Fee",
          totalDebit: "Total debit",
          status: "Status",
          purpose: "Purpose",
          providerReference: "Provider reference",
          completedAt: "Completed",
          legacy: "Legacy transfer",
          transfers: "transfers",
        };

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setErrorMessage(userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setErrorMessage(
        language === "fr"
          ? "Veuillez vous connecter pour consulter vos transferts."
          : "Please sign in to view your transfers."
      );
      setLoading(false);
      return;
    }

    const transferResult = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (transferResult.error) {
      setErrorMessage(transferResult.error.message);
      setTransfers([]);
      setLoading(false);
      return;
    }

    const transferRows = (transferResult.data || []) as TransferRecord[];

    setTransfers(transferRows);

    if (transferRows.length === 0) {
      setRefundedTransferIds(new Set());
      setLoading(false);
      return;
    }

    const transferIds = transferRows.map((transfer) => transfer.id);

    const ledgerResult = await supabase
      .from("wallet_transactions")
      .select("related_transfer_id, transaction_type, direction")
      .in("related_transfer_id", transferIds);

    if (ledgerResult.error) {
      console.error(
        "Unable to load transfer refund information:",
        ledgerResult.error
      );

      setRefundedTransferIds(new Set());
    } else {
      const ledgerRows = (ledgerResult.data || []) as LedgerRecord[];

      const refundIds = new Set(
        ledgerRows
          .filter(
            (entry) =>
              entry.related_transfer_id &&
              entry.transaction_type?.toLowerCase() === "refund" &&
              entry.direction?.toLowerCase() === "credit"
          )
          .map((entry) => entry.related_transfer_id as string)
      );

      setRefundedTransferIds(refundIds);
    }

    setLoading(false);
  }, [language]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const status = transfer.status || "Pending";

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        transfer.recipient_name,
        transfer.reference,
        transfer.country,
        transfer.method,
        transfer.currency,
        transfer.source_currency,
        transfer.destination_currency,
        transfer.provider_reference,
        transfer.purpose,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [search, statusFilter, transfers]);

  const statusCounts = useMemo(() => {
    return transfers.reduce(
      (counts, transfer) => {
        const status = (transfer.status || "Pending").toLowerCase();

        if (status === "pending") counts.pending += 1;
        if (status === "processing") counts.processing += 1;
        if (status === "completed") counts.completed += 1;
        if (status === "failed") counts.failed += 1;

        return counts;
      },
      {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }
    );
  }, [transfers]);

  const filters = [
    {
      key: "All",
      label: text.all,
      count: transfers.length,
    },
    {
      key: "Pending",
      label: text.pending,
      count: statusCounts.pending,
    },
    {
      key: "Processing",
      label: text.processing,
      count: statusCounts.processing,
    },
    {
      key: "Completed",
      label: text.completed,
      count: statusCounts.completed,
    },
    {
      key: "Failed",
      label: text.failed,
      count: statusCounts.failed,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-8">
            <p className="mb-2 text-sm font-semibold tracking-wider text-green-700">
              {text.eyebrow}
            </p>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {text.title}
                </h1>

                <p className="mt-2 max-w-3xl text-slate-600">
                  {text.subtitle}
                </p>
              </div>

              {!loading && !errorMessage && (
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                  {transfers.length} {text.transfers}
                </div>
              )}
            </div>
          </section>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
              {errorMessage}
            </div>
          )}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => {
                    const active = statusFilter === filter.key;

                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setStatusFilter(filter.key)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-green-700 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {filter.label}
                        <span
                          className={`ml-2 ${
                            active ? "text-green-100" : "text-slate-500"
                          }`}
                        >
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={text.searchPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 xl:max-w-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-600">
                {text.loading}
              </div>
            ) : transfers.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                {text.noTransfers}
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                {text.noMatches}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredTransfers.map((transfer) => {
                  const sourceCurrency =
                    transfer.source_currency ||
                    transfer.currency ||
                    "USD";

                  const destinationCurrency =
                    transfer.destination_currency ||
                    transfer.currency ||
                    sourceCurrency;

                  const sourceAmount =
                    transfer.source_amount ?? transfer.amount;

                  const destinationAmount =
                    transfer.destination_amount ?? transfer.amount;

                  const fee = transfer.fee ?? 0;

                  const totalDebit =
                    transfer.total_debit ??
                    (toNumber(sourceAmount) + toNumber(fee));

                  const status = transfer.status || "Pending";

                  const refunded = refundedTransferIds.has(transfer.id);

                  const isLegacy =
                    !transfer.reference ||
                    transfer.source_amount === null ||
                    transfer.source_amount === undefined;

                  return (
                    <article
                      key={transfer.id}
                      className="p-5 transition hover:bg-slate-50 sm:p-6"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-950">
                                {transfer.recipient_name || "—"}
                              </h2>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {status}
                              </span>

                              {refunded && (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                                  {text.refunded}
                                </span>
                              )}

                              {isLegacy && (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {text.legacy}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(transfer.created_at, language)}
                            </p>

                            <p className="mt-2 break-all font-mono text-xs text-slate-500">
                              {transfer.reference || "No reference"}
                            </p>
                          </div>

                          <div className="lg:text-right">
                            <p className="text-sm font-medium text-slate-500">
                              {text.amount}
                            </p>

                            <p className="mt-1 text-2xl font-bold text-slate-950">
                              {formatMoney(
                                destinationAmount,
                                destinationCurrency
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {destinationCurrency}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.destination}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {transfer.country || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.method}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {transfer.method || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.fee}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {formatMoney(fee, sourceCurrency)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.totalDebit}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {formatMoney(totalDebit, sourceCurrency)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <span className="text-slate-500">
                              {text.purpose}:{" "}
                            </span>

                            <span className="font-medium text-slate-900">
                              {transfer.purpose || "—"}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500">
                              {text.providerReference}:{" "}
                            </span>

                            <span className="font-medium text-slate-900">
                              {transfer.provider_reference || "—"}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500">
                              {text.completedAt}:{" "}
                            </span>

                            <span className="font-medium text-slate-900">
                              {transfer.completed_at
                                ? formatDate(transfer.completed_at, language)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}