"use client";

import { useState } from "react";

export default function Home() {

  const [language, setLanguage] = useState("en");

  const translations = {
    en: {
      home: "Home",
      services: "Services",
      how: "How It Works",
      contact: "Contact",
      login: "Login",
      title: "Support Your Family Back Home with",
      subtitle:
        "Send groceries, recharge mobile phones, and transfer support to loved ones in Africa — all from anywhere in the world.",
      grocery: "Grocery Delivery & Pickup",
      recharge: "Mobile Recharge",
      transfer: "Money Transfer",
      tracking: "Delivery Tracking",
      available: "Available Services",
    },

    fr: {
      home: "Accueil",
      services: "Services",
      how: "Fonctionnement",
      contact: "Contact",
      login: "Connexion",
      title: "Soutenez Votre Famille au Pays avec",
      subtitle:
        "Envoyez des courses, rechargez des téléphones mobiles et transférez de l’aide à vos proches en Afrique — depuis n’importe où dans le monde.",
      grocery: "Livraison & Retrait des Courses",
      recharge: "Recharge Mobile",
      transfer: "Transfert d’Argent",
      tracking: "Suivi de Livraison",
      available: "Services Disponibles",
    },
  };

  const t = translations[language as keyof typeof translations];

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 shadow-sm">

        {/* LOGO */}
        <div className="text-3xl font-bold">
          <span className="text-green-700">Ndako</span>
          <span className="text-orange-500">Care</span>
        </div>

        {/* NAV LINKS */}
        <div className="hidden md:flex gap-8 font-medium">
          <a href="#" className="hover:text-green-700">{t.home}</a>
          <a href="#" className="hover:text-green-700">{t.services}</a>
          <a href="#" className="hover:text-green-700">{t.how}</a>
          <a href="#" className="hover:text-green-700">{t.contact}</a>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {/* LANGUAGE SWITCHER */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-orange-400 rounded-lg px-3 py-2 text-sm"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="fr">🇫🇷 FR</option>
          </select>

          {/* LOGIN BUTTON */}
          <button className="bg-green-700 text-white px-5 py-2 rounded-xl hover:bg-green-800 transition">
            {t.login}
          </button>

        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="px-8 py-20 md:px-20 flex flex-col md:flex-row items-center justify-between gap-10">

        <div className="max-w-2xl">

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            {t.title}{" "}
            <span className="text-green-700">NdakoCare</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            {t.subtitle}
          </p>

        </div>

        {/* SERVICES CARD */}
        <div className="bg-gray-100 p-8 rounded-3xl shadow-lg w-full max-w-md">

          <h2 className="text-2xl font-bold mb-4">
            {t.available}
          </h2>

          <div className="space-y-4">

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              🛒 {t.grocery}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              📱 {t.recharge}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              💸 {t.transfer}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              🚚 {t.tracking}
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}