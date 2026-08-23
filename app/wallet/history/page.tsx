"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";

type WalletTransaction = {
  id: string;
  user_id: string | null;
  transaction_type: string | null;
  amount: number | string | null;
  currency: string | null;
  description: string | null;
  created_at: string | null;
  reference: string | null;
  status: string | null;
  direction: string | null;
  balance_before: number | string | null;
  balance_after: number | string | null;
  fee: number | string | null;
  related_transfer_id: string | null;
  service_type: string | null;
  metadata: Record<string, unknown> | null;
};

function toNumber(
  value: number | string | null | undefined
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined
): string {
  const amount = toNumber(value);
  const code = (currency || "USD").toUpperCase();

  const formattedAmount = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (code === "XAF") {
    return `FCFA ${formattedAmount}`;
  }

  if (code === "XOF") {
    return `CFA ${formattedAmount}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${formattedAmount} ${code}`;
  }
}

function formatDate(
  value: string | null,
  language: string
): string {
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

function getTransactionTypeClasses(type: string | null): string {
  switch ((type || "").toLowerCase()) {
    case "deposit":
      return "border-green-200 bg-green-50 text-green-800";

    case "refund":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "transfer":
      return "border-blue-200 bg-blue-50 text-blue-800";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getStatusClasses(status: string | null): string {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "border-green-200 bg-green-50 text-green-800";

    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-800";

    case "failed":
      return "border-red-200 bg-red-50 text-red-800";

    case "pending":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getDirection(
  transaction: WalletTransaction
): "credit" | "debit" | "legacy" {
  const direction = transaction.direction?.toLowerCase();

  if (direction === "credit") {
    return "credit";
  }

  if (direction === "debit") {
    return "debit";
  }

  const type = transaction.transaction_type?.toLowerCase();

  if (type === "deposit" || type === "refund") {
    return "credit";
  }

  if (type === "transfer") {
    return "debit";
  }

  return "legacy";
}

export default function WalletHistoryPage() {
  const { language } = useLanguage();

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const text =
    language === "fr"
      ? {
          eyebrow: "NDAKOCARE · PORTEFEUILLE",
          title: "Historique du portefeuille",
          subtitle:
            "Consultez les dépôts, transferts, remboursements et mouvements de votre portefeuille.",
          loading: "Chargement des transactions...",
          empty: "Aucune transaction trouvée.",
          noMatches:
            "Aucune transaction ne correspond à votre recherche.",
          search:
            "Rechercher par référence, description ou devise...",
          all: "Toutes",
          deposits: "Dépôts",
          transfers: "Transferts",
          refunds: "Remboursements",
          transaction: "Transaction",
          date: "Date",
          reference: "Référence",
          description: "Description",
          amount: "Montant",
          fee: "Frais",
          balanceBefore: "Solde avant",
          balanceAfter: "Solde après",
          service: "Service",
          status: "Statut",
          credit: "Crédit",
          debit: "Débit",
          legacy: "Ancienne transaction",
          transactions: "transactions",
          noReference: "Aucune référence",
        }
      : {
          eyebrow: "NDAKOCARE · WALLET",
          title: "Wallet History",
          subtitle:
            "Review deposits, transfers, refunds, and movements across your wallet.",
          loading: "Loading transactions...",
          empty: "No transactions found.",
          noMatches:
            "No transactions match your search.",
          search:
            "Search reference, description, or currency...",
          all: "All",
          deposits: "Deposits",
          transfers: "Transfers",
          refunds: "Refunds",
          transaction: "Transaction",
          date: "Date",
          reference: "Reference",
          description: "Description",
          amount: "Amount",
          fee: "Fee",
          balanceBefore: "Balance before",
          balanceAfter: "Balance after",
          service: "Service",
          status: "Status",
          credit: "Credit",
          debit: "Debit",
          legacy: "Legacy transaction",
          transactions: "transactions",
          noReference: "No reference",
        };

  const fetchTransactions = useCallback(async () => {
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
          ? "Veuillez vous connecter pour consulter votre portefeuille."
          : "Please sign in to view your wallet history."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(error.message);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setTransactions((data || []) as WalletTransaction[]);
    setLoading(false);
  }, [language]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const counts = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const type =
          transaction.transaction_type?.toLowerCase() || "";

        if (type === "deposit") {
          result.deposit += 1;
        }

        if (type === "transfer") {
          result.transfer += 1;
        }

        if (type === "refund") {
          result.refund += 1;
        }

        return result;
      },
      {
        deposit: 0,
        transfer: 0,
        refund: 0,
      }
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type =
        transaction.transaction_type?.toLowerCase() || "";

      const matchesType =
        typeFilter === "All" ||
        type === typeFilter.toLowerCase();

      if (!matchesType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const values = [
        transaction.transaction_type,
        transaction.reference,
        transaction.description,
        transaction.currency,
        transaction.status,
        transaction.service_type,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [transactions, typeFilter, search]);

  const filters = [
    {
      key: "All",
      label: text.all,
      count: transactions.length,
    },
    {
      key: "Deposit",
      label: text.deposits,
      count: counts.deposit,
    },
    {
      key: "Transfer",
      label: text.transfers,
      count: counts.transfer,
    },
    {
      key: "Refund",
      label: text.refunds,
      count: counts.refund,
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
                  {transactions.length} {text.transactions}
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
                    const active = typeFilter === filter.key;

                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setTypeFilter(filter.key)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-green-700 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {filter.label}

                        <span
                          className={`ml-2 ${
                            active
                              ? "text-green-100"
                              : "text-slate-500"
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
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder={text.search}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 xl:max-w-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-600">
                {text.loading}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                {text.empty}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                {text.noMatches}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredTransactions.map((transaction) => {
                  const direction = getDirection(transaction);

                  const isCredit = direction === "credit";
                  const isDebit = direction === "debit";

                  const isLegacy =
                    !transaction.reference ||
                    transaction.balance_before === null ||
                    transaction.balance_after === null;

                  const amountPrefix = isCredit
                    ? "+"
                    : isDebit
                      ? "−"
                      : "";

                  return (
                    <article
                      key={transaction.id}
                      className="p-5 transition hover:bg-slate-50 sm:p-6"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-950">
                                {transaction.transaction_type ||
                                  text.transaction}
                              </h2>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${getTransactionTypeClasses(
                                  transaction.transaction_type
                                )}`}
                              >
                                {transaction.transaction_type ||
                                  text.transaction}
                              </span>

                              {direction !== "legacy" && (
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                    isCredit
                                      ? "border-green-200 bg-green-50 text-green-800"
                                      : "border-red-200 bg-red-50 text-red-800"
                                  }`}
                                >
                                  {isCredit
                                    ? text.credit
                                    : text.debit}
                                </span>
                              )}

                              {isLegacy && (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {text.legacy}
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                              {formatDate(
                                transaction.created_at,
                                language
                              )}
                            </p>

                            <p className="mt-2 break-all font-mono text-xs text-slate-500">
                              {transaction.reference ||
                                text.noReference}
                            </p>
                          </div>

                          <div className="lg:text-right">
                            <p className="text-sm font-medium text-slate-500">
                              {text.amount}
                            </p>

                            <p
                              className={`mt-1 text-2xl font-bold ${
                                isCredit
                                  ? "text-green-700"
                                  : isDebit
                                    ? "text-red-700"
                                    : "text-slate-950"
                              }`}
                            >
                              {amountPrefix}
                              {formatMoney(
                                transaction.amount,
                                transaction.currency
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {transaction.currency || "USD"}
                            </p>
                          </div>
                        </div>

                        {transaction.description && (
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">
                              {text.description}:{" "}
                            </span>

                            {transaction.description}
                          </div>
                        )}

                        <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.balanceBefore}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {transaction.balance_before !== null
                                ? formatMoney(
                                    transaction.balance_before,
                                    transaction.currency
                                  )
                                : "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.balanceAfter}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {transaction.balance_after !== null
                                ? formatMoney(
                                    transaction.balance_after,
                                    transaction.currency
                                  )
                                : "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.fee}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {formatMoney(
                                transaction.fee ?? 0,
                                transaction.currency
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {text.service}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {transaction.service_type || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-slate-500">
                            {text.status}:
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                              transaction.status || "completed"
                            )}`}
                          >
                            {transaction.status || "completed"}
                          </span>

                          {transaction.related_transfer_id && (
                            <>
                              <span className="text-slate-300">
                                •
                              </span>

                              <span className="text-xs text-slate-500">
                                Transfer ID:{" "}
                                <span className="font-mono">
                                  {transaction.related_transfer_id}
                                </span>
                              </span>
                            </>
                          )}
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