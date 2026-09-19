"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

type SavingsGoal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number | string | null;
  current_amount: number | string | null;
  currency: string;
  status: string | null;
  created_at: string | null;
};

export default function SavingsPage() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const text =
    translations[
      language as keyof typeof translations
    ];

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [
    preferredCurrency,
    setPreferredCurrency,
  ] = useState("USD");

  const [goals, setGoals] = useState<
    SavingsGoal[]
  >([]);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [
    contributingGoalId,
    setContributingGoalId,
  ] = useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadData();
  }, []);

  const formatCurrency = (
    amount: number,
    currency: string
  ) => {
    const normalizedCurrency =
      currency?.trim().toUpperCase() || "USD";

    try {
      return new Intl.NumberFormat(
        isFr ? "fr-FR" : "en-US",
        {
          style: "currency",
          currency: normalizedCurrency,
        }
      ).format(amount);
    } catch {
      return `${normalizedCurrency} ${amount.toFixed(
        2
      )}`;
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage(
          isFr
            ? "Veuillez vous connecter pour accéder à votre épargne."
            : "Please sign in to access your savings."
        );
        return;
      }

      const userId = session.user.id;

      /*
       * Preferred currency
       *
       * Some older accounts may not yet have
       * a profile row, so USD remains the
       * safe fallback.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Unable to load preferred currency:",
          profileError
        );
      }

      const currency =
        profile?.preferred_currency
          ?.trim()
          .toUpperCase() || "USD";

      setPreferredCurrency(currency);

      /*
       * Current multi-currency wallet balance
       */
      const {
        data: wallet,
        error: walletError,
      } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", userId)
        .eq("currency", currency)
        .maybeSingle();

      if (walletError) {
        console.error(
          "Unable to load wallet balance:",
          walletError
        );
      }

      setWalletBalance(
        Number(wallet?.balance || 0)
      );

      /*
       * Customer savings goals
       */
      const {
        data: goalsData,
        error: goalsError,
      } = await supabase
        .from("savings_goals")
        .select(
          `
            id,
            user_id,
            title,
            description,
            target_amount,
            current_amount,
            currency,
            status,
            created_at
          `
        )
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (goalsError) {
        throw goalsError;
      }

      setGoals(
        (goalsData || []) as SavingsGoal[]
      );
    } catch (error) {
      console.error(
        "Unable to load savings:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible de charger vos informations d'épargne."
          : "Unable to load your savings information."
      );
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    setMessage("");
    setErrorMessage("");

    const cleanTitle = title.trim();
    const amount = Number(targetAmount);

    if (!cleanTitle) {
      setErrorMessage(
        isFr
          ? "Veuillez saisir le nom de l'objectif."
          : "Please enter a goal name."
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez saisir un montant cible valide."
          : "Please enter a valid target amount."
      );
      return;
    }

    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Authentication required."
        );
      }

      const { error } = await supabase
        .from("savings_goals")
        .insert([
          {
            user_id: session.user.id,
            title: cleanTitle,
            target_amount: amount,
            current_amount: 0,
            currency: preferredCurrency,
            status: "Active",
          },
        ]);

      if (error) {
        throw error;
      }

      setTitle("");
      setTargetAmount("");

      setMessage(
        isFr
          ? "Objectif d'épargne créé avec succès."
          : "Savings goal created successfully."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Unable to create savings goal:",
        error
      );

      setErrorMessage(
        isFr
          ? "Impossible de créer l'objectif d'épargne."
          : "Unable to create the savings goal."
      );
    } finally {
      setCreating(false);
    }
  };

  const contribute = async (
    goal: SavingsGoal
  ) => {
    setMessage("");
    setErrorMessage("");

    const amount = 10;

    const goalCurrency =
      goal.currency?.trim().toUpperCase() ||
      preferredCurrency;

    if (goalCurrency !== preferredCurrency) {
      setErrorMessage(
        isFr
          ? `Cet objectif utilise ${goalCurrency}. Sélectionnez ou utilisez le portefeuille correspondant avant de contribuer.`
          : `This goal uses ${goalCurrency}. Use the matching wallet before contributing.`
      );
      return;
    }

    const currentAmount = Number(
      goal.current_amount || 0
    );

    const targetAmountValue = Number(
      goal.target_amount || 0
    );

    const remaining =
      targetAmountValue - currentAmount;

    if (remaining <= 0) {
      setErrorMessage(
        isFr
          ? "Cet objectif d'épargne est déjà atteint."
          : "This savings goal has already been reached."
      );
      return;
    }

    if (amount > remaining) {
      setErrorMessage(
        isFr
          ? `Le montant restant est de ${formatCurrency(
              remaining,
              goalCurrency
            )}.`
          : `The remaining goal amount is ${formatCurrency(
              remaining,
              goalCurrency
            )}.`
      );
      return;
    }

    if (walletBalance < amount) {
      setErrorMessage(
        isFr
          ? "Solde du portefeuille insuffisant."
          : "Insufficient wallet balance."
      );
      return;
    }

    setContributingGoalId(goal.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Authentication required."
        );
      }

      /*
       * One key per user action.
       *
       * If the same request is retried with
       * this key, the database will not debit
       * the wallet twice.
       */
      const idempotencyKey =
        crypto.randomUUID();

      const {
        data,
        error,
      } = await supabase.rpc(
        "ndakocare_create_savings_contribution_v2",
        {
          p_goal_id: goal.id,
          p_amount: amount,
          p_idempotency_key:
            idempotencyKey,
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          "Savings contribution failed."
        );
      }

      setMessage(
        isFr
          ? `Contribution de ${formatCurrency(
              amount,
              goalCurrency
            )} effectuée avec succès.`
          : `${formatCurrency(
              amount,
              goalCurrency
            )} contribution completed successfully.`
      );

      await loadData();
    } catch (error: unknown) {
      console.error(
        "Unable to create savings contribution:",
        error
      );

      const messageText =
        error instanceof Error
          ? error.message
          : "";

      if (
        messageText
          .toLowerCase()
          .includes("insufficient")
      ) {
        setErrorMessage(
          isFr
            ? "Solde du portefeuille insuffisant."
            : "Insufficient wallet balance."
        );
      } else if (
        messageText
          .toLowerCase()
          .includes("exceeds")
      ) {
        setErrorMessage(
          isFr
            ? "Cette contribution dépasse le montant restant de l'objectif."
            : "This contribution exceeds the remaining goal amount."
        );
      } else {
        setErrorMessage(
          isFr
            ? "Impossible d'effectuer la contribution."
            : "Unable to complete the contribution."
        );
      }
    } finally {
      setContributingGoalId(null);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-green-700 mb-4">
              🏠 {text.savingsGoals}
            </h1>

            <p className="text-gray-600">
              {isFr
                ? "Solde du portefeuille :"
                : "Wallet Balance:"}

              <span className="font-bold text-green-700 ml-2">
                {formatCurrency(
                  walletBalance,
                  preferredCurrency
                )}
              </span>
            </p>
          </div>

          {message && (
            <div className="max-w-6xl mx-auto mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="max-w-6xl mx-auto mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {text.createGoal}
            </h2>

            <input
              type="text"
              placeholder={text.goalName}
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="w-full border p-3 rounded-xl mb-4"
              disabled={creating}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={text.targetAmount}
              value={targetAmount}
              onChange={(e) =>
                setTargetAmount(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl mb-4"
              disabled={creating}
            />

            <p className="text-sm text-gray-500 mb-4">
              {isFr
                ? `Devise : ${preferredCurrency}`
                : `Currency: ${preferredCurrency}`}
            </p>

            <button
              onClick={() =>
                void createGoal()
              }
              disabled={creating}
              className="bg-green-600 text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating
                ? isFr
                  ? "Création..."
                  : "Creating..."
                : text.createGoal}
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <p className="text-gray-600">
                {isFr
                  ? "Chargement..."
                  : "Loading..."}
              </p>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <p className="text-gray-600">
                {isFr
                  ? "Aucun objectif d'épargne pour le moment."
                  : "No savings goals yet."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const target = Number(
                  goal.target_amount || 0
                );

                const current = Number(
                  goal.current_amount || 0
                );

                const goalCurrency =
                  goal.currency
                    ?.trim()
                    .toUpperCase() ||
                  preferredCurrency;

                const progress =
                  target > 0
                    ? (current / target) * 100
                    : 0;

                const completed =
                  current >= target &&
                  target > 0;

                const isContributing =
                  contributingGoalId ===
                  goal.id;

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-3xl shadow-lg p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold">
                        {goal.title}
                      </h3>

                      <span className="text-sm rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                        {goalCurrency}
                      </span>
                    </div>

                    <p className="mt-3">
                      {isFr
                        ? "Objectif :"
                        : "Goal:"}{" "}
                      {formatCurrency(
                        target,
                        goalCurrency
                      )}
                    </p>

                    <p>
                      {isFr
                        ? "Épargné :"
                        : "Saved:"}{" "}
                      {formatCurrency(
                        current,
                        goalCurrency
                      )}
                    </p>

                    <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              progress,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                      {Math.min(
                        Math.max(progress, 0),
                        100
                      ).toFixed(0)}
                      %
                    </p>

                    {completed ? (
                      <div className="mt-6 font-semibold text-green-700">
                        {isFr
                          ? "Objectif atteint"
                          : "Goal reached"}
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          void contribute(goal)
                        }
                        disabled={
                          isContributing ||
                          goalCurrency !==
                            preferredCurrency
                        }
                        className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isContributing
                          ? isFr
                            ? "Traitement..."
                            : "Processing..."
                          : `+ ${formatCurrency(
                              10,
                              goalCurrency
                            )}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}