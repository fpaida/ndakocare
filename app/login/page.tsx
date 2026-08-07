"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();

  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert(
      language === "fr"
        ? "Connexion réussie !"
        : "Login successful!"
    );

    router.push("/dashboard");
    router.refresh();

    setLoading(false);
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
        onSubmit={handleLogin}
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
            ? "Connexion"
            : "Login"}
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
            setPassword(e.target.value)
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
              ? "Connexion..."
              : "Logging in..."
            : language === "fr"
            ? "Se connecter"
            : "Login"}
        </button>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          {language === "fr"
            ? "Pas encore de compte ?"
            : "No account yet?"}

          <a
            href="/register"
            style={{
              color: "#008037",
              marginLeft: "5px",
              fontWeight: "bold",
            }}
          >
            {language === "fr"
              ? "Créer un compte"
              : "Create Account"}
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