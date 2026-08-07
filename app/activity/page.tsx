"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
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

    setActivities(data || []);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-8">

          <h1 className="text-4xl font-bold text-green-700 mb-8">
            Activity Center
          </h1>

          <table className="w-full">

            <thead>

              <tr className="bg-green-700 text-white">

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Type
                </th>

                <th className="p-4 text-left">
                  Description
                </th>

                <th className="p-4 text-left">
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              {activities.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-4">
                    {new Date(
                      item.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    {item.transaction_type}
                  </td>

                  <td className="p-4">
                    {item.description}
                  </td>

                  <td className="p-4 font-semibold">
                    ${item.amount}
                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}