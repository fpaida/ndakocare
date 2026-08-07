"use client";

import Navbar from "../components/Navbar";
import AdminGuard from "../components/AdminGuard";

import PageHeader from "../components/ui/PageHeader";
import QuickActionCard from "../components/ui/QuickActionCard";

import DashboardStats from "./components/DashboardStats";
import RecentActivity from "./components/RecentActivity";

export default function AdminPage() {
  return (
    <AdminGuard>
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-7xl mx-auto">

            {/* Header */}

            <PageHeader
              title="NdakoCare Admin Center"
              description="Manage users, wallets, transfers, grocery orders, pharmacy, school fees, electricity, TV subscriptions, merchants, notifications and reports."
            />

            {/* Statistics */}

            <DashboardStats />

            {/* Quick Actions */}

            <section className="mb-12">

              <h2 className="text-2xl font-bold mb-6">
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                <QuickActionCard
                  href="/admin/transfers"
                  title="Transfers"
                  description="Approve and manage transfer requests."
                  icon="💵"
                  color="text-green-700"
                />

                <QuickActionCard
                  href="/admin/recharges"
                  title="Mobile Recharges"
                  description="Review customer mobile top-ups."
                  icon="📱"
                  color="text-blue-700"
                />

                <QuickActionCard
                  href="/admin/requests"
                  title="Money Requests"
                  description="Manage financial assistance requests."
                  icon="🙏"
                  color="text-orange-700"
                />

                <QuickActionCard
                  href="/admin/orders"
                  title="Grocery Orders"
                  description="View and process grocery orders."
                  icon="🛒"
                  color="text-purple-700"
                />

                <QuickActionCard
                  href="/admin/pharmacy-orders"
                  title="Pharmacy"
                  description="Manage medication orders."
                  icon="💊"
                  color="text-pink-600"
                />

                <QuickActionCard
                  href="/admin/school-payments"
                  title="School Fees"
                  description="Review school fee payments."
                  icon="🎓"
                  color="text-indigo-600"
                />

                <QuickActionCard
                  href="/admin/electricity-payments"
                  title="Electricity"
                  description="Manage electricity bill payments."
                  icon="⚡"
                  color="text-yellow-600"
                />

                <QuickActionCard
                  href="/admin/tv-payments"
                  title="TV Payments"
                  description="Manage TV subscription payments."
                  icon="📺"
                  color="text-red-600"
                />

              </div>

            </section>

            {/* Recent Activity */}

            <RecentActivity />

            {/* Coming Soon */}

            <section className="mt-12">

              <h2 className="text-2xl font-bold mb-6">
                Platform Management
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                  <h3 className="text-xl font-bold mb-3">
                    👥 User Management
                  </h3>

                  <p className="text-gray-600">
                    Create, edit, suspend and manage user accounts and permissions.
                  </p>

                </div>

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                  <h3 className="text-xl font-bold mb-3">
                    📊 Reports & Analytics
                  </h3>

                  <p className="text-gray-600">
                    Track transactions, business growth, revenue and platform activity.
                  </p>

                </div>

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                  <h3 className="text-xl font-bold mb-3">
                    🌍 Countries & Providers
                  </h3>

                  <p className="text-gray-600">
                    Configure countries, telecom operators, utility providers and payment services.
                  </p>

                </div>

              </div>

            </section>

          </div>
        </main>
      </>
    </AdminGuard>
  );
}