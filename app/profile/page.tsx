"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const user = session.user;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setCountry(data.country || "");
    }

    setLoading(false);
  };

  const updateProfile = async () => {
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Please login first.");
      setSaving(false);
      return;
    }

    const user = session.user;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: phone,
        country: country,
      });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    alert("Profile updated successfully!");

    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Loading profile...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>
            My Profile
          </h1>

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            style={inputStyle}
          />

          <button
            type="button"
            onClick={updateProfile}
            disabled={saving}
            style={{
              ...buttonStyle,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f4f4",
  padding: "40px",
};

const cardStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  background: "white",
  padding: "40px",
  borderRadius: "20px",
  boxShadow:
    "0 5px 15px rgba(0,0,0,0.08)",
};

const titleStyle = {
  color: "#008037",
  marginBottom: "30px",
};

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  backgroundColor: "#008037",
  color: "white",
  border: "none",
  padding: "15px",
  borderRadius: "10px",
  fontSize: "18px",
  fontWeight: "bold" as const,
  cursor: "pointer" as const,
};