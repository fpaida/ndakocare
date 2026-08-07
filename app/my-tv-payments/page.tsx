"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

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

export default function MyTvPaymentsPage() {
  const [payments, setPayments] = useState<TvPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tv_payments")
      .select("*")
      .eq("user_id", user.id)
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

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-4xl font-bold text-green-700 mb-2">
            📺 My TV Payments
          </h1>

          <p className="text-gray-600 mb-8">
            Track all TV subscription payment
            requests.
          </p>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow">
              Loading...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow">
              No TV payments found.
            </div>
          ) : (
            <div className="grid gap-6">

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">

                    <div>
                      <h2 className="text-xl font-bold">
                        {
                          payment.customer_name
                        }
                      </h2>

                      <p className="text-gray-500">
                        {payment.provider}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>

                  </div>

                  <div className="grid md:grid-cols-2 gap-4">

                    <div>
                      <strong>
                        Decoder:
                      </strong>{" "}
                      {
                        payment.decoder_number
                      }
                    </div>

                    <div>
                      <strong>
                        Package:
                      </strong>{" "}
                      {
                        payment.package_name
                      }
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
                      {
                        payment.currency
                      }{" "}
                      {payment.amount}
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
                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </>
  );
}