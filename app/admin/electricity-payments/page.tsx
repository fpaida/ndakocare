"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

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

export default function AdminElectricityPaymentsPage() {
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
      const { data, error } =
        await supabase
          .from("electricity_payments")
          .select("*")
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

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    const { error } = await supabase
      .from("electricity_payments")
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPayments((current) =>
      current.map((payment) =>
        payment.id === id
          ? { ...payment, status }
          : payment
      )
    );
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
            ⚡ Admin Electricity Payments
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
            <div className="overflow-x-auto bg-white rounded-3xl shadow-lg">

              <table className="w-full">

                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-4 text-left">
                      Customer
                    </th>

                    <th className="p-4 text-left">
                      Meter
                    </th>

                    <th className="p-4 text-left">
                      Provider
                    </th>

                    <th className="p-4 text-left">
                      Country
                    </th>

                    <th className="p-4 text-left">
                      Amount
                    </th>

                    <th className="p-4 text-left">
                      Status
                    </th>

                    <th className="p-4 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {payment.customer_name}
                      </td>

                      <td className="p-4">
                        {payment.meter_number}
                      </td>

                      <td className="p-4">
                        {payment.provider}
                      </td>

                      <td className="p-4">
                        {payment.country}
                      </td>

                      <td className="p-4 font-semibold">
                        {payment.amount}{" "}
                        {payment.currency}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <select
                          value={payment.status}
                          onChange={(e) =>
                            updateStatus(
                              payment.id,
                              e.target.value
                            )
                          }
                          className="border rounded-lg p-2"
                        >
                          <option>
                            Pending
                          </option>

                          <option>
                            Processing
                          </option>

                          <option>
                            Completed
                          </option>

                          <option>
                            Cancelled
                          </option>
                        </select>
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