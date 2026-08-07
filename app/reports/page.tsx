"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function ReportsPage() {
  const { language } = useLanguage();

  const [walletBalance, setWalletBalance] = useState(0);
  const [deposits, setDeposits] = useState(0);
  const [transfers, setTransfers] = useState(0);
  const [savings, setSavings] = useState(0);
  const [community, setCommunity] = useState(0);
  const [pharmacy, setPharmacy] = useState(0);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const userId = session.user.id;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (wallet) {
      setWalletBalance(Number(wallet.balance));
    }

    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId);

    if (transactions) {
      setDeposits(
        transactions
          .filter(
            (t) =>
              t.transaction_type === "Deposit"
          )
          .reduce(
            (sum, t) =>
              sum + Number(t.amount),
            0
          )
      );

      setTransfers(
        transactions
          .filter(
            (t) =>
              t.transaction_type === "Transfer"
          )
          .reduce(
            (sum, t) =>
              sum + Number(t.amount),
            0
          )
      );
    }

    const { data: savingsData } =
      await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId);

    if (savingsData) {
      setSavings(
        savingsData.reduce(
          (sum, goal) =>
            sum +
            Number(
              goal.current_amount || 0
            ),
          0
        )
      );
    }

    const { data: communityData } =
      await supabase
        .from(
          "community_project_contributions"
        )
        .select("*")
        .eq("user_id", userId);

    if (communityData) {
      setCommunity(
        communityData.reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        )
      );
    }

    const { data: pharmacyData } =
      await supabase
        .from("pharmacy_orders")
        .select("*")
        .eq("user_id", userId);

    if (pharmacyData) {
      setPharmacy(
        pharmacyData.reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        )
      );
    }
  };

  const score =
    Math.min(
      100,
      deposits > 0
        ? Math.round(
            ((savings +
              community) /
              deposits) *
              100
          )
        : 0
    );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <h1 className="text-4xl font-bold text-green-700 mb-8">
              📊{" "}
              {language === "fr"
                ? "Rapports"
                : "Reports"}
            </h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              <Card
                title={
                  language === "fr"
                    ? "Solde"
                    : "Wallet Balance"
                }
                amount={walletBalance}
              />

              <Card
                title={
                  language === "fr"
                    ? "Dépôts"
                    : "Deposits"
                }
                amount={deposits}
              />

              <Card
                title={
                  language === "fr"
                    ? "Transferts"
                    : "Transfers"
                }
                amount={transfers}
              />

              <Card
                title={
                  language === "fr"
                    ? "Épargne"
                    : "Savings"
                }
                amount={savings}
              />

              <Card
                title={
                  language === "fr"
                    ? "Communauté"
                    : "Community"
                }
                amount={community}
              />

              <Card
                title={
                  language === "fr"
                    ? "Pharmacie"
                    : "Pharmacy"
                }
                amount={pharmacy}
              />

            </div>

            <div className="mt-10 bg-green-50 p-8 rounded-2xl">

              <h2 className="text-2xl font-bold text-green-700 mb-3">
                {language === "fr"
                  ? "Santé Financière"
                  : "Financial Health"}
              </h2>

              <div className="text-5xl font-bold">
                {score}/100
              </div>

              <p className="mt-3 text-gray-600">
                {score >= 80
                  ? language === "fr"
                    ? "Excellent"
                    : "Excellent"
                  : score >= 50
                  ? language === "fr"
                    ? "Bon"
                    : "Good"
                  : language === "fr"
                  ? "À améliorer"
                  : "Needs Improvement"}
              </p>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}

function Card({
  title,
  amount,
}: {
  title: string;
  amount: number;
}) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h3 className="text-gray-500 mb-2">
        {title}
      </h3>

      <p className="text-3xl font-bold text-green-700">
        ${amount.toFixed(2)}
      </p>
    </div>
  );
}