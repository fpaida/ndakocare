"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type SchoolPayment = {
  id: string;
  user_id: string;
  student_name: string;
  school_name: string;
  country: string;
  amount: number;
  currency: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export default function AdminSchoolPaymentsPage() {
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("school_payments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error.message);
      alert(error.message);
    } else {
      setPayments(data || []);
    }

    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("school_payments")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPayments((current) =>
      current.map((payment) =>
        payment.id === id ? { ...payment, status } : payment
      )
    );
  };

  const totalCompletedAmount = payments
    .filter((payment) => payment.status === "Completed")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const pendingCount = payments.filter(
    (payment) => payment.status === "Pending"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Cancelled":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-green-700">
              🎓 School Payments Management
            </h1>

            <p className="text-slate-600 mt-2">
              Review and manage all school fee payment requests.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-slate-500">Total Requests</h3>
              <p className="text-4xl font-bold mt-2">{payments.length}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-slate-500">Pending Requests</h3>
              <p className="text-4xl font-bold text-yellow-600 mt-2">
                {pendingCount}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-slate-500">Completed Amount</h3>
              <p className="text-4xl font-bold text-green-700 mt-2">
                ${totalCompletedAmount}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow p-8">
              Loading school payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8">
              No school payments found.
            </div>
          ) : (
            <div className="grid gap-6">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {payment.student_name}
                      </h2>

                      <p className="text-slate-500">
                        {payment.school_name}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <strong>Student:</strong> {payment.student_name}
                    </div>

                    <div>
                      <strong>School:</strong> {payment.school_name}
                    </div>

                    <div>
                      <strong>Country:</strong> {payment.country}
                    </div>

                    <div>
                      <strong>Amount:</strong> {payment.currency}{" "}
                      {payment.amount}
                    </div>

                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>

                    <div>
                      <strong>Status:</strong> {payment.status}
                    </div>
                  </div>

                  {payment.notes && (
                    <div className="mt-5 bg-slate-50 rounded-xl p-4">
                      <strong>Notes:</strong> {payment.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() =>
                        updateStatus(payment.id, "Processing")
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
                    >
                      Processing
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(payment.id, "Completed")
                      }
                      className="bg-green-700 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-800"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(payment.id, "Rejected")
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}