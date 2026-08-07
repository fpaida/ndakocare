"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type MoneyRequest = {
  id: string;
  requester_name: string;
  requester_phone: string;
  country: string;
  request_type: string;
  amount: number;
  currency: string;
  message: string;
  status: string;
  created_at: string;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("money_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    const { error } = await supabase
      .from("money_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadRequests();
  };

  const totalAmount = requests
    .filter((r) => r.status === "Completed")
    .reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-green-700 mb-2">
            🙏 Money Requests
          </h1>

          <p className="text-gray-600 mb-8">
            Manage financial assistance requests.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Total Requests
              </h3>

              <p className="text-4xl font-bold">
                {requests.length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Pending
              </h3>

              <p className="text-4xl font-bold text-yellow-600">
                {
                  requests.filter(
                    (r) => r.status === "Pending"
                  ).length
                }
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Approved Amount
              </h3>

              <p className="text-4xl font-bold text-green-700">
                ${totalAmount}
              </p>
            </div>

          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl shadow">
              Loading...
            </div>
          ) : (
            <div className="grid gap-6">

              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <div className="grid md:grid-cols-2 gap-4">

                    <div>
                      <strong>Name:</strong>{" "}
                      {request.requester_name}
                    </div>

                    <div>
                      <strong>Phone:</strong>{" "}
                      {request.requester_phone}
                    </div>

                    <div>
                      <strong>Country:</strong>{" "}
                      {request.country}
                    </div>

                    <div>
                      <strong>Type:</strong>{" "}
                      {request.request_type}
                    </div>

                    <div>
                      <strong>Amount:</strong>{" "}
                      {request.currency}{" "}
                      {request.amount}
                    </div>

                    <div>
                      <strong>Status:</strong>{" "}
                      {request.status}
                    </div>

                    <div className="md:col-span-2">
                      <strong>Message:</strong>{" "}
                      {request.message}
                    </div>

                  </div>

                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "Processing"
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      Processing
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "Completed"
                        )
                      }
                      className="bg-green-700 text-white px-4 py-2 rounded-xl"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "Rejected"
                        )
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-xl"
                    >
                      Reject
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </>
  );
}