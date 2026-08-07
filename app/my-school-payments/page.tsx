"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

type SchoolPayment = {
  id: string;
  student_name: string;
  school_name: string;
  country: string;
  class_level: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function MySchoolPaymentsPage() {
  const [payments, setPayments] =
    useState<SchoolPayment[]>([]);

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
          .from("school_payments")
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

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-green-700 mb-8">
            🎓 My School Payments
          </h1>

          {loading ? (
            <div className="bg-white rounded-3xl shadow p-8">
              Loading...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-8">
              No school payment requests found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-3xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-green-700 mb-3">
                    {payment.student_name}
                  </h2>

                  <div className="space-y-2 text-gray-700">

                    <p>
                      🏫 {payment.school_name}
                    </p>

                    <p>
                      🌍 {payment.country}
                    </p>

                    <p>
                      📚 {payment.class_level}
                    </p>

                    <p>
                      💰 {payment.amount}{" "}
                      {payment.currency}
                    </p>

                    <p>
                      📌 Status:
                      <span className="font-semibold ml-2">
                        {payment.status}
                      </span>
                    </p>

                    <p className="text-sm text-gray-500">
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