"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

import {
  FaWallet,
  FaUsers,
  FaReceipt,
  FaShoppingCart,
  FaMobileAlt,
  FaMoneyBillWave,
  FaGraduationCap,
  FaBolt,
  FaTv,
  FaPills,
  FaTruck,
  FaPiggyBank,
  FaStore,
  FaBell,
} from "react-icons/fa";

export default function DashboardPage() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [walletBalance, setWalletBalance] = useState(0);
  const [savingsCount, setSavingsCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const userId = session.user.id;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    setWalletBalance(Number(wallet?.balance || 0));

    const { count: savings } = await supabase
      .from("savings_goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    setSavingsCount(savings || 0);

    const { count: communities } = await supabase
      .from("community_wallets")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId);

    setCommunityCount(communities || 0);

    const { count: notifications } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotificationsCount(notifications || 0);

    const { data: activity } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentActivity(activity || []);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-green-700">
              {isFr ? "Tableau de bord" : "Dashboard"}
            </h1>

            <p className="text-gray-600 mt-2">
              {isFr
                ? "Gérez votre argent, vos services, vos projets et vos communautés."
                : "Manage your money, services, projects, and communities."}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-3xl p-8 mb-10 shadow-lg">
            <h2 className="text-3xl font-bold mb-3">
              {isFr
                ? "Bienvenue dans l'écosystème financier NdakoCare"
                : "Welcome to the NdakoCare Financial Ecosystem"}
            </h2>

            <p className="text-lg opacity-90">
              {isFr
                ? "Gérez votre argent, soutenez votre famille, achetez des médicaments, payez des factures et participez aux projets communautaires depuis une seule plateforme."
                : "Manage money, support family, purchase medicines, pay bills, and participate in community projects from one platform."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title={isFr ? "Solde Disponible" : "Available Balance"}
              value={`$${walletBalance.toFixed(2)}`}
              icon={<FaWallet />}
              color="text-green-700"
            />

            <StatCard
              title={isFr ? "Objectifs d'Épargne" : "Savings Goals"}
              value={savingsCount}
              icon={<FaPiggyBank />}
              color="text-pink-600"
            />

            <StatCard
              title={
                isFr
                  ? "Portefeuille Communautaire"
                  : "Community Wallet"
              }
              value={communityCount}
              icon={<FaUsers />}
              color="text-blue-600"
            />

            <StatCard
              title={isFr ? "Notifications" : "Notifications"}
              value={notificationsCount}
              icon={<FaBell />}
              color="text-yellow-500"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-10 items-start">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6">
                {isFr ? "Écosystème NdakoCare" : "NdakoCare Ecosystem"}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <DashboardCard
                  href="/wallet"
                  title={isFr ? "Portefeuille" : "Wallet"}
                  icon={<FaWallet />}
                />

                <DashboardCard
                  href="/transfer"
                  title={isFr ? "Transfert d'Argent" : "Money Transfer"}
                  icon={<FaMoneyBillWave />}
                />

                <DashboardCard
                  href="/recharge"
                  title={isFr ? "Recharge Mobile" : "Mobile Recharge"}
                  icon={<FaMobileAlt />}
                />

                <DashboardCard
                  href="/savings"
                  title={isFr ? "Objectifs d'Épargne" : "Savings Goals"}
                  icon={<FaPiggyBank />}
                />

                <DashboardCard
                  href="/community-wallet"
                  title={
                    isFr
                      ? "Portefeuille Communautaire"
                      : "Community Wallet"
                  }
                  icon={<FaUsers />}
                />

                <DashboardCard
                  href="/merchant-portal"
                  title={isFr ? "Portail Marchand" : "Merchant Portal"}
                  icon={<FaStore />}
                />

                <DashboardCard
                  href="/grocery"
                  title={isFr ? "Courses" : "Grocery"}
                  icon={<FaShoppingCart />}
                />

                <DashboardCard
                  href="/pharmacy"
                  title={isFr ? "Pharmacie" : "Pharmacy"}
                  icon={<FaPills />}
                />

                <DashboardCard
                  href="/pay-school-fees"
                  title={isFr ? "Frais scolaires" : "School Fees"}
                  icon={<FaGraduationCap />}
                />

                <DashboardCard
                  href="/pay-electricity"
                  title={isFr ? "Électricité" : "Electricity"}
                  icon={<FaBolt />}
                />

                <DashboardCard
                  href="/pay-tv"
                  title={isFr ? "Abonnement TV" : "TV Subscription"}
                  icon={<FaTv />}
                />

                <DashboardCard
                  href="/beneficiaries"
                  title={isFr ? "Bénéficiaires" : "Beneficiaries"}
                  icon={<FaUsers />}
                />

                <DashboardCard
                  href="/my-orders"
                  title={isFr ? "Suivi des commandes" : "Order Tracking"}
                  icon={<FaTruck />}
                />

                <DashboardCard
                  href="/reports"
                  title={isFr ? "Rapports" : "Reports"}
                  icon={<FaReceipt />}
                />

                <DashboardCard
                  href="/notifications"
                  title={isFr ? "Notifications" : "Notifications"}
                  icon={<FaBell />}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6">
                {isFr ? "Activité récente" : "Recent Activity"}
              </h2>

              {recentActivity.length === 0 ? (
                <p className="text-gray-500">
                  {isFr ? "Aucune activité récente." : "No recent activity."}
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item) => {
                    const isDeposit =
                      item.transaction_type === "Deposit";

                    return (
                      <div key={item.id} className="border-b pb-3">
                        <div className="flex justify-between gap-4">
                          <p className="font-semibold">
                            {item.transaction_type}
                          </p>

                          <p
                            className={`font-bold ${
                              isDeposit
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {isDeposit ? "+" : "-"}$
                            {Number(item.amount).toFixed(2)}
                          </p>
                        </div>

                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>

                        <p className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href="/activity"
                className="mt-6 inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold"
              >
                {isFr ? "Voir toute l'activité" : "View All Activity"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-medium">{title}</p>
          <h2 className="text-4xl font-bold mt-2">{value}</h2>
        </div>

        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-gray-50 rounded-2xl p-5 hover:bg-green-50 hover:shadow-lg transition"
    >
      <div className="text-3xl text-green-700 mb-3">{icon}</div>

      <h3 className="font-bold text-base">{title}</h3>
    </Link>
  );
}