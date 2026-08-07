"use client";

import {
  FaShoppingBasket,
  FaMobileAlt,
  FaMoneyBillWave,
  FaGlobeAfrica,
  FaTv,
  FaBolt,
  FaGraduationCap,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaWallet,
  FaPills,
  FaPiggyBank,
  FaUsers,
  FaHandsHelping,
  FaUniversity,
} from "react-icons/fa";

import { useLanguage } from "./context/LanguageContext";
import { translations } from "./lib/translations";

export default function Home() {
  const { language, setLanguage } = useLanguage();

  const t = translations[language as keyof typeof translations];
  const isFr = language === "fr";

  const services = [
    {
      title: isFr ? "Livraison de Courses" : "Grocery Delivery",
      href: "/grocery",
      icon: <FaShoppingBasket />,
    },
    {
      title: isFr ? "Recharge Mobile" : "Mobile Recharge",
      href: "/recharge",
      icon: <FaMobileAlt />,
    },
    {
      title: isFr ? "Transfert d’Argent" : "Money Transfer",
      href: "/transfer",
      icon: <FaMoneyBillWave />,
    },
    {
      title: isFr ? "Frais Scolaires" : "School Fees",
      href: "/pay-school-fees",
      icon: <FaGraduationCap />,
    },
    {
      title: isFr ? "Factures Électricité" : "Electricity Bills",
      href: "/pay-electricity",
      icon: <FaBolt />,
    },
    {
      title: isFr ? "Abonnement TV" : "TV Subscription",
      href: "/pay-tv",
      icon: <FaTv />,
    },
    {
      title: isFr ? "Pharmacie" : "Pharmacy",
      href: "/pharmacy",
      icon: <FaPills />,
    },
    {
      title: isFr ? "Objectifs d’Épargne" : "Savings Goals",
      href: "/savings",
      icon: <FaPiggyBank />,
    },
    {
      title: isFr ? "Portefeuille Communautaire" : "Community Wallet",
      href: "/community-wallet",
      icon: <FaUsers />,
    },
    {
      title: isFr ? "Portefeuille" : "Wallet",
      href: "/wallet",
      icon: <FaWallet />,
    },
  ];

  const stats = [
    {
      value: "54+",
      label: isFr ? "Pays Africains" : "African Countries",
    },
    {
      value: "10+",
      label: isFr ? "Services Financiers" : "Financial Services",
    },
    {
      value: "24/7",
      label: isFr ? "Support Client" : "Customer Support",
    },
    {
      value: "100%",
      label: isFr ? "Transactions Sécurisées" : "Secure Transactions",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <a href="#home" className="text-3xl font-extrabold">
            <span className="text-green-700">Ndako</span>
            <span className="text-orange-500">Care</span>
          </a>

          <div className="hidden md:flex items-center gap-8 font-semibold text-slate-700">
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

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 bg-white"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="fr">🇫🇷 FR</option>
            </select>

            <a
              href="/login"
              className="bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 transition"
            >
              {t.login}
            </a>
          </div>
        </div>
      </nav>

      <section
        id="home"
        className="bg-gradient-to-br from-green-900 via-green-700 to-orange-500 text-white"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-8">
              <FaGlobeAfrica />
              {isFr
                ? "L’écosystème financier des familles africaines"
                : "The financial ecosystem for African families"}
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              {isFr
                ? "L’Écosystème Financier des Familles Africaines"
                : "The Financial Ecosystem for African Families"}
              <span className="block text-orange-300 mt-2">NdakoCare</span>
            </h1>

            <p className="mt-8 text-xl text-green-50 leading-relaxed max-w-2xl">
              {isFr
                ? "Envoyez de l'argent, payez les frais scolaires, achetez des courses, commandez des médicaments, épargnez pour vos projets et soutenez votre communauté."
                : "Send money, pay school fees, purchase groceries, order medicines, save for goals, and support your community from anywhere in the world."}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/register"
                className="bg-orange-500 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-orange-600 shadow-xl transition"
              >
                {t.getStarted}
              </a>

              <a
                href="#services"
                style={{
                  color: "#15803d",
                  backgroundColor: "white",
                  fontWeight: "bold",
                }}
                className="inline-flex items-center justify-center px-8 py-4 min-w-[220px] rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                {t.learnMore}
              </a>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-extrabold text-green-700 mb-6">
              {isFr ? "Écosystème NdakoCare" : "NdakoCare Ecosystem"}
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <a
                  key={service.href}
                  href={service.href}
                  className="group bg-slate-50 hover:bg-green-50 border border-slate-100 hover:border-green-300 rounded-2xl p-4 transition"
                >
                  <div className="text-2xl text-green-700 group-hover:text-orange-500 mb-2">
                    {service.icon}
                  </div>

                  <h3 className="font-bold text-slate-900">
                    {service.title}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-3xl shadow-lg p-8 text-center"
            >
              <h3 className="text-4xl font-extrabold text-green-700">
                {stat.value}
              </h3>

              <p className="mt-2 font-semibold text-slate-700">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-5xl font-extrabold text-green-700">
            {isFr ? "Pourquoi NdakoCare ?" : "Why NdakoCare?"}
          </h2>

          <p className="mt-4 text-slate-600 text-lg">
            {isFr
              ? "Une plateforme pour gérer l’argent, la famille, les services essentiels et les projets communautaires."
              : "One platform to manage money, family support, essential services, and community projects."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FaUniversity />}
            title={isFr ? "Banque sans Banque" : "Banking Without Banks"}
            text={
              isFr
                ? "Gardez votre argent en sécurité même sans compte bancaire traditionnel."
                : "Store and manage money securely, even without a traditional bank account."
            }
          />

          <FeatureCard
            icon={<FaHandsHelping />}
            title={isFr ? "Finance Communautaire" : "Community Finance"}
            text={
              isFr
                ? "Soutenez les associations, familles, églises et projets communautaires avec transparence."
                : "Support associations, families, churches, and community projects with transparency."
            }
          />

          <FeatureCard
            icon={<FaShieldAlt />}
            title={isFr ? "Confiance et Suivi" : "Trust and Tracking"}
            text={
              isFr
                ? "Suivez les transactions, paiements, commandes et preuves de livraison."
                : "Track transactions, payments, orders, and proof of delivery in one place."
            }
          />
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-extrabold text-center text-green-700 mb-14">
            {isFr ? "Comment ça marche" : "How It Works"}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              icon={<FaWallet />}
              title={isFr ? "Créez votre portefeuille" : "Create Your Wallet"}
              text={
                isFr
                  ? "Déposez, gardez et gérez votre argent en toute sécurité."
                  : "Deposit, store, and manage your money securely."
              }
            />

            <StepCard
              icon={<FaCheckCircle />}
              title={isFr ? "Choisissez un service" : "Choose a Service"}
              text={
                isFr
                  ? "Payez les courses, médicaments, frais scolaires, factures ou transferts."
                  : "Pay for groceries, medicines, school fees, bills, or transfers."
              }
            />

            <StepCard
              icon={<FaClock />}
              title={isFr ? "Suivez tout" : "Track Everything"}
              text={
                isFr
                  ? "Suivez les activités, reçus, preuves et rapports depuis votre tableau de bord."
                  : "Track activities, receipts, proofs, and reports from your dashboard."
              }
            />
          </div>
        </div>
      </section>

      <section id="contact" className="bg-slate-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-5xl font-extrabold mb-6">
              {t.contactTitle}
            </h2>

            <p className="text-slate-300 text-lg mb-8">
              {t.contactText}
            </p>

            <div className="space-y-4 text-lg">
              <p>📧 support@ndakocare.com</p>
              <p>📞 +1 (412) 799-9862</p>
              <p>🌍 Pittsburgh, Pennsylvania</p>
            </div>
          </div>

          <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl">
            <input
              type="text"
              placeholder={t.name}
              className="w-full p-4 mb-4 border rounded-xl"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 mb-4 border rounded-xl"
            />

            <textarea
              placeholder={t.message}
              className="w-full p-4 mb-4 border rounded-xl h-32"
            />

            <button className="w-full bg-green-700 text-white py-4 rounded-xl font-bold hover:bg-green-800 transition">
              {t.send}
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center">
        <p>
          © 2026 NdakoCare. {t.rights}
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border">
      <div className="text-4xl text-green-700 mb-4">
        {icon}
      </div>

      <h3 className="text-2xl font-bold mb-4">
        {title}
      </h3>

      <p className="text-slate-600 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function StepCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-slate-50 rounded-3xl shadow p-8 text-center">
      <div className="text-5xl text-green-700 mb-4 flex justify-center">
        {icon}
      </div>

      <h3 className="text-2xl font-bold mb-3">
        {title}
      </h3>

      <p className="text-slate-600">
        {text}
      </p>
    </div>
  );
}