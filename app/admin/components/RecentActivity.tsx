"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Activity = {
  type: string;
  title: string;
  date: string;
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  async function loadRecentActivity() {
    setLoading(true);

    const [
      transfers,
      grocery,
      pharmacy,
      school,
      electricity,
      recharge,
    ] = await Promise.all([
      supabase
        .from("transfers")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("grocery_orders")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("pharmacy_orders")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("school_payments")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("electricity_payments")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("mobile_recharges")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const items: Activity[] = [];

    transfers.data?.forEach((item) =>
      items.push({
        type: "💵",
        title: "Transfer",
        date: item.created_at,
      })
    );

    grocery.data?.forEach((item) =>
      items.push({
        type: "🛒",
        title: "Grocery Order",
        date: item.created_at,
      })
    );

    pharmacy.data?.forEach((item) =>
      items.push({
        type: "💊",
        title: "Pharmacy Order",
        date: item.created_at,
      })
    );

    school.data?.forEach((item) =>
      items.push({
        type: "🎓",
        title: "School Payment",
        date: item.created_at,
      })
    );

    electricity.data?.forEach((item) =>
      items.push({
        type: "⚡",
        title: "Electricity Payment",
        date: item.created_at,
      })
    );

    recharge.data?.forEach((item) =>
      items.push({
        type: "📱",
        title: "Mobile Recharge",
        date: item.created_at,
      })
    );

    items.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

    setActivities(items.slice(0, 10));

    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mt-10">

      <h2 className="text-2xl font-bold mb-6">
        Recent Activity
      </h2>

      {loading ? (
        <p className="text-gray-500">
          Loading...
        </p>
      ) : activities.length === 0 ? (
        <p className="text-gray-500">
          No recent activity.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b pb-3"
            >
              <div>
                <div className="font-semibold">
                  {activity.type} {activity.title}
                </div>

                <div className="text-sm text-gray-500">
                  {new Date(activity.date).toLocaleString()}
                </div>
              </div>

              <span className="text-green-600 font-semibold">
                New
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}