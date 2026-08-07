"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function PayElectricityPage() {
  const [customerName, setCustomerName] =
    useState("");

  const [meterNumber, setMeterNumber] =
    useState("");

  const [provider, setProvider] =
    useState("ENERCA");

  const [country, setCountry] =
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
        !customerName ||
        !meterNumber ||
        !provider ||
        !country ||
        !amount
      ) {
        alert(
          "Please complete all required fields."
        );
        return;
      }

      const { error } = await supabase
        .from("electricity_payments")
        .insert([
          {
            user_id: user.id,
            customer_name: customerName,
            meter_number: meterNumber,
            provider,
            country,
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

      setCustomerName("");
      setMeterNumber("");
      setProvider("ENERCA");
      setCountry("");
      setAmount("");
      setCurrency("USD");
      setNotes("");
    } catch (err) {
      console.error(err);
      alert(
        "Failed to save electricity payment."
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
            ⚡ Electricity Bill Payment
          </h1>

          <p className="text-gray-600 mb-8">
            Pay electricity bills for your
            family from anywhere in the world.
          </p>

          <div className="space-y-5">

            <div>
              <label className="block mb-2 font-medium">
                Customer Name
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
                placeholder="Customer Name"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Meter Number
              </label>

              <input
                type="text"
                value={meterNumber}
                onChange={(e) =>
                  setMeterNumber(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
                placeholder="Meter Number"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Provider
              </label>

              <select
                value={provider}
                onChange={(e) =>
                  setProvider(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-xl"
              >
                <option>ENERCA</option>
                <option>SNEL</option>
                <option>SENELEC</option>
                <option>ENEO</option>
                <option>EDM</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Country
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
                placeholder="Country"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Amount
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
                  placeholder="Amount"
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
                Notes
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
                placeholder="Additional information"
              />
            </div>

            {success && (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl">
                Electricity payment request
                submitted successfully!
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-800 disabled:bg-gray-400"
            >
              {loading
                ? "Submitting..."
                : "Submit Electricity Payment"}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}