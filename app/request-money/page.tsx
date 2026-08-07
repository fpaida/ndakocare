"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function RequestMoneyPage() {
  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [country, setCountry] = useState("");
  const [requestType, setRequestType] = useState("School Fees");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitRequest = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("money_requests")
      .insert([
        {
          user_id: user.id,
          requester_name: requesterName,
          requester_phone: requesterPhone,
          country,
          request_type: requestType,
          amount: Number(amount),
          currency,
          message,
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSuccess(true);

    setRequesterName("");
    setRequesterPhone("");
    setCountry("");
    setAmount("");
    setMessage("");
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-10">

          <h1 className="text-4xl font-bold text-green-700 mb-4">
            Request Money
          </h1>

          <p className="text-gray-600 mb-8">
            Submit a financial assistance request.
          </p>

          <div className="space-y-5">

            <input
              type="text"
              placeholder="Requester Name"
              value={requesterName}
              onChange={(e) =>
                setRequesterName(e.target.value)
              }
              className="w-full p-4 border rounded-xl"
            />

            <input
              type="text"
              placeholder="Requester Phone"
              value={requesterPhone}
              onChange={(e) =>
                setRequesterPhone(e.target.value)
              }
              className="w-full p-4 border rounded-xl"
            />

            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) =>
                setCountry(e.target.value)
              }
              className="w-full p-4 border rounded-xl"
            />

            <select
              value={requestType}
              onChange={(e) =>
                setRequestType(e.target.value)
              }
              className="w-full p-4 border rounded-xl"
            >
              <option>School Fees</option>
              <option>Medical Emergency</option>
              <option>Food Assistance</option>
              <option>Rent Assistance</option>
              <option>Transportation</option>
              <option>Other</option>
            </select>

            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                className="flex-1 p-4 border rounded-xl"
              />

              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value)
                }
                className="p-4 border rounded-xl"
              >
                <option>XAF</option>
                <option>USD</option>
                <option>EUR</option>
                <option>CDF</option>
              </select>
            </div>

            <textarea
              rows={4}
              placeholder="Describe the request"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              className="w-full p-4 border rounded-xl"
            />

            {success && (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl">
                Request submitted successfully!
              </div>
            )}

            <button
              onClick={submitRequest}
              disabled={loading}
              className="w-full bg-green-700 text-white p-4 rounded-xl font-bold"
            >
              {loading
                ? "Submitting..."
                : "Submit Request"}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}