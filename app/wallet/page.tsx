"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

type WalletTransaction = {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number | string;
  currency: string | null;
  description: string | null;
  created_at: string;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const transactionFilters = [
  "All",
  "Deposit",
  "Transfer",
  "Withdrawal",
] as const;

type TransactionFilter = (typeof transactionFilters)[number];

export default function WalletPage() {
  const { language } = useLanguage();

  const text = translations[language as keyof typeof translations];

  const isFrench = language === "fr";

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<TransactionFilter>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setMessage({
          type: "error",
          text: isFrench
            ? "Vous devez être connecté pour accéder à votre portefeuille."
            : "You must be signed in to access your wallet.",
        });
        return;
      }

      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (walletError) {
        throw walletError;
      }

      let currentBalance = 0;

      if (!walletData) {
        const { data: newWallet, error: createWalletError } =
          await supabase
            .from("wallets")
            .insert([
              {
                user_id: session.user.id,
                balance: 0,
              },
            ])
            .select("balance")
            .single();

        if (createWalletError) {
          throw createWalletError;
        }

        currentBalance = Number(newWallet?.balance ?? 0);
      } else {
        currentBalance = Number(walletData.balance ?? 0);
      }

      const { data: transactionData, error: transactionError } =
        await supabase
          .from("wallet_transactions")
          .select(
            "id, user_id, transaction_type, amount, currency, description, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

      if (transactionError) {
        throw transactionError;
      }

      setBalance(currentBalance);
      setTransactions(transactionData ?? []);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isFrench
            ? "Une erreur est survenue."
            : "An unexpected error occurred.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isFrench]);

  useEffect(() => {
    void fetchWalletData();
  }, [fetchWalletData]);

  const handleDeposit = async () => {
    setMessage(null);

    const depositAmount = Number(amount);

    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      setMessage({
        type: "error",
        text: isFrench
          ? "Veuillez entrer un montant valide supérieur à zéro."
          : "Please enter a valid amount greater than zero.",
      });
      return;
    }

    setIsDepositing(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error(
          isFrench
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Your session has expired. Please sign in again."
        );
      }

      const { data: latestWallet, error: walletReadError } =
        await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", session.user.id)
          .single();

      if (walletReadError) {
        throw walletReadError;
      }

      const latestBalance = Number(latestWallet.balance ?? 0);
      const newBalance = latestBalance + depositAmount;

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
        })
        .eq("user_id", session.user.id);

      if (walletUpdateError) {
        throw walletUpdateError;
      }

      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert([
          {
            user_id: session.user.id,
            transaction_type: "Deposit",
            amount: depositAmount,
            currency: "USD",
            description: "Wallet Deposit",
          },
        ]);

      if (transactionError) {
        const { error: rollbackError } = await supabase
          .from("wallets")
          .update({
            balance: latestBalance,
          })
          .eq("user_id", session.user.id);

        if (rollbackError) {
          console.error(
            "Wallet rollback failed:",
            rollbackError.message
          );
        }

        throw transactionError;
      }

      setAmount("");
      setShowDeposit(false);

      setMessage({
        type: "success",
        text: isFrench
          ? "Dépôt effectué avec succès."
          : "Deposit completed successfully.",
      });

      await fetchWalletData();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isFrench
            ? "Le dépôt n'a pas pu être effectué."
            : "The deposit could not be completed.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = () => {
    setMessage({
      type: "error",
      text: isFrench
        ? "La fonction de retrait sera bientôt disponible."
        : "The withdrawal feature is coming soon.",
    });
  };

  const totalDeposits = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.transaction_type.toLowerCase() === "deposit"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount ?? 0),
        0
      );
  }, [transactions]);

  const totalOutgoing = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const type = transaction.transaction_type.toLowerCase();

        return type === "transfer" || type === "withdrawal";
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount ?? 0),
        0
      );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionType =
        transaction.transaction_type.toLowerCase();

      const matchesFilter =
        activeFilter === "All" ||
        transactionType === activeFilter.toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.transaction_type
          .toLowerCase()
          .includes(normalizedSearch) ||
        transaction.description
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        transaction.currency
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm, transactions]);

  const formatCurrency = (
    value: number,
    currency = "USD"
  ) => {
    try {
      return new Intl.NumberFormat(
        isFrench ? "fr-FR" : "en-US",
        {
          style: "currency",
          currency,
        }
      ).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
      isFrench ? "fr-FR" : "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(new Date(date));
  };

  const getTransactionStyle = (transactionType: string) => {
    const type = transactionType.toLowerCase();

    if (type === "deposit") {
      return {
        icon: "↓",
        iconClass: "bg-emerald-100 text-emerald-700",
        badgeClass:
          "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
        amountClass: "text-emerald-700",
        prefix: "+",
      };
    }

    if (type === "transfer") {
      return {
        icon: "↗",
        iconClass: "bg-blue-100 text-blue-700",
        badgeClass:
          "bg-blue-100 text-blue-700 ring-blue-600/20",
        amountClass: "text-gray-900",
        prefix: "-",
      };
    }

    if (type === "withdrawal") {
      return {
        icon: "↑",
        iconClass: "bg-orange-100 text-orange-700",
        badgeClass:
          "bg-orange-100 text-orange-700 ring-orange-600/20",
        amountClass: "text-gray-900",
        prefix: "-",
      };
    }

    return {
      icon: "•",
      iconClass: "bg-gray-100 text-gray-700",
      badgeClass:
        "bg-gray-100 text-gray-700 ring-gray-600/20",
      amountClass: "text-gray-900",
      prefix: "",
    };
  };

  const getFilterLabel = (filter: TransactionFilter) => {
    if (!isFrench) {
      return filter;
    }

    const labels: Record<TransactionFilter, string> = {
      All: "Toutes",
      Deposit: "Dépôts",
      Transfer: "Transferts",
      Withdrawal: "Retraits",
    };

    return labels[filter];
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              NdakoCare
            </p>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {text.wallet}
                </h1>

                <p className="mt-2 max-w-2xl text-slate-600">
                  {text.walletDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchWalletData()}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? isFrench
                    ? "Actualisation..."
                    : "Refreshing..."
                  : isFrench
                    ? "Actualiser"
                    : "Refresh"}
              </button>
            </div>
          </section>

          {message && (
            <div
              role="alert"
              className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p>{message.text}</p>

                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className="rounded-md px-2 text-lg leading-none opacity-60 transition hover:opacity-100"
                  aria-label={
                    isFrench
                      ? "Fermer le message"
                      : "Close message"
                  }
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-900/10 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">
                  {text.availableBalance}
                </p>

                {isLoading ? (
                  <div className="mt-3 h-14 w-56 animate-pulse rounded-xl bg-white/20" />
                ) : (
                  <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    {formatCurrency(balance)}
                  </h2>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-emerald-50">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                    USD
                  </span>

                  <span>
                    {isFrench
                      ? "Portefeuille personnel sécurisé"
                      : "Secure personal wallet"}
                  </span>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeposit(true);
                    setMessage(null);
                  }}
                  className="rounded-2xl bg-white px-5 py-4 text-left text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  <span className="mb-3 block text-2xl">＋</span>
                  <span className="block font-bold">
                    {text.walletDeposit}
                  </span>
                  <span className="mt-1 block text-xs text-emerald-700">
                    {isFrench
                      ? "Ajouter des fonds"
                      : "Add funds"}
                  </span>
                </button>

                <Link
                  href="/transfer"
                  className="rounded-2xl bg-white/10 px-5 py-4 text-left text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <span className="mb-3 block text-2xl">↗</span>
                  <span className="block font-bold">
                    {text.walletTransfer}
                  </span>
                  <span className="mt-1 block text-xs text-emerald-50">
                    {isFrench
                      ? "Envoyer de l'argent"
                      : "Send money"}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-left text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <span className="mb-3 block text-2xl">↑</span>
                  <span className="block font-bold">
                    {text.walletWithdraw}
                  </span>
                  <span className="mt-1 block text-xs text-emerald-50">
                    {isFrench
                      ? "Bientôt disponible"
                      : "Coming soon"}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {showDeposit && (
            <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    {isFrench
                      ? "Déposer de l'argent"
                      : "Deposit Money"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {isFrench
                      ? "Ajoutez des fonds à votre portefeuille NdakoCare."
                      : "Add funds to your NdakoCare wallet."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeposit(false);
                    setAmount("");
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xl leading-none text-slate-600 transition hover:bg-slate-200"
                  aria-label={
                    isFrench
                      ? "Fermer le formulaire"
                      : "Close deposit form"
                  }
                >
                  ×
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <label
                    htmlFor="deposit-amount"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {isFrench ? "Montant du dépôt" : "Deposit amount"}
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-semibold text-slate-500">
                      $
                    </span>

                    <input
                      id="deposit-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void handleDeposit();
                        }
                      }}
                      placeholder="0.00"
                      className="min-h-14 w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleDeposit()}
                    disabled={isDepositing}
                    className="min-h-14 rounded-2xl bg-emerald-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDepositing
                      ? isFrench
                        ? "Traitement..."
                        : "Processing..."
                      : text.walletDeposit}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeposit(false);
                      setAmount("");
                    }}
                    disabled={isDepositing}
                    className="min-h-14 rounded-2xl border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFrench ? "Annuler" : "Cancel"}
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="mb-8 grid gap-5 md:grid-cols-3">
            <SummaryCard
              label={
                isFrench ? "Solde disponible" : "Available balance"
              }
              value={
                isLoading
                  ? "—"
                  : formatCurrency(balance)
              }
              icon="💰"
              helperText={
                isFrench
                  ? "Solde actuel du portefeuille"
                  : "Current wallet balance"
              }
            />

            <SummaryCard
              label={
                isFrench ? "Total des dépôts" : "Total deposits"
              }
              value={
                isLoading
                  ? "—"
                  : formatCurrency(totalDeposits)
              }
              icon="↓"
              helperText={
                isFrench
                  ? `${transactions.filter(
                      (transaction) =>
                        transaction.transaction_type.toLowerCase() ===
                        "deposit"
                    ).length} opération(s)`
                  : `${transactions.filter(
                      (transaction) =>
                        transaction.transaction_type.toLowerCase() ===
                        "deposit"
                    ).length} transaction(s)`
              }
            />

            <SummaryCard
              label={
                isFrench
                  ? "Fonds envoyés"
                  : "Outgoing funds"
              }
              value={
                isLoading
                  ? "—"
                  : formatCurrency(totalOutgoing)
              }
              icon="↗"
              helperText={
                isFrench
                  ? "Transferts et retraits"
                  : "Transfers and withdrawals"
              }
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {isFrench
                      ? "Historique des transactions"
                      : "Transaction history"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {isFrench
                      ? "Consultez les opérations récentes de votre portefeuille."
                      : "Review your recent wallet activity."}
                  </p>
                </div>

                <div className="w-full lg:max-w-sm">
                  <label
                    htmlFor="transaction-search"
                    className="sr-only"
                  >
                    {isFrench
                      ? "Rechercher des transactions"
                      : "Search transactions"}
                  </label>

                  <input
                    id="transaction-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder={
                      isFrench
                        ? "Rechercher une transaction..."
                        : "Search transactions..."
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {transactionFilters.map((filter) => {
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {getFilterLabel(filter)}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 p-6 sm:p-8">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-slate-200" />

                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
                    </div>

                    <div className="h-5 w-24 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-10 text-center sm:p-16">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                  📄
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {transactions.length === 0
                    ? isFrench
                      ? "Aucune transaction"
                      : "No transactions yet"
                    : isFrench
                      ? "Aucun résultat"
                      : "No matching transactions"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  {transactions.length === 0
                    ? isFrench
                      ? "Vos dépôts, transferts et retraits apparaîtront ici."
                      : "Your deposits, transfers, and withdrawals will appear here."
                    : isFrench
                      ? "Essayez de modifier votre recherche ou votre filtre."
                      : "Try changing your search term or selected filter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((transaction) => {
                  const style = getTransactionStyle(
                    transaction.transaction_type
                  );

                  const amountValue = Number(
                    transaction.amount ?? 0
                  );

                  return (
                    <article
                      key={transaction.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-8"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${style.iconClass}`}
                        >
                          {style.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">
                              {transaction.description ||
                                transaction.transaction_type}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badgeClass}`}
                            >
                              {transaction.transaction_type}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="pl-16 text-left sm:pl-0 sm:text-right">
                        <p
                          className={`text-lg font-bold ${style.amountClass}`}
                        >
                          {style.prefix}
                          {formatCurrency(
                            amountValue,
                            transaction.currency || "USD"
                          )}
                        </p>

                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {transaction.currency || "USD"}
                        </p>
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

type SummaryCardProps = {
  label: string;
  value: string;
  icon: string;
  helperText: string;
};

function SummaryCard({
  label,
  value,
  icon,
  helperText,
}: SummaryCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {helperText}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
          {icon}
        </div>
      </div>
    </article>
  );
}