"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "@/app/lib/supabase";

import {
  getCountryName,
  getSortedAfricanCountries,
  getCountryMobileOperators,
} from "../lib/africa";

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

export default function RechargePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [countryCode, setCountryCode] = useState("CF");
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("Orange");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Countries
   */
  const countries = useMemo(() => {
    return getSortedAfricanCountries(
      isFr ? "fr" : "en"
    );
  }, [isFr]);

  const selectedCountry = useMemo(() => {
    return countries.find(
      (country) => country.code === countryCode
    );
  }, [countries, countryCode]);

  /**
   * Mobile operators
   */
  const mobileOperators = useMemo(() => {
    return getCountryMobileOperators(countryCode);
  }, [countryCode]);

  /**
   * Handle country change.
   *
   * Changing the country automatically updates:
   * - phone prefix
   * - currency
   * - mobile operators
   */
  const handleCountryChange = (
    newCountryCode: string
  ) => {
    setCountryCode(newCountryCode);

    const operators =
      getCountryMobileOperators(newCountryCode);

    setOperator(operators[0] ?? "");
    setPhone("");
    setAmount("");
    setMessage("");
    setErrorMessage("");
  };

  /**
   * Build the complete international phone number.
   */
  const getFullPhoneNumber = () => {
    if (!selectedCountry) {
      return phone.trim();
    }

    const trimmedPhone = phone.trim();

    if (
      trimmedPhone.startsWith(
        selectedCountry.phoneCode
      )
    ) {
      return trimmedPhone;
    }

    const localNumber = trimmedPhone.replace(
      /^0+/,
      ""
    );

    return `${selectedCountry.phoneCode}${localNumber}`;
  };

  /**
   * Submit recharge request.
   */
  const submitRecharge = async () => {
    setMessage("");
    setErrorMessage("");

    if (!selectedCountry) {
      setErrorMessage(
        isFr
          ? "Veuillez sélectionner un pays."
          : "Please select a country."
      );
      return;
    }

    if (!phone.trim()) {
      setErrorMessage(
        isFr
          ? "Veuillez entrer le numéro de téléphone du bénéficiaire."
          : "Please enter the beneficiary phone number."
      );
      return;
    }

    if (!operator) {
      setErrorMessage(
        isFr
          ? "Aucun opérateur mobile n'est disponible pour ce pays."
          : "No mobile operator is available for this country."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !amount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez entrer un montant de recharge valide."
          : "Please enter a valid recharge amount."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          isFr
            ? "Veuillez vous connecter avant d'effectuer une recharge."
            : "Please log in before submitting a recharge."
        );
        return;
      }

      const fullPhoneNumber =
        getFullPhoneNumber();

      const countryName = getCountryName(
        selectedCountry,
        isFr ? "fr" : "en"
      );

      const { error } = await supabase
        .from("mobile_recharges")
        .insert([
          {
            user_id: user.id,
            phone_number: fullPhoneNumber,
            operator,
            amount: numericAmount,
            status: "Pending",

            // Mobile Recharge V2
            country_code: selectedCountry.code,
            country: countryName,
            currency: selectedCountry.currency,
          },
        ]);

      if (error) {
        throw error;
      }

      setMessage(
        isFr
          ? "Demande de recharge enregistrée avec succès."
          : "Recharge request submitted successfully."
      );

      setPhone("");
      setAmount("");

      setTimeout(() => {
        router.push("/my-recharges");
      }, 800);
    } catch (error) {
      console.error(
        "Mobile recharge submission failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : isFr
            ? "Impossible d'enregistrer la recharge."
            : "Unable to submit the recharge request."
      );
    } finally {
      setLoading(false);
    }
  };

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
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          {/* Header */}

          <div
            style={{
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#008037",
                marginBottom: "8px",
              }}
            >
              {isFr
                ? "NDAKOCARE • RECHARGE MOBILE"
                : "NDAKOCARE • MOBILE RECHARGE"}
            </div>

            <h1
              style={{
                color: "#008037",
                fontSize: "42px",
                margin: "0 0 10px",
              }}
            >
              {isFr
                ? "Recharge Mobile"
                : "Mobile Recharge"}
            </h1>

            <p
              style={{
                color: "#666",
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.6,
              }}
            >
              {isFr
                ? "Envoyez du crédit téléphonique à votre famille et à vos proches."
                : "Send airtime to family and friends using a simple, country-aware recharge request."}
            </p>
          </div>

          {/* Main Card */}

          <div
            style={{
              background: "#ffffff",
              padding: "36px",
              borderRadius: "24px",
              boxShadow:
                "0 10px 25px rgba(0,0,0,0.08)",
            }}
          >
            {/* Country */}

            <label style={labelStyle}>
              {isFr
                ? "Pays du bénéficiaire"
                : "Beneficiary Country"}
            </label>

            <select
              value={countryCode}
              onChange={(event) =>
                handleCountryChange(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              {countries.map((country) => (
                <option
                  key={country.code}
                  value={country.code}
                >
                  {country.flag}{" "}
                  {getCountryName(
                    country,
                    isFr ? "fr" : "en"
                  )}{" "}
                  ({country.phoneCode})
                </option>
              ))}
            </select>

            {/* Country summary */}

            {selectedCountry && (
              <div
                style={{
                  background: "#f7faf8",
                  border: "1px solid #dce8df",
                  borderRadius: "16px",
                  padding: "18px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={summaryLabelStyle}>
                      {isFr
                        ? "Indicatif"
                        : "Phone Prefix"}
                    </div>

                    <div style={summaryValueStyle}>
                      {selectedCountry.phoneCode}
                    </div>
                  </div>

                  <div>
                    <div style={summaryLabelStyle}>
                      {isFr
                        ? "Devise"
                        : "Currency"}
                    </div>

                    <div style={summaryValueStyle}>
                      {selectedCountry.currency}
                    </div>
                  </div>

                  <div>
                    <div style={summaryLabelStyle}>
                      {isFr
                        ? "Région"
                        : "Region"}
                    </div>

                    <div style={summaryValueStyle}>
                      {selectedCountry.region}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phone */}

            <label style={labelStyle}>
              {isFr
                ? "Numéro du bénéficiaire"
                : "Beneficiary Phone Number"}
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  minWidth: "90px",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#f7f7f7",
                  fontSize: "16px",
                  fontWeight: 700,
                  boxSizing: "border-box",
                }}
              >
                {selectedCountry?.phoneCode ??
                  ""}
              </div>

              <input
                type="tel"
                placeholder={
                  isFr
                    ? "Exemple : 70000000"
                    : "Example: 70000000"
                }
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  flex: 1,
                }}
              />
            </div>

            {/* Operator */}

            <label style={labelStyle}>
              {isFr
                ? "Opérateur mobile"
                : "Mobile Operator"}
            </label>

            {mobileOperators.length > 0 ? (
              <select
                value={operator}
                onChange={(event) =>
                  setOperator(event.target.value)
                }
                style={inputStyle}
              >
                {mobileOperators.map(
                  (mobileOperator) => (
                    <option
                      key={mobileOperator}
                      value={mobileOperator}
                    >
                      {mobileOperator}
                    </option>
                  )
                )}
              </select>
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff8e1",
                  border: "1px solid #ffe082",
                  marginBottom: "20px",
                  color: "#725400",
                  lineHeight: 1.5,
                }}
              >
                {isFr
                  ? "Les opérateurs de recharge ne sont pas encore configurés pour ce pays."
                  : "Recharge operators have not yet been configured for this country."}
              </div>
            )}

            {/* Preset amounts */}

            <label style={labelStyle}>
              {isFr
                ? "Montant de recharge"
                : "Recharge Amount"}
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              {PRESET_AMOUNTS.map(
                (presetAmount) => {
                  const selected =
                    Number(amount) ===
                    presetAmount;

                  return (
                    <button
                      key={presetAmount}
                      type="button"
                      onClick={() =>
                        setAmount(
                          String(presetAmount)
                        )
                      }
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        border: selected
                          ? "2px solid #008037"
                          : "1px solid #d1d5db",
                        background: selected
                          ? "#edf8f1"
                          : "#ffffff",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {presetAmount.toLocaleString()}{" "}
                      {selectedCountry?.currency ??
                        ""}
                    </button>
                  );
                }
              )}
            </div>

            {/* Custom amount */}

            <input
              type="number"
              min="1"
              placeholder={
                isFr
                  ? "Ou entrez un autre montant"
                  : "Or enter a custom amount"
              }
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              style={inputStyle}
            />

            {/* Recharge summary */}

            {selectedCountry &&
              amount &&
              Number(amount) > 0 && (
                <div
                  style={{
                    background: "#f7faf8",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "6px",
                    }}
                  >
                    {isFr
                      ? "Total de la recharge"
                      : "Recharge Total"}
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 800,
                      color: "#008037",
                    }}
                  >
                    {Number(
                      amount
                    ).toLocaleString()}{" "}
                    {selectedCountry.currency}
                  </div>

                  {operator && (
                    <div
                      style={{
                        color: "#666",
                        marginTop: "8px",
                      }}
                    >
                      {operator} •{" "}
                      {selectedCountry.flag}{" "}
                      {getCountryName(
                        selectedCountry,
                        isFr ? "fr" : "en"
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Error */}

            {errorMessage && (
              <div
                style={{
                  background: "#fff1f1",
                  color: "#b42318",
                  border: "1px solid #f5c2c0",
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "18px",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Success */}

            {message && (
              <div
                style={{
                  background: "#edf8f1",
                  color: "#006b2d",
                  border: "1px solid #b9dfc5",
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "18px",
                }}
              >
                {message}
              </div>
            )}

            {/* Submit */}

            <button
              type="button"
              onClick={submitRecharge}
              disabled={
                loading ||
                mobileOperators.length === 0
              }
              style={{
                ...buttonStyle,
                opacity:
                  loading ||
                  mobileOperators.length === 0
                    ? 0.6
                    : 1,
                cursor:
                  loading ||
                  mobileOperators.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? isFr
                  ? "Envoi en cours..."
                  : "Submitting..."
                : isFr
                  ? "Envoyer la recharge"
                  : "Submit Recharge"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/my-recharges")
              }
              style={secondaryButtonStyle}
            >
              {isFr
                ? "Voir mes recharges"
                : "View My Recharges"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  color: "#333",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box" as const,
  background: "#ffffff",
};

const summaryLabelStyle = {
  color: "#777",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  marginBottom: "4px",
};

const summaryValueStyle = {
  color: "#222",
  fontSize: "16px",
  fontWeight: 700,
};

const buttonStyle = {
  width: "100%",
  background: "#008037",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "bold" as const,
};

const secondaryButtonStyle = {
  width: "100%",
  background: "#ffffff",
  color: "#008037",
  border: "1px solid #008037",
  padding: "14px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  marginTop: "12px",
};