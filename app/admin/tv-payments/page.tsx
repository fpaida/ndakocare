"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type TvPayment = {
  id: string;
  customer_name: string;
  decoder_number: string;
  provider: string;
  package_name: string;
  country: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function AdminTvPaymentsPage() {
  const [payments, setPayments] = useState<TvPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("tv_payments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error.message);
    } else {
      setPayments(data || []);
    }

    setLoading(false);
  };

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    const { error } = await supabase
      .from("tv_payments")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadPayments();
  };

  const totalRevenue = payments
    .filter(
      (payment) =>
        payment.status === "Completed"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-green-700 mb-2">
            📺 TV Payments Management
          </h1>

          <p className="text-gray-600 mb-8">
            Manage TV subscription requests.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Total Requests
              </h3>

              <p className="text-4xl font-bold">
                {payments.length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Pending Requests
              </h3>

              <p className="text-4xl font-bold text-yellow-600">
                {
                  payments.filter(
                    (p) =>
                      p.status === "Pending"
                  ).length
                }
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Completed Revenue
              </h3>

              <p className="text-4xl font-bold text-green-700">
                ${totalRevenue}
              </p>
            </div>

          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl shadow">
              Loading...
            </div>
          ) : (
            <div className="grid gap-6">

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <div className="grid md:grid-cols-2 gap-4">

                    <div>
                      <strong>
                        Customer:
                      </strong>{" "}
                      {payment.customer_name}
                    </div>

                    <div>
                      <strong>
                        Provider:
                      </strong>{" "}
                      {payment.provider}
                    </div>

                    <div>
                      <strong>
                        Decoder:
                      </strong>{" "}
                      {payment.decoder_number}
                    </div>

                    <div>
                      <strong>
                        Package:
                      </strong>{" "}
                      {payment.package_name}
                    </div>

                    <div>
                      <strong>
                        Country:
                      </strong>{" "}
                      {payment.country}
                    </div>

                    <div>
                      <strong>
                        Amount:
                      </strong>{" "}
                      {payment.currency}{" "}
                      {payment.amount}
                    </div>

                    <div>
                      <strong>
                        Status:
                      </strong>{" "}
                      {payment.status}
                    </div>

                    <div>
                      <strong>
                        Date:
                      </strong>{" "}
                      {new Date(
                        payment.created_at
                      ).toLocaleDateString()}
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">

                    <button
                      onClick={() =>
                        updateStatus(
                          payment.id,
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
                          payment.id,
                          "Completed"
                        )
                      }
                      className="bg-green-700 text-white px-4 py-2 rounded-xl"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          payment.id,
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