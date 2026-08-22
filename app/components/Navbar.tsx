"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../lib/translations";

export default function Navbar() {
const router = useRouter();
const { language, setLanguage } = useLanguage();

const [isAdmin, setIsAdmin] = useState(false);

const text =
translations[
language as keyof typeof translations
];

useEffect(() => {
const checkAdmin = async () => {
const {
data: { user },
} = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (data?.is_admin) {
    setIsAdmin(true);
  }
};

checkAdmin();

}, []);

const logout = async () => {
await supabase.auth.signOut();
router.push("/login");
};

const navLink =
"px-3 py-2 rounded-lg hover:bg-green-600 transition duration-200";

return ( <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50"> <div className="max-w-7xl mx-auto px-4">

    {/* Header */}
    <div className="flex flex-col lg:flex-row items-center justify-between py-4 gap-4">

      {/* Logo + Back */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="bg-white text-green-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-100"
        >
          ← {text.back}
        </button>

        <Link href="/dashboard">
          <h1 className="text-3xl md:text-4xl font-extrabold cursor-pointer">
            NdakoCare
          </h1>
        </Link>
      </div>

      {/* Language + Logout */}
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-black px-3 py-2 rounded-xl"
        >
          <option value="en">🇺🇸 English</option>
          <option value="fr">🇫🇷 Français</option>
        </select>

        <button
          onClick={logout}
          className="bg-white text-green-700 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100"
        >
          {text.logout}
        </button>
      </div>
    </div>

 {/* Navigation */}
<div className="flex flex-wrap items-center gap-2 pb-4 text-sm md:text-base">

  <Link href="/dashboard" className={navLink}>
    Dashboard
  </Link>

  <Link href="/activity" className={navLink}>
    Activity
  </Link>

  <Link href="/notifications" className={navLink}>
    🔔 Notifications
  </Link>

  <Link href="/wallet" className={navLink}>
    Wallet
  </Link>

  <Link href="/beneficiaries" className={navLink}>
    Beneficiaries
  </Link>

  <Link href="/transfer" className={navLink}>
    Money Transfer
  </Link>

  <Link href="/profile" className={navLink}>
    Profile
  </Link>

  {isAdmin && (
    <Link
      href="/admin"
      className="px-3 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
    >
      Admin
    </Link>
  )}

</div>
  </div>
</nav>

);
}