"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "@/app/lib/translations";

export default function Navbar() {
  const router = useRouter();

  const { language, setLanguage } = useLanguage();

  const text =
    translations[
      language as keyof typeof translations
    ];

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      style={{
        background: "#008037",
        padding: "16px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        boxShadow:
          "0 4px 15px rgba(0,0,0,0.08)",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={backButton}
        >
          ← {text.back}
        </button>

        <h1
          style={{
            color: "white",
            margin: 0,
            fontSize: "32px",
            fontWeight: "bold",
          }}
        >
          NdakoCare
        </h1>
      </div>

      {/* RIGHT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/dashboard" style={linkStyle}>
          {text.dashboard}
        </Link>

        <Link href="/grocery" style={linkStyle}>
          {text.grocery}
        </Link>

        <Link href="/recharge" style={linkStyle}>
          {text.recharge}
        </Link>

        <Link href="/my-orders" style={linkStyle}>
          {text.orders}
        </Link>

        <Link href="/my-recharges" style={linkStyle}>
          {text.recharges}
        </Link>

        <Link href="/profile" style={linkStyle}>
          {text.profile}
        </Link>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
          style={selectStyle}
        >
          <option value="en">
            🇺🇸 EN
          </option>

          <option value="fr">
            🇫🇷 FR
          </option>
        </select>

        <button
          onClick={logout}
          style={logoutButton}
        >
          {text.logout}
        </button>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "16px",
};

const backButton = {
  background: "white",
  color: "#008037",
  border: "none",
  padding: "10px 15px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "15px",
};

const selectStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid white",
  fontSize: "15px",
  cursor: "pointer",
  background: "white",
};

const logoutButton = {
  background: "white",
  color: "#008037",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "16px",
};