"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/app/lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import {
  FaClipboardList,
  FaClock,
  FaSpinner,
  FaCheckCircle,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";

type GroceryOrder = {
  id: number;
  status: string;
};

export default function DashboardPage() {
  const { language } = useLanguage();

  const [orders, setOrders] = useState<GroceryOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("grocery_orders")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.log(error.message);
      return;
    }

    setOrders(data || []);
  };

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "Processing"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const text =
    language === "fr"
      ? {
          title: "Tableau de Bord",
          subtitle:
            "Gérez vos commandes et suivez vos livraisons.",
          total: "Total Commandes",
          pending: "En Attente",
          processing: "En Traitement",
          delivered: "Livrées",
          quick: "Actions Rapides",
          grocery: "Nouvelle Commande",
          profile: "Mon Profil",
          orders: "Mes Commandes",
        }
      : {
          title: "Dashboard",
          subtitle:
            "Manage your orders and track deliveries.",
          total: "Total Orders",
          pending: "Pending",
          processing: "Processing",
          delivered: "Delivered",
          quick: "Quick Actions",
          grocery: "New Grocery Order",
          profile: "My Profile",
          orders: "My Orders",
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
        <h1
          style={{
            fontSize: "48px",
            color: "#008037",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          {text.title}
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
            marginBottom: "40px",
          }}
        >
          {text.subtitle}
        </p>

        {/* Statistics Cards */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: "25px",
            marginBottom: "40px",
          }}
        >
          <StatCard
            title={text.total}
            value={totalOrders}
            color="#008037"
            icon={<FaClipboardList />}
          />

          <StatCard
            title={text.pending}
            value={pendingOrders}
            color="#ff9800"
            icon={<FaClock />}
          />

          <StatCard
            title={text.processing}
            value={processingOrders}
            color="#2196f3"
            icon={<FaSpinner />}
          />

          <StatCard
            title={text.delivered}
            value={deliveredOrders}
            color="#008037"
            icon={<FaCheckCircle />}
          />
        </div>

        {/* Quick Actions */}

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "30px",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              color: "#111",
              marginBottom: "25px",
            }}
          >
            {text.quick}
          </h2>

          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/grocery"
              style={actionCard}
            >
              <FaShoppingCart
                size={28}
                color="#008037"
              />

              <span>{text.grocery}</span>
            </a>

            <a
              href="/my-orders"
              style={actionCard}
            >
              <FaClipboardList
                size={28}
                color="#2196f3"
              />

              <span>{text.orders}</span>
            </a>

            <a
              href="/profile"
              style={actionCard}
            >
              <FaUser
                size={28}
                color="#ff9800"
              />

              <span>{text.profile}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "24px",
        padding: "25px",
        boxShadow:
          "0 10px 25px rgba(0,0,0,0.08)",
        borderTop: `6px solid ${color}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              color: "#666",
              fontSize: "16px",
            }}
          >
            {title}
          </p>

          <h2
            style={{
              fontSize: "42px",
              fontWeight: "bold",
              color: "#111",
            }}
          >
            {value}
          </h2>
        </div>

        <div
          style={{
            fontSize: "35px",
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

const actionCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "20px",
  background: "#f9fafb",
  borderRadius: "16px",
  minWidth: "220px",
  textDecoration: "none",
  color: "#111",
  fontWeight: "bold",
  boxShadow:
    "0 5px 15px rgba(0,0,0,0.05)",
};