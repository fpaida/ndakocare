"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/app/lib/supabase";
import { getUserProfile } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

type GroceryOrder = {
  id: number;
  recipient_name: string;
  phone_number: string;
  country: string;
  city: string;
  grocery_items: string;
  delivery_type: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const profile = await getUserProfile();

    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.role !== "admin") {
      alert("Admins only.");
      router.push("/dashboard");
      return;
    }

    fetchOrders();
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("grocery_orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (
    id: number,
    status: string
  ) => {
    const { error } = await supabase
      .from("grocery_orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchOrders();
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.recipient_name
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      order.country
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        ) ||
      order.city
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
  );

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Loading Admin Dashboard...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "#f5f7fa",
          padding: "40px",
        }}
      >
        <h1
          style={{
            color: "#008037",
            fontSize: "50px",
            marginBottom: "10px",
          }}
        >
          Admin Dashboard
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
            marginBottom: "30px",
          }}
        >
          Manage grocery orders and
          deliveries
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <DashboardCard
            title="Total Orders"
            value={orders.length}
            color="#008037"
          />

          <DashboardCard
            title="Pending"
            value={
              orders.filter(
                (o) =>
                  o.status ===
                  "Pending"
              ).length
            }
            color="#ff9800"
          />

          <DashboardCard
            title="Processing"
            value={
              orders.filter(
                (o) =>
                  o.status ===
                  "Processing"
              ).length
            }
            color="#2196f3"
          />

          <DashboardCard
            title="Delivered"
            value={
              orders.filter(
                (o) =>
                  o.status ===
                  "Delivered"
              ).length
            }
            color="#008037"
          />
        </div>

        <input
          type="text"
          placeholder="Search by name, country or city..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "15px",
            borderRadius: "12px",
            border:
              "1px solid #ccc",
            marginBottom: "30px",
            fontSize: "16px",
          }}
        />

        {filteredOrders.length ===
        0 ? (
          <div
            style={{
              background:
                "white",
              padding: "40px",
              borderRadius:
                "20px",
            }}
          >
            No orders found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "25px",
            }}
          >
            {filteredOrders.map(
              (order) => (
                <div
                  key={order.id}
                  style={{
                    background:
                      "white",
                    padding:
                      "30px",
                    borderRadius:
                      "20px",
                    boxShadow:
                      "0 8px 20px rgba(0,0,0,0.08)",
                    borderLeft:
                      order.status ===
                      "Delivered"
                        ? "8px solid #008037"
                        : order.status ===
                          "Processing"
                        ? "8px solid #2196f3"
                        : order.status ===
                          "Cancelled"
                        ? "8px solid #f44336"
                        : "8px solid #ff9800",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          color:
                            "#008037",
                        }}
                      >
                        {
                          order.recipient_name
                        }
                      </h2>

                      <p>
                        <strong>
                          Order
                          ID:
                        </strong>{" "}
                        #
                        {
                          order.id
                        }
                      </p>

                      <p>
                        <strong>
                          Date:
                        </strong>{" "}
                        {new Date(
                          order.created_at
                        ).toLocaleString()}
                      </p>

                      <p>
                        <strong>
                          Phone:
                        </strong>{" "}
                        {
                          order.phone_number
                        }
                      </p>

                      <p>
                        <strong>
                          Country:
                        </strong>{" "}
                        {
                          order.country
                        }
                      </p>

                      <p>
                        <strong>
                          City:
                        </strong>{" "}
                        {
                          order.city
                        }
                      </p>

                      <p>
                        <strong>
                          Delivery:
                        </strong>{" "}
                        {
                          order.delivery_type
                        }
                      </p>
                    </div>

                    <div>
                      <span
                        style={{
                          padding:
                            "10px 15px",
                          borderRadius:
                            "12px",
                          color:
                            "white",
                          fontWeight:
                            "bold",
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
                        {
                          order.status
                        }
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop:
                        "20px",
                      marginBottom:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "100%",
                        height:
                          "10px",
                        background:
                          "#ddd",
                        borderRadius:
                          "10px",
                      }}
                    >
                      <div
                        style={{
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
                          height:
                            "100%",
                          background:
                            order.status ===
                            "Cancelled"
                              ? "#f44336"
                              : "#008037",
                          borderRadius:
                            "10px",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        "#f9f9f9",
                      padding:
                        "15px",
                      borderRadius:
                        "12px",
                      whiteSpace:
                        "pre-line",
                      marginBottom:
                        "20px",
                    }}
                  >
                    <strong>
                      Grocery
                      Items
                    </strong>

                    <br />
                    <br />

                    {
                      order.grocery_items
                    }
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "Pending"
                        )
                      }
                      style={
                        pendingButton
                      }
                    >
                      Pending
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "Processing"
                        )
                      }
                      style={
                        processingButton
                      }
                    >
                      Processing
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "Delivered"
                        )
                      }
                      style={
                        deliveredButton
                      }
                    >
                      Delivered
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "Cancelled"
                        )
                      }
                      style={
                        cancelButton
                      }
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

function DashboardCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "15px",
        minWidth: "220px",
        boxShadow:
          "0 5px 15px rgba(0,0,0,0.08)",
      }}
    >
      <h3>{title}</h3>

      <h1
        style={{
          color,
          marginTop: "10px",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

const pendingButton = {
  background: "#ff9800",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
};

const processingButton = {
  background: "#2196f3",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
};

const deliveredButton = {
  background: "#008037",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
};

const cancelButton = {
  background: "#f44336",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
};