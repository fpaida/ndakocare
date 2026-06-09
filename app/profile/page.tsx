"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";
import { useLanguage } from "../context/LanguageContext";

import {
  FaUser,
  FaPhone,
  FaGlobe,
  FaSave,
} from "react-icons/fa";

export default function ProfilePage() {
  const { language } = useLanguage();

  const text =
    translations[
      language as keyof typeof translations
    ];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");

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

    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
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
      alert(
        language === "fr"
          ? "Veuillez vous connecter d'abord."
          : "Please login first."
      );

      setSaving(false);
      return;
    }

    const user = session.user;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone,
        country,
      });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    alert(
      language === "fr"
        ? "Profil mis à jour avec succès!"
        : "Profile updated successfully!"
    );

    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>{text.loading}</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <FaUser
              size={70}
              style={{
                marginBottom: "15px",
              }}
            />

            <h1 style={titleStyle}>
              {text.profileTitle}
            </h1>

            <p>{text.profileSubtitle}</p>
          </div>

          <div style={bodyStyle}>
            <label style={labelStyle}>
              {text.fullName}
            </label>

            <div style={inputWrapper}>
              <FaUser color="#008037" />

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <label style={labelStyle}>
              {text.email}
            </label>

            <div style={inputWrapper}>
              <FaUser color="#008037" />

              <input
                type="email"
                value={email}
                disabled
                style={{
                  ...inputStyle,
                  color: "#666",
                  background: "transparent",
                }}
              />
            </div>

            <label style={labelStyle}>
              {text.phone}
            </label>

            <div style={inputWrapper}>
              <FaPhone color="#008037" />

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <label style={labelStyle}>
              {text.country}
            </label>

            <div style={inputWrapper}>
              <FaGlobe color="#008037" />

              <input
                type="text"
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <button
              onClick={updateProfile}
              disabled={saving}
              style={{
                ...buttonStyle,
                opacity: saving ? 0.65 : 1,
              }}
            >
              <FaSave
                style={{
                  marginRight: "10px",
                }}
              />

              {saving
                ? text.saving
                : text.saveProfile}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f6f8",
  padding: "40px",
};

const cardStyle = {
  maxWidth: "850px",
  margin: "0 auto",
  background: "white",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow:
    "0 10px 25px rgba(0,0,0,0.08)",
};

const headerStyle = {
  background: "#008037",
  color: "white",
  padding: "40px",
  textAlign: "center" as const,
};

const titleStyle = {
  fontSize: "38px",
  fontWeight: "bold" as const,
  marginBottom: "10px",
};

const bodyStyle = {
  padding: "40px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "18px",
  fontWeight: "bold" as const,
};

const inputWrapper = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "12px",
};

const inputStyle = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  background: "#008037",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  fontSize: "18px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  marginTop: "25px",
};