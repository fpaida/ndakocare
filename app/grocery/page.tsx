"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";

import { supabase } from "@/lib/supabase";

export default function GroceryPage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [city, setCity] =
    useState("");

  const [deliveryType, setDeliveryType] =
    useState("Pickup");

  const [items, setItems] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    const { error } = await supabase
      .from("grocery_orders")
      .insert([
        {
          user_id: user.id,

          recipient_name: fullName,

          phone_number: phone,

          country: country,

          city: city,

          delivery_type:
            deliveryType,

          grocery_items: items,

          status: "Pending",
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    await fetch(
      "/api/send-order-email",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          customerEmail:
            user.email,

          customerName:
            fullName,

          country:
            country,

          city:
            city,

          deliveryType:
            deliveryType,

          items:
            items,
        }),
      }
    );

    router.push("/my-orders");
  };

  return (
    <>
      <Navbar />

      <div style={pageStyle}>
        <h1 style={titleStyle}>
          Grocery Order
        </h1>

        <p style={subtitleStyle}>
          Send groceries to your loved
          ones back home.
        </p>

        <form
          onSubmit={handleSubmit}
          style={formStyle}
        >
          <input
            type="text"
            placeholder="Recipient Name"
            value={fullName}
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) =>
              setCountry(
                e.target.value
              )
            }
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) =>
              setCity(
                e.target.value
              )
            }
            required
            style={inputStyle}
          />

          <select
            value={deliveryType}
            onChange={(e) =>
              setDeliveryType(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="Pickup">
              Pickup
            </option>

            <option value="Delivery">
              Delivery
            </option>
          </select>

          <textarea
            placeholder="Grocery List"
            value={items}
            onChange={(e) =>
              setItems(
                e.target.value
              )
            }
            required
            rows={8}
            style={textareaStyle}
          />

          <button
            type="submit"
            style={buttonStyle}
          >
            Submit Grocery Order
          </button>
        </form>
      </div>
    </>
  );
}

const pageStyle = {
  padding: "25px",

  background: "#f4f4f4",

  minHeight: "100vh",
};

const titleStyle = {
  color: "#008037",

  fontSize: "38px",

  marginBottom: "10px",
};

const subtitleStyle = {
  fontSize: "18px",

  marginBottom: "30px",
};

const formStyle = {
  background: "white",

  padding: "25px",

  borderRadius: "20px",

  maxWidth: "850px",
};

const inputStyle = {
  width: "100%",

  padding: "16px",

  marginBottom: "18px",

  borderRadius: "12px",

  border: "1px solid #ccc",

  fontSize: "16px",

  boxSizing: "border-box" as const,
};

const textareaStyle = {
  width: "100%",

  padding: "16px",

  marginBottom: "18px",

  borderRadius: "12px",

  border: "1px solid #ccc",

  fontSize: "16px",

  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",

  padding: "16px",

  background: "#008037",

  color: "white",

  border: "none",

  borderRadius: "12px",

  fontSize: "18px",

  fontWeight: "bold" as const,

  cursor: "pointer",
};
