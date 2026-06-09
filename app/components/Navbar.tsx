"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  useLanguage,
} from "../context/LanguageContext";

export default function Navbar() {
  const router = useRouter();

  const {
    language,
    setLanguage,
  } = useLanguage();

  return (
    <nav
      style={{
        background: "#008037",

        padding: "15px 20px",

        display: "flex",

        justifyContent:
          "space-between",

        alignItems: "center",

        flexWrap: "wrap",

        gap: "15px",
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
          ← Back
        </button>

        <h1
          style={{
            color: "white",

            margin: 0,

            fontSize: "28px",
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

          gap: "15px",

          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard"
          style={linkStyle}
        >
          Dashboard
        </Link>

        <Link
          href="/grocery"
          style={linkStyle}
        >
          Grocery
        </Link>

        <Link
          href="/my-orders"
          style={linkStyle}
        >
          My Orders
        </Link>

        <Link
          href="/profile"
          style={linkStyle}
        >
          Profile
        </Link>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(
              e.target.value
            )
          }
          style={selectStyle}
        >
          <option value="en">
            English
          </option>

          <option value="fr">
            Français
          </option>
        </select>

        <button style={logoutButton}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "white",

  textDecoration: "none",

  fontWeight: "bold",

  fontSize: "16px",
};

const backButton = {
  background: "white",

  color: "#008037",

  border: "none",

  padding: "10px 14px",

  borderRadius: "10px",

  cursor: "pointer",

  fontWeight: "bold",

  fontSize: "15px",
};

const selectStyle = {
  padding: "10px",

  borderRadius: "10px",

  border: "1px solid white",

  fontSize: "16px",
};

const logoutButton = {
  background: "white",

  color: "#008037",

  border: "none",

  padding: "12px 18px",

  borderRadius: "10px",

  cursor: "pointer",

  fontWeight: "bold",

  fontSize: "18px",
};