"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "@/app/lib/supabase";

import {
  getCountryByCode,
  getCountryName,
} from "../lib/africa";

type Recharge = {
  id: number;
  phone_number: string;
  operator: string;
  amount: number;
  status: string;
  created_at: string;

  // Mobile Recharge V2
  country_code: string | null;
  country: string | null;
  currency: string | null;
};

export default function MyRechargesPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Load the current user's recharge history.
   */
  const fetchRecharges = useCallback(
    async (isRefresh = false) => {
      setErrorMessage("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setRecharges([]);

          setErrorMessage(
            isFr
              ? "Veuillez vous connecter pour consulter vos recharges."
              : "Please log in to view your recharges."
          );

          return;
        }

        const { data, error } = await supabase
          .from("mobile_recharges")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        setRecharges((data ?? []) as Recharge[]);
      } catch (error) {
        console.error(
          "Unable to load mobile recharges:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : isFr
              ? "Impossible de charger vos recharges."
              : "Unable to load your recharges."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isFr]
  );

  useEffect(() => {
    void fetchRecharges();
  }, [fetchRecharges]);

  /**
   * Return a color based on transaction status.
   */
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#008037";

      case "processing":
        return "#2196f3";

      case "cancelled":
      case "failed":
        return "#d92d20";

      default:
        return "#f59e0b";
    }
  };

  /**
   * Localize known recharge statuses.
   */
  const getStatusLabel = (status: string) => {
    if (!isFr) {
      return status;
    }

    switch (status.toLowerCase()) {
      case "pending":
        return "En attente";

      case "processing":
        return "En cours";

      case "completed":
        return "Terminée";

      case "cancelled":
        return "Annulée";

      case "failed":
        return "Échouée";

      default:
        return status;
    }
  };

  /**
   * Resolve country information using africa.ts.
   *
   * New V2 records use country_code. Older records can
   * still display using their stored country value.
   */
  const getRechargeCountry = (recharge: Recharge) => {
    if (!recharge.country_code) {
      return undefined;
    }

    return getCountryByCode(recharge.country_code);
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <div
          style={{
            minHeight: "100vh",
            background: "#f4f6f8",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                color: "#008037",
              }}
            >
              {isFr
                ? "Chargement des recharges..."
                : "Loading recharges..."}
            </h1>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {/* Header */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#008037",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {isFr
                  ? "NDAKOCARE • HISTORIQUE MOBILE"
                  : "NDAKOCARE • MOBILE HISTORY"}
              </div>

              <h1
                style={{
                  fontSize: "42px",
                  color: "#008037",
                  margin: "0 0 10px",
                }}
              >
                {isFr
                  ? "Mes Recharges"
                  : "My Recharges"}
              </h1>

              <p
                style={{
                  color: "#666",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {isFr
                  ? "Suivez vos demandes de recharge mobile en Afrique."
                  : "Track your mobile recharge requests across Africa."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => void fetchRecharges(true)}
                disabled={refreshing}
                style={{
                  ...secondaryButtonStyle,
                  opacity: refreshing ? 0.6 : 1,
                }}
              >
                {refreshing
                  ? isFr
                    ? "Actualisation..."
                    : "Refreshing..."
                  : isFr
                    ? "Actualiser"
                    : "Refresh"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/recharge")}
                style={primaryButtonStyle}
              >
                {isFr
                  ? "Nouvelle recharge"
                  : "New Recharge"}
              </button>
            </div>
          </div>

          {/* Summary */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <SummaryCard
              label={
                isFr
                  ? "Total des recharges"
                  : "Total Recharges"
              }
              value={String(recharges.length)}
            />

            <SummaryCard
              label={isFr ? "En attente" : "Pending"}
              value={String(
                recharges.filter(
                  (recharge) =>
                    recharge.status.toLowerCase() ===
                    "pending"
                ).length
              )}
            />

            <SummaryCard
              label={isFr ? "Terminées" : "Completed"}
              value={String(
                recharges.filter(
                  (recharge) =>
                    recharge.status.toLowerCase() ===
                    "completed"
                ).length
              )}
            />
          </div>

          {/* Error */}

          {errorMessage && (
            <div
              style={{
                background: "#fff1f1",
                border: "1px solid #f5c2c0",
                color: "#b42318",
                padding: "16px",
                borderRadius: "14px",
                marginBottom: "24px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Empty state */}

          {recharges.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                padding: "50px 30px",
                borderRadius: "20px",
                textAlign: "center",
                boxShadow:
                  "0 10px 25px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "15px",
                }}
              >
                📱
              </div>

              <h2
                style={{
                  color: "#222",
                  marginBottom: "10px",
                }}
              >
                {isFr
                  ? "Aucune recharge"
                  : "No Recharges Yet"}
              </h2>

              <p
                style={{
                  color: "#666",
                  marginBottom: "24px",
                }}
              >
                {isFr
                  ? "Vos demandes de recharge apparaîtront ici."
                  : "Your mobile recharge requests will appear here."}
              </p>

              <button
                type="button"
                onClick={() => router.push("/recharge")}
                style={primaryButtonStyle}
              >
                {isFr
                  ? "Effectuer une recharge"
                  : "Make a Recharge"}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              {recharges.map((recharge) => {
                const country =
                  getRechargeCountry(recharge);

                const countryLabel = country
                  ? getCountryName(
                      country,
                      isFr ? "fr" : "en"
                    )
                  : recharge.country ||
                    (isFr
                      ? "Pays non disponible"
                      : "Country unavailable");

                const currency =
                  recharge.currency ||
                  country?.currency ||
                  "";

                return (
                  <div
                    key={recharge.id}
                    style={{
                      background: "#ffffff",
                      padding: "28px",
                      borderRadius: "20px",
                      borderLeft: `6px solid ${getStatusColor(
                        recharge.status
                      )}`,
                      boxShadow:
                        "0 10px 25px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Card header */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        gap: "20px",
                        flexWrap: "wrap",
                        marginBottom: "22px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#777",
                            fontSize: "13px",
                            fontWeight: 700,
                            marginBottom: "6px",
                          }}
                        >
                          {isFr
                            ? `RECHARGE #${recharge.id}`
                            : `RECHARGE #${recharge.id}`}
                        </div>

                        <h2
                          style={{
                            color: "#222",
                            margin: 0,
                            fontSize: "24px",
                          }}
                        >
                          {country?.flag
                            ? `${country.flag} `
                            : ""}
                          {countryLabel}
                        </h2>
                      </div>

                      <span
                        style={{
                          background:
                            getStatusColor(
                              recharge.status
                            ),
                          color: "#ffffff",
                          padding: "8px 14px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {getStatusLabel(
                          recharge.status
                        )}
                      </span>
                    </div>

                    {/* Recharge details */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "18px",
                      }}
                    >
                      <Detail
                        label={
                          isFr
                            ? "Téléphone"
                            : "Phone"
                        }
                        value={
                          recharge.phone_number
                        }
                      />

                      <Detail
                        label={
                          isFr
                            ? "Opérateur"
                            : "Operator"
                        }
                        value={recharge.operator}
                      />

                      <Detail
                        label={
                          isFr
                            ? "Montant"
                            : "Amount"
                        }
                        value={`${Number(
                          recharge.amount
                        ).toLocaleString()}${
                          currency
                            ? ` ${currency}`
                            : ""
                        }`}
                      />

                      <Detail
                        label={
                          isFr ? "Date" : "Date"
                        }
                        value={new Date(
                          recharge.created_at
                        ).toLocaleString(
                          isFr
                            ? "fr-FR"
                            : "en-US"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "16px",
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: "13px",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#008037",
          fontSize: "28px",
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#777",
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#222",
          fontSize: "16px",
          fontWeight: 700,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const primaryButtonStyle = {
  background: "#008037",
  color: "#ffffff",
  border: "none",
  padding: "13px 18px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#ffffff",
  color: "#008037",
  border: "1px solid #008037",
  padding: "13px 18px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};