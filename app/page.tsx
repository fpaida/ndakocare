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

  const t =
    language === "fr"
      ? {
          home: "Accueil",
          services: "Services",
          how: "Fonctionnement",
          contact: "Contact",
          login: "Connexion",
          heroTitle: "Soutenez votre famille au pays avec",
          heroSubtitle:
            "Envoyez des courses, rechargez des téléphones mobiles et transférez de l’aide à vos proches en Afrique depuis n’importe où dans le monde.",
          getStarted: "Commencer",
          learnMore: "En savoir plus",
          available: "Services disponibles",
          grocery: "Livraison et retrait des courses",
          recharge: "Recharge mobile",
          transfer: "Transfert d’argent",
          tracking: "Suivi de livraison",
          trusted: "Adopté par les familles de la diaspora africaine",
          step1: "Créer une commande",
          step1Text: "Choisissez le service et envoyez les détails.",
          step2: "Nous traitons la demande",
          step2Text: "Notre équipe prépare ou coordonne le service.",
          step3: "Votre famille reçoit l’aide",
          step3Text: "Vos proches reçoivent les courses, la recharge ou le support.",
          contactTitle: "Contactez-nous",
          contactText:
            "Vous avez une question ou souhaitez devenir partenaire ? Envoyez-nous un message.",
          name: "Votre nom",
          email: "Votre email",
          message: "Votre message",
          send: "Envoyer le message",
          footer: "Prendre soin de la maison, où que vous soyez.",
          rights: "Tous droits réservés.",
        }
      : {
          home: "Home",
          services: "Services",
          how: "How It Works",
          contact: "Contact",
          login: "Login",
          heroTitle: "Support your family back home with",
          heroSubtitle:
            "Send groceries, recharge mobile phones, and support loved ones in Africa from anywhere in the world.",
          getStarted: "Get Started",
          learnMore: "Learn More",
          available: "Available Services",
          grocery: "Grocery Delivery & Pickup",
          recharge: "Mobile Recharge",
          transfer: "Money Transfer",
          tracking: "Delivery Tracking",
          trusted: "Trusted by African diaspora families",
          step1: "Create an Order",
          step1Text: "Choose your service and send the details.",
          step2: "We Process It",
          step2Text: "Our team prepares or coordinates the service.",
          step3: "Family Receives It",
          step3Text: "Your loved ones receive groceries, recharge, or support.",
          contactTitle: "Contact Us",
          contactText:
            "Have a question or want to become a partner? Send us a message.",
          name: "Your name",
          email: "Your email",
          message: "Your message",
          send: "Send Message",
          footer: "Care for home, wherever you are.",
          rights: "All rights reserved.",
        };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#home" className="text-3xl font-extrabold">
            <span className="text-green-700">Ndako</span>
            <span className="text-orange-500">Care</span>
          </a>

          <div className="hidden md:flex items-center gap-8 font-semibold text-gray-700">
            <a href="#home" className="hover:text-green-700">
              {t.home}
            </a>
            <a href="#services" className="hover:text-green-700">
              {t.services}
            </a>
            <a href="#how-it-works" className="hover:text-green-700">
              {t.how}
            </a>
            <a href="#contact" className="hover:text-green-700">
              {t.contact}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="fr">🇫🇷 FR</option>
            </select>

            <a
              href="/login"
              className="bg-green-700 text-white px-5 py-2 rounded-xl font-semibold hover:bg-green-800"
            >
              {t.login}
            </a>
          </div>
        </div>
      </nav>

      <section
        id="home"
        className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white shadow rounded-full px-4 py-2 text-sm font-semibold mb-8">
              <FaGlobeAfrica className="text-green-700" />
              {t.trusted}
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              {t.heroTitle}
              <span className="block text-green-700 mt-2">NdakoCare</span>
            </h1>

            <p className="mt-8 text-xl text-gray-600 leading-relaxed">
              {t.heroSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/register"
                className="bg-green-700 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-green-800 shadow-lg"
              >
                {t.getStarted}
              </a>

              <a
                href="#how-it-works"
                className="bg-white border border-gray-300 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-100"
              >
                {t.learnMore}
              </a>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold mb-8">{t.available}</h2>

            <div className="space-y-5">
              <ServiceItem icon={<FaShoppingBasket />} text={t.grocery} green />
              <ServiceItem icon={<FaMobileAlt />} text={t.recharge} />
              <ServiceItem icon={<FaMoneyBillWave />} text={t.transfer} green />
              <ServiceItem icon={<FaTruck />} text={t.tracking} />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="min-h-screen py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-extrabold text-center mb-16">
            {t.services}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard icon={<FaShoppingBasket />} title={t.grocery} green />
            <ServiceCard icon={<FaMobileAlt />} title={t.recharge} />
            <ServiceCard icon={<FaMoneyBillWave />} title={t.transfer} green />
            <ServiceCard icon={<FaTruck />} title={t.tracking} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="min-h-screen py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-extrabold text-center mb-16">
            {t.how}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Step number="1" title={t.step1} text={t.step1Text} />
            <Step number="2" title={t.step2} text={t.step2Text} />
            <Step number="3" title={t.step3} text={t.step3Text} />
          </div>
        </div>
      </section>

      <section id="contact" className="min-h-screen bg-gray-900 text-white py-32">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-5xl font-extrabold mb-6">{t.contactTitle}</h2>

            <p className="text-gray-300 text-lg mb-8">{t.contactText}</p>

            <div className="space-y-4 text-lg">
              <p>📧 support@ndakocare.com</p>
              <p>📞 +1 (412) 799-9862</p>
              <p>📞 +1 (443) 814-6589</p>
              <p>🌍 Pittsburgh, Pennsylvania</p>
            </div>
          </div>

          <div className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl">
            <input
              type="text"
              placeholder={t.name}
              className="w-full p-4 mb-4 border rounded-xl"
            />

            <input
              type="email"
              placeholder={t.email}
              className="w-full p-4 mb-4 border rounded-xl"
            />

            <textarea
              rows={5}
              placeholder={t.message}
              className="w-full p-4 mb-4 border rounded-xl"
            />

            <button className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-800">
              {t.send}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between gap-4 text-gray-400">
          <p>
            <span className="text-green-500 font-bold">Ndako</span>
            <span className="text-orange-400 font-bold">Care</span> — {t.footer}
          </p>

          <p>© 2026 NdakoCare. {t.rights}</p>
        </div>
      </section>
    </main>
  );
}

function ServiceItem({
  icon,
  text,
  green,
}: {
  icon: React.ReactNode;
  text: string;
  green?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 hover:bg-green-50 p-5 rounded-2xl shadow-sm">
      <span
        className={`text-2xl ${green ? "text-green-700" : "text-orange-500"}`}
      >
        {icon}
      </span>
      <span className="font-semibold text-lg">{text}</span>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  green,
}: {
  icon: React.ReactNode;
  title: string;
  green?: boolean;
}) {
  return (
    <div className="bg-gray-50 hover:bg-green-50 p-8 rounded-3xl shadow transition">
      <div
        className={`text-5xl mb-6 ${
          green ? "text-green-700" : "text-orange-500"
        }`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold">{title}</h3>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow text-center">
      <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-2xl bg-green-700 text-white text-3xl font-extrabold">
        {number}
      </div>

      <h3 className="text-2xl font-bold mb-4">{title}</h3>

      <p className="text-gray-600">{text}</p>
    </div>
  );
}