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

      // ------------------------------------------------------
      // AUTHENTICATED CUSTOMER
      // ------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please login first.");
        return;
      }

      // ------------------------------------------------------
      // VALIDATE FORM
      // ------------------------------------------------------

      if (
        !studentName.trim() ||
        !schoolName.trim() ||
        !country.trim() ||
        !amount
      ) {
        alert(
          "Please complete all required fields."
        );
        return;
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        alert(
          "Please enter a valid payment amount."
        );
        return;
      }

      // ------------------------------------------------------
      // FIND ACTIVE SCHOOL MERCHANT
      // ------------------------------------------------------

      const {
        data: schoolMerchant,
        error: schoolMerchantError,
      } = await supabase
        .from("merchants")
        .select(
          `
            id,
            name,
            merchant_type,
            country,
            country_code,
            currency,
            city,
            is_active
          `
        )
        .eq(
          "merchant_type",
          "School"
        )
        .eq(
          "is_active",
          true
        )
        .ilike(
          "name",
          schoolName.trim()
        )
        .maybeSingle();

      if (schoolMerchantError) {
        console.error(
          "Unable to find school merchant:",
          schoolMerchantError
        );

        alert(
          schoolMerchantError.message
        );
        return;
      }

      if (!schoolMerchant) {
        alert(
          "This school is not currently available in NdakoCare."
        );
        return;
      }

      // ------------------------------------------------------
      // CREATE SCHOOL PAYMENT
      // ------------------------------------------------------

      const { error: insertError } =
        await supabase
          .from("school_payments")
          .insert([
            {
              user_id: user.id,

              // Connect this payment to the
              // authenticated NdakoCare school merchant.
              merchant_id:
                schoolMerchant.id,

              student_name:
                studentName.trim(),

              school_name:
                schoolMerchant.name,

              country:
                schoolMerchant.country ||
                country.trim(),

              class_level:
                classLevel.trim(),

              amount:
                numericAmount,

              currency:
                schoolMerchant.currency ||
                currency,

              notes:
                notes.trim(),
            },
          ]);

      if (insertError) {
        console.error(
          "School payment insert failed:",
          insertError
        );

        alert(insertError.message);
        return;
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      setSuccess(true);

      setStudentName("");
      setSchoolName("");
      setCountry("");
      setClassLevel("");
      setAmount("");
      setCurrency("USD");
      setNotes("");
    } catch (error) {
      console.error(
        "Failed to save school payment:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save school payment.";

      alert(message);
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

            {/* STUDENT NAME */}

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

            {/* SCHOOL NAME */}

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
                placeholder="Bangui International School"
                className="w-full p-4 border rounded-xl"
              />
            </div>

            {/* COUNTRY */}

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

            {/* CLASS LEVEL */}

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

            {/* AMOUNT */}

            <div>
              <label className="block mb-2 font-medium">
                {text.amount}
              </label>

              <div className="flex gap-3">

                <input
                  type="number"
                  min="0"
                  step="0.01"
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
                  <option value="USD">
                    USD
                  </option>

                  <option value="EUR">
                    EUR
                  </option>

                  <option value="XAF">
                    XAF
                  </option>

                  <option value="CDF">
                    CDF
                  </option>
                </select>

              </div>
            </div>

            {/* NOTES */}

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

            {/* SUCCESS MESSAGE */}

            {success && (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl">
                {text.schoolPaymentSuccess}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
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