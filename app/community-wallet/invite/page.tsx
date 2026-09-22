
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../context/LanguageContext";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

type AcceptResponse = {
  success?: boolean;
  walletId?: string;
  message?: string;
  error?: string;
};

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { language } = useLanguage();
  const isFrench = language === "fr";

  const token = searchParams.get("token")?.trim() ?? "";
  const validToken = TOKEN_PATTERN.test(token);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [signedIn, setSignedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        setSignedIn(
          !authError && Boolean(user)
        );
      } catch {
        if (active) {
          setSignedIn(false);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  const acceptInvitation = async () => {
    if (
      !validToken ||
      accepting ||
      accepted
    ) {
      return;
    }

    setError("");
    setAccepting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        setSignedIn(false);

        throw new Error(
          isFrench
            ? "Votre session a expiré. Reconnectez-vous."
            : "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/community/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            token,
          }),
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as
          AcceptResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.walletId
      ) {
        throw new Error(
          result.error ||
            (isFrench
              ? "Impossible d'accepter cette invitation."
              : "Unable to accept this invitation.")
        );
      }

      setAccepted(true);

      // The token is single-use. Remove it from
      // the browser address after acceptance.
      window.history.replaceState(
        null,
        "",
        "/community-wallet/invite"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFrench
            ? "Impossible d'accepter cette invitation."
            : "Unable to accept this invitation."
      );
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-lg sm:p-8">

          <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
            {isFrench
              ? "Invitation privée"
              : "Private invitation"}
          </div>

          <h1 className="text-3xl font-bold text-green-800">
            {isFrench
              ? "Rejoindre une communauté"
              : "Join a Community"}
          </h1>

          <p className="mt-4 text-gray-600">
            {isFrench
              ? "Une personne vous a invité à rejoindre une communauté privée sur NdakoCare."
              : "Someone has invited you to join a private community on NdakoCare."}
          </p>

          {!validToken && !accepted && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {isFrench
                ? "Ce lien d'invitation est manquant ou invalide."
                : "This invitation link is missing or invalid."}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {error}
            </div>
          )}

          {accepted ? (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5"
            >
              <h2 className="text-xl font-bold text-green-900">
                {isFrench
                  ? "Bienvenue dans la communauté !"
                  : "Welcome to the community!"}
              </h2>

              <p className="mt-2 text-green-900">
                {isFrench
                  ? "Votre adhésion a été confirmée."
                  : "Your membership has been confirmed."}
              </p>

              <button
                type="button"
                onClick={() => {
                  router.push("/community-wallet");
                }}
                className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                {isFrench
                  ? "Voir mes communautés"
                  : "View My Communities"}
              </button>
            </div>
          ) : validToken && checkingSession ? (
            <p className="mt-6 text-gray-600">
              {isFrench
                ? "Vérification de votre session..."
                : "Checking your session..."}
            </p>
          ) : validToken && !signedIn ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">
                {isFrench
                  ? "Connexion requise"
                  : "Sign-in required"}
              </p>

              <p className="mt-2 text-sm text-amber-900">
                {isFrench
                  ? "Connectez-vous à votre compte NdakoCare avant d'accepter cette invitation. Conservez ce lien pour revenir après la connexion."
                  : "Sign in to your NdakoCare account before accepting this invitation. Keep this link so you can return after signing in."}
              </p>

              <button
                type="button"
                onClick={() => {
                  router.push("/login");
                }}
                className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                {isFrench
                  ? "Se connecter"
                  : "Sign In"}
              </button>
            </div>
          ) : validToken ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="font-semibold text-green-900">
                {isFrench
                  ? "Accepter l'invitation ?"
                  : "Accept this invitation?"}
              </p>

              <p className="mt-2 text-sm text-green-900">
                {isFrench
                  ? "En acceptant, vous rejoindrez cette communauté privée avec votre compte NdakoCare."
                  : "By accepting, you will join this private community using your NdakoCare account."}
              </p>

              <button
                type="button"
                onClick={() => {
                  void acceptInvitation();
                }}
                disabled={accepting}
                className="mt-5 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {accepting
                  ? isFrench
                    ? "Acceptation..."
                    : "Accepting..."
                  : isFrench
                    ? "Accepter et rejoindre"
                    : "Accept and Join"}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              router.push("/community-wallet");
            }}
            className="mt-6 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            {isFrench
              ? "Retour aux communautés"
              : "Back to Communities"}
          </button>

          <p className="mt-6 text-xs text-gray-500">
            {isFrench
              ? "L'adhésion à une communauté n'effectue aucun paiement et ne modifie aucun solde."
              : "Joining a community does not make a payment or change any balance."}
          </p>
        </div>
      </main>
    </>
  );
}

export default function CommunityInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-100 p-8 text-gray-600">
          Loading invitation...
        </main>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}