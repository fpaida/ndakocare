"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

export default function SchoolFeesPage() {

    const { language } = useLanguage();

const text =
  translations[
    language as keyof typeof translations
  ];

  const [studentName, setStudentName] =
    useState("");

  const [schoolName, setSchoolName] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [classLevel, setClassLevel] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [currency, setCurrency] =
    useState("USD");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSuccess(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      if (
        !studentName ||
        !schoolName ||
        !country ||
        !amount
      ) {
        alert(
          "Please complete all required fields."
        );
        return;
      }

      const { error } = await supabase
        .from("school_payments")
        .insert([
          {
            user_id: user.id,
            student_name: studentName,
            school_name: schoolName,
            country,
            class_level: classLevel,
            amount: Number(amount),
            currency,
            notes,
          },
        ]);

      if (error) {
        alert(error.message);
        return;
      }

      setSuccess(true);

      setStudentName("");
      setSchoolName("");
      setCountry("");
      setClassLevel("");
      setAmount("");
      setCurrency("USD");
      setNotes("");
    } catch (err) {
      console.error(err);
      alert(
        "Failed to save school payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-10">

          <h1 className="text-4xl font-bold text-green-700 mb-4">
            {text.schoolFeesTitle}
          </h1>

          <p className="text-gray-600 mb-8">
            {text.schoolFeesSubtitle}
          </p>

          <div className="space-y-5">

            <div>
              <label className="block mb-2 font-medium">
                {text.studentName}
              </label>

              <input
                type="text"
                value={studentName}
                onChange={(e) =>
                  setStudentName(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                {text.schoolName}
              </label>

              <input
                type="text"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
               {text.country}
              </label>

              <input
                type="text"
                value={country}
                onChange={(e) =>
                  setCountry(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
               {text.classLevel}
              </label>

              <input
                type="text"
                value={classLevel}
                onChange={(e) =>
                  setClassLevel(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                {text.amount}
              </label>

              <div className="flex gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  className="flex-1 p-4 border rounded-xl"
                />

                <select
                  value={currency}
                  onChange={(e) =>
                    setCurrency(
                      e.target.value
                    )
                  }
                  className="p-4 border rounded-xl"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>XAF</option>
                  <option>CDF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                {text.notes}
              </label>

              <textarea
                rows={4}
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            {success && (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl">
                {text.schoolPaymentSuccess}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-800"
            >
              {loading
            ? text.submitting
            : text.submitSchoolFee}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}