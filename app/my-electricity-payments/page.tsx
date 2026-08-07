"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

type ElectricityPayment = {
  id: string;
  customer_name: string;
  meter_number: string;
  provider: string;
  country: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function MyElectricityPaymentsPage() {
  const [payments, setPayments] = useState<
    ElectricityPayment[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } =
        await supabase
          .from("electricity_payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(error);
        return;
      }

      setPayments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-green-700 mb-8">
            ⚡ My Electricity Payments
          </h1>

          {loading ? (
            <div className="bg-white rounded-3xl shadow p-8">
              Loading...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-8">
              No electricity payments found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-3xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-green-700 mb-4">
                    {payment.customer_name}
                  </h2>

                  <div className="space-y-2 text-gray-700">

                    <p>
                      🔌 Provider:
                      <span className="font-semibold ml-2">
                        {payment.provider}
                      </span>
                    </p>

                    <p>
                      🔢 Meter:
                      <span className="ml-2">
                        {payment.meter_number}
                      </span>
                    </p>

                    <p>
                      🌍 Country:
                      <span className="ml-2">
                        {payment.country}
                      </span>
                    </p>

                    <p>
                      💰 Amount:
                      <span className="ml-2 font-semibold">
                        {payment.amount}{" "}
                        {payment.currency}
                      </span>
                    </p>

                    <div className="pt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 pt-2">
                      Submitted:
                      {" "}
                      {new Date(
                        payment.created_at
                      ).toLocaleDateString()}
                    </p>

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