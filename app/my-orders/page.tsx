"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "@/app/lib/supabase";

type GroceryOrder = {
  id: number;
  recipient_name: string;
  phone_number: string;
  country: string;
  city: string;
  delivery_type: string;
  grocery_items: string;
  status: string;
  created_at: string;
};

export default function MyOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("grocery_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const deleteOrder = async (id: number) => {
    const confirmDelete = confirm(
      "Delete this grocery order?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("grocery_orders")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order deleted successfully!");

    setOrders((prev) =>
      prev.filter((order) => order.id !== id)
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Loading orders...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "#f4f4f4",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "#008037",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              marginBottom: "25px",
              fontWeight: "bold",
            }}
          >
            ← Back
          </button>

          <h1
            style={{
              fontSize: "48px",
              color: "#008037",
              marginBottom: "30px",
            }}
          >
            My Grocery Orders
          </h1>

          {orders.length === 0 ? (
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "20px",
                textAlign: "center",
              }}
            >
              <h2>No Orders Yet</h2>

              <p>
                You haven't placed any grocery
                orders.
              </p>

              <button
                onClick={() =>
                  router.push("/grocery")
                }
                style={{
                  marginTop: "20px",
                  background: "#008037",
                  color: "white",
                  border: "none",
                  padding: "15px 25px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Place Your First Order
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "25px",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "20px",
                    boxShadow:
                      "0 8px 20px rgba(0,0,0,0.08)",
                    borderLeft:
                      order.status === "Delivered"
                        ? "6px solid #008037"
                        : order.status === "Processing"
                        ? "6px solid #2196f3"
                        : order.status === "Cancelled"
                        ? "6px solid #f44336"
                        : "6px solid #ff9800",
                  }}
                >
                  <h2
                    style={{
                      color: "#008037",
                      marginBottom: "15px",
                    }}
                  >
                    {order.recipient_name}
                  </h2>

                  <p>
                    <strong>Order ID:</strong>{" "}
                    #{order.id}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      order.created_at
                    ).toLocaleString()}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.phone_number}
                  </p>

                  <p>
                    <strong>Country:</strong>{" "}
                    {order.country}
                  </p>

                  <p>
                    <strong>City:</strong>{" "}
                    {order.city}
                  </p>

                  <p>
                    <strong>Delivery:</strong>{" "}
                    {order.delivery_type}
                  </p>

                  <div
                    style={{
                      marginTop: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <strong>Status:</strong>{" "}

                    <span
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        color: "white",
                        fontWeight: "bold",
                        backgroundColor:
                          order.status ===
                          "Delivered"
                            ? "#008037"
                            : order.status ===
                              "Processing"
                            ? "#2196f3"
                            : order.status ===
                              "Cancelled"
                            ? "#f44336"
                            : "#ff9800",
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      background: "#ddd",
                      borderRadius: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "10px",
                        width:
                          order.status ===
                          "Delivered"
                            ? "100%"
                            : order.status ===
                              "Processing"
                            ? "60%"
                            : order.status ===
                              "Pending"
                            ? "20%"
                            : "0%",
                        background:
                          order.status ===
                          "Cancelled"
                            ? "#f44336"
                            : "#008037",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      marginBottom: "20px",
                    }}
                  >
                    <strong>Tracking:</strong>

                    <p>
                      {order.status ===
                        "Pending" &&
                        "📦 Order received"}
                    </p>

                    <p>
                      {order.status ===
                        "Processing" &&
                        "🛒 Shopping in progress"}
                    </p>

                    <p>
                      {order.status ===
                        "Delivered" &&
                        "✅ Order delivered"}
                    </p>

                    <p>
                      {order.status ===
                        "Cancelled" &&
                        "❌ Order cancelled"}
                    </p>
                  </div>

                  <strong>Items:</strong>

                  <div
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "10px",
                      marginTop: "10px",
                      whiteSpace: "pre-line",
                      lineHeight: "1.8",
                    }}
                  >
                    {order.grocery_items}
                  </div>

                  <button
                    onClick={() =>
                      deleteOrder(order.id)
                    }
                    style={{
                      marginTop: "20px",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Delete Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}