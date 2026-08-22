"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "@/app/lib/supabase";

import {
  getCountryName,
  getSortedAfricanCountries,
  getCountryMobileOperators,
} from "../lib/africa";

import {
  createServiceQuote,
  formatCurrency,
} from "../lib/currency";

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

type Beneficiary = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  country: string;
  relationship: string;
  provider: string;
  created_at?: string;
};

type RecipientMode = "saved" | "new";

export default function RechargePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isFr = language === "fr";

  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("saved");

  const [beneficiaries, setBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] =
    useState("");

  const [beneficiaryName, setBeneficiaryName] =
    useState("");

  const [countryCode, setCountryCode] = useState("CF");
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("Orange");
  const [amount, setAmount] = useState("");

  const [loadingBeneficiaries, setLoadingBeneficiaries] =
    useState(true);

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
   * Payment preview.
   *
   * The beneficiary receives the local currency amount.
   * The sender wallet will eventually be charged in USD.
   *
   * For this milestone the quote is PREVIEW ONLY.
   */
  const serviceQuote = useMemo(() => {
    if (!selectedCountry || !amount) {
      return null;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return null;
    }

    try {
      return createServiceQuote(
        numericAmount,
        selectedCountry.currency
      );
    } catch {
      return null;
    }
  }, [amount, selectedCountry]);

  /**
   * Load saved beneficiaries for the current user.
   */
  const fetchBeneficiaries = useCallback(async () => {
    setLoadingBeneficiaries(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setBeneficiaries([]);
        return;
      }

      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setBeneficiaries(
        (data ?? []) as Beneficiary[]
      );
    } catch (error) {
      console.error(
        "Unable to load beneficiaries:",
        error
      );

      setBeneficiaries([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, []);

  useEffect(() => {
    void fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  /**
   * Normalize a stored beneficiary phone number.
   *
   * Recharge already displays the selected country's
   * phone prefix separately, so remove it from the
   * editable local-number field when present.
   */
  const normalizeLocalPhone = (
    storedPhone: string,
    newCountryCode: string
  ) => {
    const country = countries.find(
      (item) => item.code === newCountryCode
    );

    let normalized = storedPhone
      .trim()
      .replace(/\s+/g, "");

    if (!country) {
      return normalized;
    }

    if (
      normalized.startsWith(country.phoneCode)
    ) {
      normalized = normalized.slice(
        country.phoneCode.length
      );
    }

    return normalized.replace(/^0+/, "");
  };

  /**
   * Select an existing saved beneficiary.
   */
  const handleBeneficiarySelection = (
    beneficiaryId: string
  ) => {
    setSelectedBeneficiaryId(beneficiaryId);
    setMessage("");
    setErrorMessage("");
    setAmount("");

    const beneficiary = beneficiaries.find(
      (item) => item.id === beneficiaryId
    );

    if (!beneficiary) {
      setBeneficiaryName("");
      setPhone("");
      return;
    }

    setBeneficiaryName(beneficiary.name);

    const beneficiaryCountry =
      countries.find(
        (country) =>
          country.code === beneficiary.country
      );

    if (beneficiaryCountry) {
      setCountryCode(beneficiaryCountry.code);

      setPhone(
        normalizeLocalPhone(
          beneficiary.phone,
          beneficiaryCountry.code
        )
      );

      const operators =
        getCountryMobileOperators(
          beneficiaryCountry.code
        );

      if (
        beneficiary.provider &&
        operators.includes(
          beneficiary.provider
        )
      ) {
        setOperator(beneficiary.provider);
      } else {
        setOperator(operators[0] ?? "");
      }
    } else {
      setPhone(beneficiary.phone);
      setOperator(beneficiary.provider || "");
    }
  };

  /**
   * Switch between saved beneficiary and new recipient.
   */
  const handleRecipientModeChange = (
    mode: RecipientMode
  ) => {
    setRecipientMode(mode);

    setSelectedBeneficiaryId("");
    setBeneficiaryName("");
    setPhone("");
    setAmount("");
    setMessage("");
    setErrorMessage("");

    if (mode === "new") {
      setCountryCode("CF");

      const operators =
        getCountryMobileOperators("CF");

      setOperator(operators[0] ?? "");
    }
  };

  /**
   * Handle country change for a new recipient.
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
   * Build complete international phone number.
   */
  const getFullPhoneNumber = () => {
    if (!selectedCountry) {
      return phone.trim();
    }

    const trimmedPhone = phone
      .trim()
      .replace(/\s+/g, "");

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
   *
   * IMPORTANT:
   * Wallet debit is intentionally NOT implemented yet.
   * The payment quote is preview-only until we validate
   * Recharge V3 end-to-end.
   */
  const submitRecharge = async () => {
    setMessage("");
    setErrorMessage("");

    if (
      recipientMode === "saved" &&
      !selectedBeneficiaryId
    ) {
      setErrorMessage(
        isFr
          ? "Veuillez sélectionner un bénéficiaire."
          : "Please select a beneficiary."
      );
      return;
    }

    if (!beneficiaryName.trim()) {
      setErrorMessage(
        isFr
          ? "Veuillez entrer le nom du bénéficiaire."
          : "Please enter the beneficiary name."
      );
      return;
    }

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

      /**
       * Keep the existing mobile_recharges schema
       * compatible for this milestone.
       *
       * Beneficiary identity is used in the UI now,
       * but we will not add beneficiary_name or
       * beneficiary_id to the database until we
       * deliberately migrate the schema.
       */
      const { error } = await supabase
        .from("mobile_recharges")
        .insert([
          {
            user_id: user.id,
            phone_number: fullPhoneNumber,
            operator,
            amount: numericAmount,
            status: "Pending",
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
            {/* Recipient mode */}

            <label style={labelStyle}>
              {isFr ? "Destinataire" : "Recipient"}
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleRecipientModeChange("saved")
                }
                style={{
                  ...modeButtonStyle,
                  border:
                    recipientMode === "saved"
                      ? "2px solid #008037"
                      : "1px solid #d1d5db",
                  background:
                    recipientMode === "saved"
                      ? "#edf8f1"
                      : "#ffffff",
                  color:
                    recipientMode === "saved"
                      ? "#008037"
                      : "#444",
                }}
              >
                {isFr
                  ? "Bénéficiaire enregistré"
                  : "Saved Beneficiary"}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRecipientModeChange("new")
                }
                style={{
                  ...modeButtonStyle,
                  border:
                    recipientMode === "new"
                      ? "2px solid #008037"
                      : "1px solid #d1d5db",
                  background:
                    recipientMode === "new"
                      ? "#edf8f1"
                      : "#ffffff",
                  color:
                    recipientMode === "new"
                      ? "#008037"
                      : "#444",
                }}
              >
                {isFr
                  ? "Nouveau destinataire"
                  : "New Recipient"}
              </button>
            </div>

            {/* Saved beneficiary */}

            {recipientMode === "saved" && (
              <>
                <label style={labelStyle}>
                  {isFr
                    ? "Choisir un bénéficiaire"
                    : "Select Beneficiary"}
                </label>

                <select
                  value={selectedBeneficiaryId}
                  onChange={(event) =>
                    handleBeneficiarySelection(
                      event.target.value
                    )
                  }
                  disabled={loadingBeneficiaries}
                  style={inputStyle}
                >
                  <option value="">
                    {loadingBeneficiaries
                      ? isFr
                        ? "Chargement..."
                        : "Loading..."
                      : isFr
                        ? "Choisir un bénéficiaire"
                        : "Select a beneficiary"}
                  </option>

                  {beneficiaries.map(
                    (beneficiary) => {
                      const beneficiaryCountry =
                        countries.find(
                          (country) =>
                            country.code ===
                            beneficiary.country
                        );

                      return (
                        <option
                          key={beneficiary.id}
                          value={beneficiary.id}
                        >
                          {beneficiary.name}
                          {" — "}
                          {beneficiaryCountry?.flag
                            ? `${beneficiaryCountry.flag} `
                            : ""}
                          {beneficiaryCountry
                            ? getCountryName(
                                beneficiaryCountry,
                                isFr ? "fr" : "en"
                              )
                            : beneficiary.country}
                        </option>
                      );
                    }
                  )}
                </select>

                {!loadingBeneficiaries &&
                  beneficiaries.length === 0 && (
                    <div
                      style={{
                        background: "#fff8e1",
                        border:
                          "1px solid #ffe082",
                        color: "#725400",
                        padding: "14px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        lineHeight: 1.5,
                      }}
                    >
                      {isFr
                        ? "Vous n'avez pas encore de bénéficiaire enregistré. Utilisez Nouveau destinataire ou ajoutez un bénéficiaire."
                        : "You do not have a saved beneficiary yet. Use New Recipient or add a beneficiary."}
                    </div>
                  )}
              </>
            )}

            {/* Beneficiary name */}

            <label style={labelStyle}>
              {isFr
                ? "Nom du bénéficiaire"
                : "Beneficiary Name"}
            </label>

            <input
              type="text"
              placeholder={
                isFr
                  ? "Exemple : Jean Dupont"
                  : "Example: John Doe"
              }
              value={beneficiaryName}
              onChange={(event) =>
                setBeneficiaryName(
                  event.target.value
                )
              }
              readOnly={recipientMode === "saved"}
              style={{
                ...inputStyle,
                background:
                  recipientMode === "saved"
                    ? "#f7f7f7"
                    : "#ffffff",
              }}
            />

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
              disabled={recipientMode === "saved"}
              style={{
                ...inputStyle,
                background:
                  recipientMode === "saved"
                    ? "#f7f7f7"
                    : "#ffffff",
              }}
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
                {selectedCountry?.phoneCode ?? ""}
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
                readOnly={recipientMode === "saved"}
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  flex: 1,
                  background:
                    recipientMode === "saved"
                      ? "#f7f7f7"
                      : "#ffffff",
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
                      {selectedCountry?.currency ?? ""}
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

            {/* Payment Summary */}

            {selectedCountry &&
              serviceQuote && (
                <div
                  style={{
                    background: "#f7faf8",
                    border:
                      "1px solid #dce8df",
                    borderRadius: "18px",
                    padding: "22px",
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#008037",
                      marginBottom: "16px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isFr
                      ? "RÉSUMÉ DU PAIEMENT"
                      : "PAYMENT SUMMARY"}
                  </div>

                  <PaymentRow
                    label={
                      isFr
                        ? "Bénéficiaire"
                        : "Beneficiary"
                    }
                    value={
                      beneficiaryName.trim() ||
                      (isFr
                        ? "Non renseigné"
                        : "Not provided")
                    }
                  />

                  <PaymentRow
                    label={
                      isFr ? "Pays" : "Country"
                    }
                    value={`${selectedCountry.flag} ${getCountryName(
                      selectedCountry,
                      isFr ? "fr" : "en"
                    )}`}
                  />

                  <PaymentRow
                    label={
                      isFr
                        ? "Téléphone"
                        : "Phone"
                    }
                    value={
                      phone.trim()
                        ? getFullPhoneNumber()
                        : "—"
                    }
                  />

                  <PaymentRow
                    label={
                      isFr
                        ? "Opérateur"
                        : "Operator"
                    }
                    value={operator || "—"}
                  />

                  <div style={dividerStyle} />

                  <PaymentRow
                    label={
                      isFr
                        ? "Le bénéficiaire reçoit"
                        : "Recipient receives"
                    }
                    value={`${Number(
                      amount
                    ).toLocaleString()} ${
                      selectedCountry.currency
                    }`}
                    strong
                  />

                  <PaymentRow
                    label={
                      isFr
                        ? "Taux de référence"
                        : "Reference rate"
                    }
                    value={`1 USD = ${serviceQuote.exchangeRate.toLocaleString()} ${selectedCountry.currency}`}
                  />

                  <PaymentRow
                    label={
                      isFr
                        ? "Équivalent USD"
                        : "USD equivalent"
                    }
                    value={formatCurrency(
                      serviceQuote.usdEquivalent,
                      "USD",
                      isFr ? "fr" : "en"
                    )}
                  />

                  <PaymentRow
                    label={
                      isFr
                        ? "Frais NdakoCare (3 %)"
                        : "NdakoCare fee (3%)"
                    }
                    value={formatCurrency(
                      serviceQuote.serviceFee,
                      "USD",
                      isFr ? "fr" : "en"
                    )}
                  />

                  <div style={dividerStyle} />

                  <PaymentRow
                    label={
                      isFr
                        ? "Débit futur du portefeuille"
                        : "Future wallet charge"
                    }
                    value={formatCurrency(
                      serviceQuote.totalWalletCharge,
                      "USD",
                      isFr ? "fr" : "en"
                    )}
                    strong
                  />

                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#fff8e1",
                      color: "#725400",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {isFr
                      ? "Aperçu uniquement : aucun débit du portefeuille n'est effectué dans cette version."
                      : "Preview only: your wallet is not being charged in this version."}
                  </div>
                </div>
              )}

            {/* Error */}

            {errorMessage && (
              <div
                style={{
                  background: "#fff1f1",
                  color: "#b42318",
                  border:
                    "1px solid #f5c2c0",
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
                  border:
                    "1px solid #b9dfc5",
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

function PaymentRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        alignItems: "flex-start",
        marginBottom: "10px",
      }}
    >
      <span
        style={{
          color: "#666",
          fontSize: "14px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: strong ? "#008037" : "#222",
          fontSize: strong ? "16px" : "14px",
          fontWeight: strong ? 800 : 700,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
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

const modeButtonStyle = {
  padding: "14px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const dividerStyle = {
  height: "1px",
  background: "#dce8df",
  margin: "16px 0",
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