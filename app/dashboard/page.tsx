"use client";

import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
} from "../context/LanguageContext";

type GroceryOrder = {
  id: number;

  status: string;
};

export default function DashboardPage() {
  const {
    language,
  } = useLanguage();

  const [orders, setOrders] =
    useState<GroceryOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const user = session.user;

    const { data, error } =
      await supabase
        .from("grocery_orders")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
      console.log(error.message);
      return;
    }

    setOrders(data || []);
  };

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "Pending"
    ).length;

  const processingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "Processing"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status ===
        "Delivered"
    ).length;

  const text =
    language === "fr"
      ? {
          title:
            "Bienvenue sur NdakoCare",

          subtitle:
            "Soutenez votre famille partout en Afrique.",

          total:
            "Total des commandes",

          pending:
            "En attente",

          processing:
            "En traitement",

          delivered:
            "Livrées",
        }
      : {
          title:
            "Welcome to NdakoCare",

          subtitle:
            "Support your family anywhere in Africa.",

          total:
            "Total Orders",

          pending:
            "Pending Orders",

          processing:
            "Processing Orders",

          delivered:
            "Delivered Orders",
        };

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",

          background: "#f4f4f4",

          padding: "25px",
        }}
      >
        <h1
          style={{
            fontSize: "38px",

            color: "#008037",

            marginBottom: "10px",
          }}
        >
          {text.title}
        </h1>

        <p
          style={{
            fontSize: "18px",

            color: "#555",

            marginBottom: "40px",
          }}
        >
          {text.subtitle}
        </p>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: "20px",
          }}
        >
          <div
            style={{
              ...cardStyle,

              borderTop:
                "5px solid #008037",
            }}
          >
            <h2>
              {text.total}
            </h2>

            <p style={numberStyle}>
              {totalOrders}
            </p>
          </div>

          <div
            style={{
              ...cardStyle,

              borderTop:
                "5px solid #ff9800",
            }}
          >
            <h2>
              {text.pending}
            </h2>

            <p style={numberStyle}>
              {pendingOrders}
            </p>
          </div>

          <div
            style={{
              ...cardStyle,

              borderTop:
                "5px solid #2196f3",
            }}
          >
            <h2>
              {text.processing}
            </h2>

            <p style={numberStyle}>
              {processingOrders}
            </p>
          </div>

          <div
            style={{
              ...cardStyle,

              borderTop:
                "5px solid #008037",
            }}
          >
            <h2>
              {text.delivered}
            </h2>

            <p style={numberStyle}>
              {deliveredOrders}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const cardStyle = {
  background: "white",

  padding: "25px",

  borderRadius: "20px",

  boxShadow:
    "0 5px 15px rgba(0,0,0,0.08)",
};

const numberStyle = {
  fontSize: "45px",

  fontWeight: "bold" as const,

  marginTop: "20px",

  color: "#333",
};