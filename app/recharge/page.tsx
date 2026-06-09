"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/app/lib/supabase";

export default function RechargePage() {
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("Orange");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRecharge = async () => {
    if (!phone || !amount) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Please login first.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("mobile_recharges")
      .insert([
        {
          user_id: session.user.id,
          phone_number: phone,
          operator,
          amount: Number(amount),
          status: "Pending",
        },
      ]);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Recharge request submitted successfully!");

    setPhone("");
    setAmount("");
    setOperator("Orange");

    setLoading(false);
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            background: "#ffffff",
            padding: "40px",
            borderRadius: "24px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              color: "#008037",
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            Mobile Recharge
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
              fontSize: "16px",
            }}
          >
            Send airtime to family and friends anywhere in Africa.
          </p>

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            style={inputStyle}
          >
            <option value="Orange">Orange</option>
            <option value="Telecel">Telecel</option>
            <option value="MTN">MTN</option>
            <option value="Moov">Moov</option>
          </select>

          <input
            type="number"
            placeholder="Amount (Example: 5000)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={submitRecharge}
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Submitting..."
              : "Submit Recharge"}
          </button>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  background: "#008037",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};