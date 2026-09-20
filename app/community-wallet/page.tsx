
"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "XAF",
  "XOF",
  "CDF",
  "NGN",
  "KES",
  "GHS",
  "ZAR",
] as const;

type SupportedCurrency =
  (typeof SUPPORTED_CURRENCIES)[number];

type Community = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  balance: number | string | null;
  preferred_currency: string;
  visibility: string;
  status: string;
  created_at: string;
};

function formatMoney(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function CommunityWalletPage() {
  const { language } = useLanguage();
  const isFrench = language === "fr";

  const [userId, setUserId] = useState<string | null>(
    null
  );

  const [communities, setCommunities] = useState<
    Community[]
  >([]);

  const [communityName, setCommunityName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [preferredCurrency, setPreferredCurrency] =
    useState<SupportedCurrency>("USD");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setUserId(null);
        setCommunities([]);
        return;
      }

      setUserId(user.id);

      // Migration 005 RLS returns communities
      // owned by this user or accessible through
      // active community membership.

      const {
        data,
        error: communitiesError,
      } = await supabase
        .from("community_wallets")
        .select(
          "id, owner_id, name, description, balance, preferred_currency, visibility, status, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (communitiesError) {
        throw communitiesError;
      }

      setCommunities(
        (data ?? []) as Community[]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFrench
            ? "Impossible de charger les communautés."
            : "Unable to load communities."
      );
    } finally {
      setLoading(false);
    }
  }, [isFrench]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const createCommunity = async () => {
    const name = communityName.trim();

    setError("");
    setMessage("");

    if (!name) {
      setError(
        isFrench
          ? "Le nom de la communauté est requis."
          : "Community name is required."
      );
      return;
    }

    if (!userId) {
      setError(
        isFrench
          ? "Connectez-vous pour créer une communauté."
          : "Sign in to create a community."
      );
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user || user.id !== userId) {
        throw new Error(
          isFrench
            ? "Votre session a expiré. Reconnectez-vous."
            : "Your session has expired. Please sign in again."
        );
      }

      const {
        error: insertError,
      } = await supabase
        .from("community_wallets")
        .insert({
          owner_id: user.id,
          name,
          description: description.trim() || null,
          balance: 0,
          preferred_currency: preferredCurrency,
          visibility: "private",
          status: "active",
        });

      if (insertError) {
        throw insertError;
      }

      setCommunityName("");
      setDescription("");
      setPreferredCurrency("USD");

      setMessage(
        isFrench
          ? "Communauté privée créée avec succès."
          : "Private community created successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFrench
            ? "Impossible de créer la communauté."
            : "Unable to create the community."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-8">

          {/* Header */}

          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-3 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
              {isFrench
                ? "Communautés privées"
                : "Private communities"}
            </div>

            <h1 className="text-3xl font-bold text-green-800 sm:text-4xl">
              🌍 Community Wallet
            </h1>

            <p className="mt-4 max-w-3xl text-gray-600">
              {isFrench
                ? "Créez une communauté, choisissez sa devise et préparez un espace de soutien collectif."
                : "Create a community, choose its currency, and prepare a shared space for collective support."}
            </p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">
                {isFrench
                  ? "Les contributions ne sont pas encore disponibles"
                  : "Contributions are not available yet"}
              </p>

              <p className="mt-2">
                {isFrench
                  ? "Le traitement des paiements, la conversion des devises et la confirmation des fonds seront activés après l'intégration d'un partenaire financier autorisé."
                  : "Payment processing, currency conversion, and confirmation of funds will be enabled after integration with an appropriately licensed financial partner."}
              </p>
            </div>
          </section>

          {/* Messages */}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800"
            >
              {message}
            </div>
          )}

          {/* Create community */}

          <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isFrench
                ? "Créer une communauté"
                : "Create a community"}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {isFrench
                ? "Les nouvelles communautés sont privées. Les invitations seront disponibles dans une prochaine étape."
                : "New communities are private. Invitations will be available in a later stage."}
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="community-name"
                  className="mb-2 block font-semibold text-gray-800"
                >
                  {isFrench
                    ? "Nom de la communauté"
                    : "Community name"}
                </label>

                <input
                  id="community-name"
                  type="text"
                  maxLength={120}
                  value={communityName}
                  onChange={(event) =>
                    setCommunityName(event.target.value)
                  }
                  placeholder={
                    isFrench
                      ? "Ex. : Soutien scolaire à Bangui"
                      : "e.g. Bangui Education Support"
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-gray-900 focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="community-description"
                  className="mb-2 block font-semibold text-gray-800"
                >
                  {isFrench
                    ? "Description"
                    : "Description"}
                </label>

                <textarea
                  id="community-description"
                  rows={4}
                  maxLength={1000}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder={
                    isFrench
                      ? "Décrivez le but de cette communauté."
                      : "Describe the purpose of this community."
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-gray-900 focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="preferred-currency"
                  className="mb-2 block font-semibold text-gray-800"
                >
                  {isFrench
                    ? "Devise préférée de la communauté"
                    : "Community preferred currency"}
                </label>

                <select
                  id="preferred-currency"
                  value={preferredCurrency}
                  onChange={(event) =>
                    setPreferredCurrency(
                      event.target.value as SupportedCurrency
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-green-600 focus:outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(
                    (currency) => (
                      <option
                        key={currency}
                        value={currency}
                      >
                        {currency}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-sm text-gray-500">
                  {isFrench
                    ? "La disponibilité des paiements et du change dépendra du partenaire financier."
                    : "Payment and FX availability will depend on the financial partner."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void createCommunity();
                }}
                disabled={
                  creating ||
                  loading ||
                  !userId
                }
                className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? isFrench
                    ? "Création..."
                    : "Creating..."
                  : isFrench
                    ? "Créer la communauté"
                    : "Create community"}
              </button>
            </div>
          </section>

          {/* Communities */}

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {isFrench
                  ? "Mes communautés"
                  : "My communities"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  void loadData();
                }}
                disabled={loading}
                className="rounded-xl border border-green-700 px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
              >
                {isFrench
                  ? "Actualiser"
                  : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-8 text-gray-600 shadow-lg">
                {isFrench
                  ? "Chargement des communautés..."
                  : "Loading communities..."}
              </div>
            ) : !userId ? (
              <div className="rounded-3xl bg-white p-8 text-gray-600 shadow-lg">
                {isFrench
                  ? "Connectez-vous pour consulter vos communautés."
                  : "Sign in to view your communities."}
              </div>
            ) : communities.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-gray-600 shadow-lg">
                {isFrench
                  ? "Aucune communauté pour le moment. Créez votre première communauté ci-dessus."
                  : "No communities yet. Create your first community above."}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {communities.map((community) => {
                  const isOwner =
                    community.owner_id === userId;

                  const balance = Number(
                    community.balance ?? 0
                  );

                  return (
                    <article
                      key={community.id}
                      className="rounded-3xl bg-white p-6 shadow-lg"
                    >
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          {isOwner
                            ? isFrench
                              ? "Propriétaire"
                              : "Owner"
                            : isFrench
                              ? "Membre"
                              : "Member"}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                          {community.preferred_currency}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {isFrench
                            ? "Privée"
                            : "Private"}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-green-800">
                        {community.name}
                      </h3>

                      {community.description && (
                        <p className="mt-3 whitespace-pre-wrap text-gray-600">
                          {community.description}
                        </p>
                      )}

                      <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                        <p className="text-sm font-semibold text-gray-600">
                          {isFrench
                            ? "Solde communautaire enregistré"
                            : "Recorded community balance"}
                        </p>

                        <p className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                          {formatMoney(
                            Number.isFinite(balance)
                              ? balance
                              : 0,
                            community.preferred_currency
                          )}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          {isFrench
                            ? "Ce montant ne constitue pas une confirmation de fonds détenus par NdakoCare."
                            : "This amount does not represent funds held by NdakoCare."}
                        </p>
                      </div>

                      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-4">
                        <p className="font-semibold text-gray-800">
                          {isFrench
                            ? "Contributions"
                            : "Contributions"}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          {isFrench
                            ? "Bientôt disponibles après l'intégration du partenaire financier et la vérification des paiements."
                            : "Coming after financial-partner integration and verified payment confirmation."}
                        </p>

                        <button
                          type="button"
                          disabled
                          className="mt-4 w-full cursor-not-allowed rounded-xl bg-gray-300 px-5 py-3 font-semibold text-gray-600"
                        >
                          {isFrench
                            ? "Contribuer — bientôt disponible"
                            : "Contribute — coming soon"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}