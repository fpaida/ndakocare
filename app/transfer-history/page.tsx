"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function TransferHistoryPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransfers(data);
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8">

          <h1 className="text-4xl font-bold text-green-700 mb-6">
            Transfer History
          </h1>

          {loading ? (
            <p>Loading...</p>
          ) : transfers.length === 0 ? (
            <p>No transfers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Recipient</th>
                    <th className="p-3 text-left">Country</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">
                        {new Date(
                          transfer.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        {transfer.recipient_name}
                      </td>

                      <td className="p-3">
                        {transfer.country}
                      </td>

                      <td className="p-3">
                        {transfer.amount} {transfer.currency}
                      </td>

                      <td className="p-3">
                        {transfer.method}
                      </td>

                      <td className="p-3">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                          {transfer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}