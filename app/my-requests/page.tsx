"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("money_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setRequests(data);
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-8">

          <h1 className="text-4xl font-bold text-green-700 mb-6">
            My Requests
          </h1>

          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p>No requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">

                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Requester</th>
                    <th className="p-3 text-left">Country</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b"
                    >
                      <td className="p-3">
                        {new Date(
                          request.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        {request.requester_name}
                      </td>

                      <td className="p-3">
                        {request.country}
                      </td>

                      <td className="p-3">
                        {request.request_type}
                      </td>

                      <td className="p-3">
                        {request.amount}{" "}
                        {request.currency}
                      </td>

                      <td className="p-3">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                          {request.status}
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