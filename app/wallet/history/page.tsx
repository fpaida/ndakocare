"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../context/LanguageContext";

export default function WalletHistoryPage() {
  const { language } = useLanguage();

  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", {
        ascending: false,
      });

    setTransactions(data || []);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-8">

          <h1 className="text-4xl font-bold text-green-700 mb-8">
            {language === "fr"
              ? "Historique du Portefeuille"
              : "Wallet History"}
          </h1>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {language === "fr"
                ? "Aucune transaction trouvée."
                : "No transactions found."}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-4 text-left">
                    {language === "fr" ? "Date" : "Date"}
                  </th>

                  <th className="p-4 text-left">
                    {language === "fr" ? "Type" : "Type"}
                  </th>

                  <th className="p-4 text-left">
                    {language === "fr" ? "Montant" : "Amount"}
                  </th>

                  <th className="p-4 text-left">
                    {language === "fr" ? "Statut" : "Status"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {new Date(
                        tx.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="p-4 font-medium">
                      {tx.transaction_type}
                    </td>

                    <td className="p-4 text-green-700 font-semibold">
                      ${Number(tx.amount).toFixed(2)}
                    </td>

                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {tx.status || "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </>
  );
}