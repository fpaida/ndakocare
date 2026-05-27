"use client";

import { useState } from "react";

import {
  FaShoppingBasket,
  FaMobileAlt,
  FaMoneyBillWave,
  FaTruck,
  FaGlobeAfrica,
} from "react-icons/fa";

export default function Home() {
  const [language, setLanguage] = useState("en");

  const translations = {
    en: {
      home: "Home",
      services: "Services",
      how: "How It Works",
      contact: "Contact",
      login: "Login",
      heroTitle: "Support Your Family Back Home with",
      heroSubtitle:
        "Send groceries, recharge mobile phones, and transfer support to loved ones in Africa — all from anywhere in the world.",
      getStarted: "Get Started",
      learnMore: "Learn More",
      available: "Available Services",
      grocery: "Grocery Delivery & Pickup",
      recharge: "Mobile Recharge",
      transfer: "Money Transfer",
      tracking: "Delivery Tracking",
      trusted: "Trusted by African diaspora families",
    },

    fr: {
      home: "Accueil",
      services: "Services",
      how: "Fonctionnement",
      contact: "Contact",
      login: "Connexion",
      heroTitle: "Soutenez Votre Famille au Pays avec",
      heroSubtitle:
        "Envoyez des courses, rechargez des téléphones mobiles et transférez de l’aide à vos proches en Afrique — depuis n’importe où dans le monde.",
      getStarted: "Commencer",
      learnMore: "En savoir plus",
      available: "Services Disponibles",
      grocery: "Livraison & Retrait des Courses",
      recharge: "Recharge Mobile",
      transfer: "Transfert d’Argent",
      tracking: "Suivi de Livraison",
      trusted: "Adopté par les familles de la diaspora africaine",
    },
  };

  const t = translations[language as keyof typeof translations];

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">

        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

          {/* LOGO */}
          <div className="text-3xl font-extrabold">
            <span className="text-green-700">Ndako</span>
            <span className="text-orange-500">Care</span>
          </div>

          {/* NAV LINKS */}
          <div className="hidden md:flex gap-10 font-medium text-gray-700">
            <a href="#" className="hover:text-green-700 transition">
              {t.home}
            </a>

            <a href="#" className="hover:text-green-700 transition">
              {t.services}
            </a>

            <a href="#" className="hover:text-green-700 transition">
              {t.how}
            </a>

            <a href="#" className="hover:text-green-700 transition">
              {t.contact}
            </a>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-orange-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="fr">🇫🇷 FR</option>
            </select>

            <button className="bg-green-700 text-white px-5 py-2 rounded-xl hover:bg-green-800 transition shadow">
              {t.login}
            </button>

          </div>

        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-green-50 to-orange-50">

        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">

          {/* LEFT SIDE */}
          <div>

            <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700 mb-8">
              <FaGlobeAfrica className="text-green-700" />
              {t.trusted}
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">

              {t.heroTitle}

              <span className="block text-green-700 mt-2">
                NdakoCare
              </span>

            </h1>

            <p className="mt-8 text-xl text-gray-600 leading-relaxed">
              {t.heroSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <button className="bg-green-700 hover:bg-green-800 transition text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg">
                {t.getStarted}
              </button>

              <button className="bg-white border border-gray-300 hover:bg-gray-100 transition px-8 py-4 rounded-2xl text-lg font-semibold">
                {t.learnMore}
              </button>

            </div>

          </div>

          {/* RIGHT SIDE CARD */}
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100">

            <h2 className="text-3xl font-bold mb-8">
              {t.available}
            </h2>

            <div className="space-y-5">

              <div className="flex items-center gap-4 bg-gray-50 hover:bg-green-50 transition p-5 rounded-2xl shadow-sm">
                <FaShoppingBasket className="text-green-700 text-2xl" />
                <span className="font-medium text-lg">
                  {t.grocery}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 hover:bg-green-50 transition p-5 rounded-2xl shadow-sm">
                <FaMobileAlt className="text-orange-500 text-2xl" />
                <span className="font-medium text-lg">
                  {t.recharge}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 hover:bg-green-50 transition p-5 rounded-2xl shadow-sm">
                <FaMoneyBillWave className="text-green-700 text-2xl" />
                <span className="font-medium text-lg">
                  {t.transfer}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 hover:bg-green-50 transition p-5 rounded-2xl shadow-sm">
                <FaTruck className="text-orange-500 text-2xl" />
                <span className="font-medium text-lg">
                  {t.tracking}
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-10">

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

          <div>
            <h2 className="text-3xl font-bold">
              <span className="text-green-500">Ndako</span>
              <span className="text-orange-400">Care</span>
            </h2>

            <p className="text-gray-400 mt-2">
              Care for home, wherever you are.
            </p>
          </div>

          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>

            <a href="#" className="hover:text-white transition">
              Terms
            </a>

            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>

        </div>

      </footer>

    </main>
  );
}