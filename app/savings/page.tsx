"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

export default function SavingsPage() {
  const { language } = useLanguage();

  const text =
    translations[
      language as keyof typeof translations
    ];

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [goals, setGoals] = useState<any[]>([]);

  const [title, setTitle] = useState("");

  const [targetAmount, setTargetAmount] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    setWalletBalance(
      Number(wallet?.balance || 0)
    );

    const { data: goalsData } =
      await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", {
          ascending: false,
        });

    setGoals(goalsData || []);
  };

  const createGoal = async () => {
    if (!title || !targetAmount) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    await supabase
      .from("savings_goals")
      .insert([
        {
          user_id: session.user.id,
          title,
          target_amount:
            Number(targetAmount),
        },
      ]);

    setTitle("");
    setTargetAmount("");

    loadData();
  };

  const contribute = async (
    goalId: string
  ) => {
    const amount = 10;

    if (walletBalance < amount) {
      alert(
        language === "fr"
          ? "Solde insuffisant"
          : "Insufficient balance"
      );
      return;
    }

    const goal = goals.find(
      (g) => g.id === goalId
    );

    if (!goal) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const newWalletBalance =
      walletBalance - amount;

    await supabase
      .from("wallets")
      .update({
        balance: newWalletBalance,
      })
      .eq("user_id", session.user.id);

    await supabase
      .from("savings_goals")
      .update({
        current_amount:
          Number(goal.current_amount || 0) +
          amount,
      })
      .eq("id", goalId);

    await supabase
      .from("savings_contributions")
      .insert([
        {
          goal_id: goalId,
          user_id: session.user.id,
          amount,
        },
      ]);

    await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: session.user.id,
          transaction_type:
            "Savings Contribution",
          amount,
          currency: "USD",
          description:
            "Contribution to savings goal",
        },
      ]);

    loadData();
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
              Wallet Balance:
              <span className="font-bold text-green-700 ml-2">
                ${walletBalance.toFixed(2)}
              </span>
            </p>

          </div>

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
            />

            <input
              type="number"
              placeholder={text.targetAmount}
              value={targetAmount}
              onChange={(e) =>
                setTargetAmount(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl mb-4"
            />

            <button
              onClick={createGoal}
              className="bg-green-600 text-white px-6 py-3 rounded-xl"
            >
              {text.createGoal}
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {goals.map((goal) => {
              const progress =
                (Number(
                  goal.current_amount || 0
                ) /
                  Number(
                    goal.target_amount
                  )) *
                100;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-3xl shadow-lg p-6"
                >
                  <h3 className="text-2xl font-bold">
                    {goal.title}
                  </h3>

                  <p className="mt-2">
                    Goal:
                    ${goal.target_amount}
                  </p>

                  <p>
                    Current:
                    $
                    {goal.current_amount ||
                      0}
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-4 mt-4">

                    <div
                      className="bg-green-600 h-4 rounded-full"
                      style={{
                        width: `${Math.min(
                          progress,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <button
                    onClick={() =>
                      contribute(goal.id)
                    }
                    className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-xl"
                  >
                    + $10
                  </button>

                </div>
              );
            })}

          </div>

        </div>
      </div>
    </>
  );
}