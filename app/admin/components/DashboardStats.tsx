"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import StatCard from "../../components/ui/StatCard";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    users: 0,
    transfers: 0,
    recharges: 0,
    requests: 0,
    grocery: 0,
    pharmacy: 0,
    school: 0,
    electricity: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    const [
      users,
      transfers,
      recharges,
      requests,
      grocery,
      pharmacy,
      school,
      electricity,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("transfers").select("*", { count: "exact", head: true }),
      supabase
        .from("mobile_recharges")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("money_requests")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("grocery_orders")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("pharmacy_orders")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("school_payments")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("electricity_payments")
        .select("*", { count: "exact", head: true }),
    ]);

    setStats({
      users: users.count ?? 0,
      transfers: transfers.count ?? 0,
      recharges: recharges.count ?? 0,
      requests: requests.count ?? 0,
      grocery: grocery.count ?? 0,
      pharmacy: pharmacy.count ?? 0,
      school: school.count ?? 0,
      electricity: electricity.count ?? 0,
    });

    setLoading(false);
  }

  const value = (number: number) =>
    loading ? "..." : number;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

      <StatCard
        title="Users"
        value={value(stats.users)}
        icon="👥"
        color="text-indigo-600"
      />

      <StatCard
        title="Transfers"
        value={value(stats.transfers)}
        icon="💵"
        color="text-green-700"
      />

      <StatCard
        title="Recharges"
        value={value(stats.recharges)}
        icon="📱"
        color="text-blue-600"
      />

      <StatCard
        title="Money Requests"
        value={value(stats.requests)}
        icon="🙏"
        color="text-orange-600"
      />

      <StatCard
        title="Grocery Orders"
        value={value(stats.grocery)}
        icon="🛒"
        color="text-purple-600"
      />

      <StatCard
        title="Pharmacy Orders"
        value={value(stats.pharmacy)}
        icon="💊"
        color="text-pink-600"
      />

      <StatCard
        title="School Payments"
        value={value(stats.school)}
        icon="🎓"
        color="text-indigo-700"
      />

      <StatCard
        title="Electricity"
        value={value(stats.electricity)}
        icon="⚡"
        color="text-yellow-600"
      />

    </div>
  );
}