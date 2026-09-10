"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

type Merchant = {
  id: string;
  name: string;
  merchant_type: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  currency: string | null;
  is_active: boolean | null;
  user_id: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const [isAdmin, setIsAdmin] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);

  const isFr = language === "fr";

  const text =
    translations[
      language as keyof typeof translations
    ];

  useEffect(() => {
    const checkAccount = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("NAVBAR AUTH USER:", {
          id: user?.id ?? null,
          email: user?.email ?? null,
        });

        console.log(
          "NAVBAR AUTH ERROR:",
          userError
        );

        if (userError || !user) {
          setIsAdmin(false);
          setMerchant(null);
          setAccountChecked(true);
          return;
        }

        /*
         * Check whether the authenticated user
         * is an administrator.
         */
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        console.log(
          "NAVBAR PROFILE:",
          profileData
        );

        console.log(
          "NAVBAR PROFILE ERROR:",
          profileError
        );

        setIsAdmin(
          profileData?.is_admin === true
        );

        /*
         * Check whether the authenticated user
         * belongs to an active merchant.
         */
        const {
          data: merchantData,
          error: merchantError,
        } = await supabase
          .from("merchants")
          .select(
            `
              id,
              name,
              merchant_type,
              city,
              country,
              country_code,
              currency,
              is_active,
              user_id
            `
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        console.log(
          "NAVBAR MERCHANT:",
          merchantData
        );

        console.log(
          "NAVBAR MERCHANT ERROR:",
          merchantError
        );

        if (merchantError) {
          setMerchant(null);
        } else {
          setMerchant(
            (merchantData as Merchant | null) ??
              null
          );
        }
      } catch (error) {
        console.error(
          "NAVBAR ACCOUNT CHECK ERROR:",
          error
        );

        setIsAdmin(false);
        setMerchant(null);
      } finally {
        setAccountChecked(true);
      }
    };

    void checkAccount();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLink =
    "px-3 py-2 rounded-lg hover:bg-green-600 transition duration-200";

  const merchantNavLink =
    "px-3 py-2 rounded-lg hover:bg-green-600 transition duration-200";

  const homeHref = merchant
    ? "/merchant-portal"
    : "/dashboard";

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-4 gap-4">

          {/* Logo + Back */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white text-green-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-100"
            >
              ← {text.back}
            </button>

            <Link href={homeHref}>
              <h1 className="text-3xl md:text-4xl font-extrabold cursor-pointer">
                NdakoCare
              </h1>
            </Link>

            {merchant && (
              <span className="hidden md:inline-flex bg-green-600 border border-green-500 px-3 py-1 rounded-full text-sm font-semibold">
                🏪 {merchant.name}
              </span>
            )}
          </div>

          {/* Language + Logout */}
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              className="text-black px-3 py-2 rounded-xl"
              aria-label={
                isFr
                  ? "Sélectionner la langue"
                  : "Select language"
              }
            >
              <option value="en">
                🇺🇸 English
              </option>

              <option value="fr">
                🇫🇷 Français
              </option>
            </select>

            <button
              type="button"
              onClick={logout}
              className="bg-white text-green-700 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100"
            >
              {text.logout}
            </button>
          </div>
        </div>

        {/* Navigation */}
        {accountChecked && (
          <div className="flex flex-wrap items-center gap-2 pb-4 text-sm md:text-base">

            {merchant ? (
              <>
                {/* Merchant navigation */}

                <Link
                  href="/merchant-portal"
                  className={merchantNavLink}
                >
                  🏪{" "}
                  {isFr
                    ? "Portail Marchand"
                    : "Merchant Portal"}
                </Link>

                <Link
                  href="/notifications"
                  className={merchantNavLink}
                >
                  🔔 Notifications
                </Link>

                <Link
                  href="/profile"
                  className={merchantNavLink}
                >
                  {isFr
                    ? "Profil"
                    : "Profile"}
                </Link>
              </>
            ) : (
              <>
                {/* Customer / Admin navigation */}

                <Link
                  href="/dashboard"
                  className={navLink}
                >
                  {isFr
                    ? "Tableau de bord"
                    : "Dashboard"}
                </Link>

                <Link
                  href="/activity"
                  className={navLink}
                >
                  {isFr
                    ? "Activité"
                    : "Activity"}
                </Link>

                <Link
                  href="/notifications"
                  className={navLink}
                >
                  🔔 Notifications
                </Link>

                <Link
                  href="/wallet"
                  className={navLink}
                >
                  {isFr
                    ? "Portefeuille"
                    : "Wallet"}
                </Link>

                {/* Nia AI Assistant */}
                <Link
                  href="/nia"
                  className={navLink}
                >
                  {isFr
                    ? "Demander à Nia"
                    : "Ask Nia"}
                </Link>

                <Link
                  href="/beneficiaries"
                  className={navLink}
                >
                  {isFr
                    ? "Bénéficiaires"
                    : "Beneficiaries"}
                </Link>

                <Link
                  href="/transfer"
                  className={navLink}
                >
                  {isFr
                    ? "Transfert d'argent"
                    : "Money Transfer"}
                </Link>

                <Link
                  href="/profile"
                  className={navLink}
                >
                  {isFr
                    ? "Profil"
                    : "Profile"}
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition duration-200"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}

          </div>
        )}
      </div>
    </nav>
  );
}