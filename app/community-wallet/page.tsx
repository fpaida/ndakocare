"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

type InvitationMethod = "email" | "whatsapp" | "sms";

type InvitationResponse = {
  success?: boolean;
  invitationPath?: string;
  expiresAt?: string;
  error?: string;
};

type InvitationLink = {
  walletId: string;
  url: string;
  expiresAt: string;
  method: InvitationMethod;
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  communityName: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9][0-9]{1,14}$/;

function invitationMessage(link: InvitationLink, isFrench: boolean): string {
  const greeting = link.recipientName ? `${link.recipientName}, ` : "";
  return isFrench
    ? `${greeting}vous êtes invité(e) à rejoindre la communauté privée « ${link.communityName} » sur NdakoCare. Ouvrez ce lien pour vous connecter et accepter l'invitation (valable 7 jours, usage unique) : ${link.url}`
    : `${greeting}you are invited to join the private community "${link.communityName}" on NdakoCare. Open this link to sign in and accept the invitation (valid for 7 days, one-time use): ${link.url}`;
}

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

  const [userId, setUserId] =
    useState<string | null>(null);

  const [communities, setCommunities] =
    useState<Community[]>([]);

  const [communityName, setCommunityName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [
    preferredCurrency,
    setPreferredCurrency,
  ] = useState<SupportedCurrency>("USD");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [invitingWalletId, setInvitingWalletId] =
    useState<string | null>(null);

  const [invitationLink, setInvitationLink] =
    useState<InvitationLink | null>(null);

  const [invitationMethod, setInvitationMethod] =
    useState<InvitationMethod>("email");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [activeInviteForm, setActiveInviteForm] =
    useState<string | null>(null);

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
        setInvitationLink(null);
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
          description:
            description.trim() || null,
          balance: 0,
          preferred_currency:
            preferredCurrency,
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

  const generateInvitation = async (
    community: Community
  ) => {
    setError("");
    setMessage("");
    setInvitationLink(null);

    if (
      !userId ||
      community.owner_id !== userId
    ) {
      setError(
        isFrench
          ? "Seul le propriétaire peut inviter des membres."
          : "Only the owner can invite members."
      );
      return;
    }

    const normalizedEmail = recipientEmail.trim().toLowerCase();
    const normalizedPhone = recipientPhone.trim();
    const normalizedName = recipientName.trim();

    if (normalizedName.length > 120) {
      setError(isFrench ? "Nom du destinataire trop long." : "Recipient name is too long.");
      return;
    }

    if (invitationMethod === "email") {
      if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
        setError(isFrench ? "Saisissez une adresse e-mail valide." : "Enter a valid email address.");
        return;
      }
    } else if (!PHONE_PATTERN.test(normalizedPhone)) {
      setError(isFrench
        ? "Saisissez un numéro international, par exemple +23675000000."
        : "Enter an international phone number, such as +23675000000.");
      return;
    }

    setInvitingWalletId(community.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        throw new Error(
          isFrench
            ? "Votre session a expiré. Reconnectez-vous."
            : "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/community/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            walletId: community.id,
            invitationMethod,
            recipientName: normalizedName,
            ...(invitationMethod === "email"
              ? { recipientEmail: normalizedEmail }
              : { recipientPhone: normalizedPhone }),
          }),
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as
          InvitationResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.invitationPath ||
        !result.expiresAt
      ) {
        throw new Error(
          result.error ||
            (isFrench
              ? "Impossible de créer l'invitation."
              : "Unable to create the invitation.")
        );
      }

      const url = new URL(
        result.invitationPath,
        window.location.origin
      );

      // Accept only an invitation path within
      // the current NdakoCare application.

      if (
        url.origin !==
          window.location.origin ||
        url.pathname !==
          "/community-wallet/invite"
      ) {
        throw new Error(
          "Invalid invitation response."
        );
      }

      setInvitationLink({
        walletId: community.id,
        url: url.toString(),
        expiresAt: result.expiresAt,
        method: invitationMethod,
        recipientName: normalizedName,
        recipientEmail: invitationMethod === "email" ? normalizedEmail : null,
        recipientPhone: invitationMethod === "email" ? null : normalizedPhone,
        communityName: community.name,
      });

      setMessage(
        isFrench
          ? "Invitation créée. Aucun message n'a été envoyé automatiquement."
          : "Invitation created. No message has been sent automatically."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFrench
            ? "Impossible de créer l'invitation."
            : "Unable to create the invitation."
      );
    } finally {
      setInvitingWalletId(null);
    }
  };

  const copyInvitation = async () => {
    if (!invitationLink) {
      return;
    }

    setError("");

    try {
      await navigator.clipboard.writeText(
        invitationLink.url
      );

      setMessage(
        isFrench
          ? "Lien d'invitation copié."
          : "Invitation link copied."
      );
    } catch {
      setError(
        isFrench
          ? "Copie impossible. Sélectionnez le lien et copiez-le manuellement."
          : "Unable to copy automatically. Select the link and copy it manually."
      );
    }
  };

  const copyInvitationMessage = async () => {
    if (!invitationLink) return;
    setError("");
    try {
      await navigator.clipboard.writeText(invitationMessage(invitationLink, isFrench));
      setMessage(isFrench ? "Message copié. Envoyez-le au destinataire." : "Message copied. Send it to the recipient.");
    } catch {
      setError(isFrench ? "Copie impossible. Copiez le lien manuellement." : "Unable to copy. Copy the link manually.");
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
                ? "Les nouvelles communautés sont privées. Le propriétaire peut inviter des membres à rejoindre sa communauté."
                : "New communities are private. The owner can invite members to join."}
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
                    setCommunityName(
                      event.target.value
                    )
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
                    setDescription(
                      event.target.value
                    )
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

                  const currentInvitation =
                    invitationLink?.walletId ===
                    community.id
                      ? invitationLink
                      : null;

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

                      {/* Owner-only invitations */}

                      {isOwner &&
                        community.status ===
                          "active" && (
                          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                            <h4 className="text-lg font-bold text-green-900">
                              {isFrench
                                ? "Inviter des membres"
                                : "Invite Members"}
                            </h4>

                            <p className="mt-2 text-sm text-green-900">
                              {isFrench
                                ? "Invitez une personne par e-mail, WhatsApp ou SMS. Le lien privé expire après 7 jours et ne peut être accepté qu'une fois."
                                : "Invite someone by email, WhatsApp, or SMS. The private link expires after 7 days and can be accepted only once."}
                            </p>

                            {activeInviteForm !== community.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveInviteForm(community.id);
                                  setInvitationLink(null);
                                  setRecipientName("");
                                  setRecipientEmail("");
                                  setRecipientPhone("");
                                  setInvitationMethod("email");
                                  setError("");
                                  setMessage("");
                                }}
                                className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                              >
                                {isFrench ? "Inviter une personne" : "Invite a person"}
                              </button>
                            ) : (
                              <div className="mt-4 space-y-4">
                                <div>
                                  <label htmlFor={`invite-method-${community.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
                                    {isFrench ? "Méthode d'invitation" : "Invitation method"}
                                  </label>
                                  <select
                                    id={`invite-method-${community.id}`}
                                    value={invitationMethod}
                                    onChange={(event) => {
                                      setInvitationMethod(event.target.value as InvitationMethod);
                                      setInvitationLink(null);
                                    }}
                                    disabled={invitingWalletId !== null}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
                                  >
                                    <option value="email">Email</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="sms">SMS</option>
                                  </select>
                                </div>

                                <div>
                                  <label htmlFor={`invite-name-${community.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
                                    {isFrench ? "Nom du destinataire (facultatif)" : "Recipient name (optional)"}
                                  </label>
                                  <input
                                    id={`invite-name-${community.id}`}
                                    type="text"
                                    maxLength={120}
                                    autoComplete="off"
                                    value={recipientName}
                                    onChange={(event) => {
                                      setRecipientName(event.target.value);
                                      setInvitationLink(null);
                                    }}
                                    disabled={invitingWalletId !== null}
                                    placeholder={isFrench ? "Ex. : Marie" : "e.g. Marie"}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
                                  />
                                </div>

                                {invitationMethod === "email" ? (
                                  <div>
                                    <label htmlFor={`invite-email-${community.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
                                      {isFrench ? "E-mail du destinataire" : "Recipient email"}
                                    </label>
                                    <input
                                      id={`invite-email-${community.id}`}
                                      type="email"
                                      maxLength={254}
                                      autoComplete="off"
                                      value={recipientEmail}
                                      onChange={(event) => {
                                        setRecipientEmail(event.target.value);
                                        setInvitationLink(null);
                                      }}
                                      disabled={invitingWalletId !== null}
                                      placeholder="marie@example.com"
                                      className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
                                    />
                                    <p className="mt-2 text-xs text-gray-600">
                                      {isFrench
                                        ? "Seul un compte NdakoCare avec cet e-mail vérifié peut accepter l'invitation. L'e-mail n'est pas envoyé automatiquement."
                                        : "Only a NdakoCare account with this verified email can accept. Email is not sent automatically."}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <label htmlFor={`invite-phone-${community.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
                                      {isFrench ? "Numéro avec indicatif international" : "Phone number with country code"}
                                    </label>
                                    <input
                                      id={`invite-phone-${community.id}`}
                                      type="tel"
                                      autoComplete="off"
                                      value={recipientPhone}
                                      onChange={(event) => {
                                        setRecipientPhone(event.target.value);
                                        setInvitationLink(null);
                                      }}
                                      disabled={invitingWalletId !== null}
                                      placeholder="+23675000000"
                                      className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
                                    />
                                    <p className="mt-2 text-xs text-amber-900">
                                      {isFrench
                                        ? "Le numéro n'est pas vérifié. Toute personne connectée possédant le lien peut tenter de l'accepter."
                                        : "Phone ownership is not verified. Any signed-in person with the link can attempt to accept it."}
                                    </p>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => { void generateInvitation(community); }}
                                  disabled={invitingWalletId !== null}
                                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {invitingWalletId === community.id
                                    ? (isFrench ? "Création..." : "Generating...")
                                    : (isFrench ? "Créer l'invitation" : "Generate invitation")}
                                </button>
                              </div>
                            )}

                            {currentInvitation && (
                              <div className="mt-5 rounded-xl border border-green-200 bg-white p-4">
                                <p className="text-sm font-semibold text-gray-800">
                                  {isFrench ? "Invitation créée — non envoyée" : "Invitation created — not sent"}
                                </p>
                                <p className="mt-2 text-sm text-gray-700">
                                  {currentInvitation.method === "email"
                                    ? currentInvitation.recipientEmail
                                    : currentInvitation.recipientPhone}
                                </p>
                                <label htmlFor={`invitation-${community.id}`} className="mt-3 block text-sm font-semibold text-gray-800">
                                  {isFrench ? "Lien privé" : "Private link"}
                                </label>
                                <input
                                  id={`invitation-${community.id}`}
                                  type="text"
                                  readOnly
                                  value={currentInvitation.url}
                                  onFocus={(event) => event.currentTarget.select()}
                                  className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { void copyInvitation(); }}
                                    className="rounded-xl border border-green-700 px-4 py-2 font-semibold text-green-800 hover:bg-green-50"
                                  >
                                    {isFrench ? "Copier le lien" : "Copy link"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { void copyInvitationMessage(); }}
                                    className="rounded-xl border border-green-700 px-4 py-2 font-semibold text-green-800 hover:bg-green-50"
                                  >
                                    {isFrench ? "Copier le message" : "Copy message"}
                                  </button>
                                  {currentInvitation.method === "whatsapp" && currentInvitation.recipientPhone && (
                                    <a
                                      href={`https://wa.me/${currentInvitation.recipientPhone.slice(1)}?text=${encodeURIComponent(invitationMessage(currentInvitation, isFrench))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
                                    >
                                      {isFrench ? "Ouvrir WhatsApp" : "Open WhatsApp"}
                                    </a>
                                  )}
                                </div>
                                <p className="mt-3 text-xs text-gray-600">
                                  {isFrench ? "Expiration : " : "Expires: "}
                                  {new Date(currentInvitation.expiresAt).toLocaleString(isFrench ? "fr-FR" : "en-US")}
                                </p>
                                <p className="mt-2 text-xs font-medium text-amber-800">
                                  {currentInvitation.method === "email"
                                    ? (isFrench
                                      ? "Partagez ce lien uniquement avec le destinataire indiqué. Son compte doit avoir le même e-mail vérifié."
                                      : "Share only with the named recipient. Their account must have the matching verified email.")
                                    : (isFrench
                                      ? "Ne publiez pas ce lien : le numéro de téléphone n'est pas vérifié lors de l'acceptation."
                                      : "Do not post this link publicly: phone ownership is not verified at acceptance.")}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Contributions remain disabled */}

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