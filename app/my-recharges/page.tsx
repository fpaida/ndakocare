"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/app/lib/supabase";

type Recharge = {
  id: number;
  phone_number: string;
  operator: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function MyRechargesPage() {
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecharges();
  }, []);

  const fetchRecharges = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("mobile_recharges")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setRecharges(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#008037";
      case "Processing":
        return "#2196f3";
      case "Cancelled":
        return "#f44336";
      default:
        return "#ff9800";
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Loading recharges...</h1>
      </div>
    );
  }

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
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              color: "#008037",
              marginBottom: "10px",
            }}
          >
            My Recharges
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
            }}
          >
            Track all your mobile recharge requests.
          </p>

          {recharges.length === 0 ? (
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "20px",
                textAlign: "center",
              }}
            >
              No recharge requests found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "25px",
              }}
            >
              {recharges.map((recharge) => (
                <div
                  key={recharge.id}
                  style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "20px",
                    borderLeft: `6px solid ${getStatusColor(
                      recharge.status
                    )}`,
                    boxShadow:
                      "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                >
                  <h2
                    style={{
                      color: "#008037",
                      marginBottom: "15px",
                    }}
                  >
                    Recharge #{recharge.id}
                  </h2>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {recharge.phone_number}
                  </p>

                  <p>
                    <strong>Operator:</strong>{" "}
                    {recharge.operator}
                  </p>

                  <p>
                    <strong>Amount:</strong>{" "}
                    {recharge.amount}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      recharge.created_at
                    ).toLocaleString()}
                  </p>

                  <div
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        background:
                          getStatusColor(
                            recharge.status
                          ),
                        color: "white",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      {recharge.status}
                    </span>
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