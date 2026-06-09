"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

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

    // CREATE PROFILE
    if (data.user) {
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,

            full_name: "",

            phone: "",

            country: "",

            language: "en",

            role: "customer",
          },
        ]);

      if (profileError) {
        console.log(
          profileError.message
        );
      }
    }

    alert(
      "Account created successfully!"
    );

    setLoading(false);

    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",

        background: "#f4f4f4",

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
            "0 5px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            color: "#008037",

            marginBottom: "25px",
          }}
        >
          Create Account
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
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
            ? "Creating..."
            : "Create Account"}
        </button>

        <p
          style={{
            marginTop: "20px",

            textAlign: "center",
          }}
        >
          Already have an account?

          <a
            href="/login"
            style={{
              color: "#008037",

              marginLeft: "5px",

              fontWeight: "bold",
            }}
          >
            Login
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

  fontWeight: "bold",

  cursor: "pointer",
};