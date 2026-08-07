"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

export default function RegisterPage() {
  const router = useRouter();

  const { language } = useLanguage();

  const text =
    translations[
      language as keyof typeof translations
    ];

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            full_name: "",
            phone: "",
            country: "",
            language,
            role: "customer",
          },
        ]);
    }

    alert(
      language === "fr"
        ? "Compte créé avec succès !"
        : "Account created successfully!"
    );

    setLoading(false);

    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleRegister}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "450px",
          boxShadow:
            "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            color: "#008037",
            marginBottom: "25px",
            textAlign: "center",
          }}
        >
          {language === "fr"
            ? "Créer un compte"
            : "Create Account"}
        </h1>

        <input
          type="email"
          placeholder={
            language === "fr"
              ? "Adresse Email"
              : "Email"
          }
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder={
            language === "fr"
              ? "Mot de passe"
              : "Password"
          }
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading
            ? language === "fr"
              ? "Création..."
              : "Creating..."
            : language === "fr"
            ? "Créer un compte"
            : "Create Account"}
        </button>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          {language === "fr"
            ? "Vous avez déjà un compte ?"
            : "Already have an account?"}

          <a
            href="/login"
            style={{
              color: "#008037",
              marginLeft: "5px",
              fontWeight: "bold",
            }}
          >
            {language === "fr"
              ? "Connexion"
              : "Login"}
          </a>
        </p>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  background: "#008037",
  color: "white",
  border: "none",
  padding: "15px",
  borderRadius: "10px",
  fontSize: "18px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};