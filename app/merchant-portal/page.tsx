"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function MerchantPortalPage() {
  const { language } = useLanguage();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: merchantsData } = await supabase
      .from("merchants")
      .select("*")
      .order("name");

    setMerchants(merchantsData || []);

    const { data: ordersData } = await supabase
      .from("merchant_orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setOrders(ordersData || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Delivered":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-7xl mx-auto">

          {/* Header */}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

            <h1 className="text-4xl font-bold text-green-700 mb-3">
              🏪
              {language === "fr"
                ? " Portail Marchand"
                : " Merchant Portal"}
            </h1>

            <p className="text-gray-600">
              {language === "fr"
                ? "Gestion des commerçants et commandes."
                : "Manage merchants and service orders."}
            </p>

          </div>

          {/* Merchants */}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

            <h2 className="text-2xl font-bold mb-6">

              {language === "fr"
                ? "Commerçants"
                : "Merchants"}

            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {merchants.length === 0 ? (
                <p className="text-gray-500">
                  {language === "fr"
                    ? "Aucun commerçant enregistré."
                    : "No merchants found."}
                </p>
              ) : (
                merchants.map((merchant) => (
                  <div
                    key={merchant.id}
                    className="border rounded-2xl p-6 bg-gray-50"
                  >
                    <h3 className="text-xl font-bold text-green-700">
                      {merchant.name}
                    </h3>

                    <p className="text-gray-600 mt-2">
                      {merchant.merchant_type}
                    </p>

                    <p className="text-gray-500 text-sm mt-2">
                      {merchant.country}
                    </p>

                    <div className="mt-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          merchant.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {merchant.is_active
                          ? language === "fr"
                            ? "Actif"
                            : "Active"
                          : language === "fr"
                          ? "Inactif"
                          : "Inactive"}
                      </span>

                    </div>

                  </div>
                ))
              )}

            </div>

          </div>

          {/* Orders */}

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <h2 className="text-2xl font-bold mb-6">

              {language === "fr"
                ? "Commandes"
                : "Orders"}

            </h2>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="bg-green-700 text-white">

                    <th className="p-4 text-left">
                      ID
                    </th>

                    <th className="p-4 text-left">
                      {language === "fr"
                        ? "Service"
                        : "Service"}
                    </th>

                    <th className="p-4 text-left">
                      {language === "fr"
                        ? "Montant"
                        : "Amount"}
                    </th>

                    <th className="p-4 text-left">
                      {language === "fr"
                        ? "Statut"
                        : "Status"}
                    </th>

                    <th className="p-4 text-left">
                      {language === "fr"
                        ? "Date"
                        : "Date"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-gray-500"
                      >
                        {language === "fr"
                          ? "Aucune commande."
                          : "No orders found."}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b"
                      >
                        <td className="p-4">
                          {order.id.slice(0, 8)}
                        </td>

                        <td className="p-4">
                          {order.service_type}
                        </td>

                        <td className="p-4">
                          $
                          {Number(
                            order.amount
                          ).toFixed(2)}
                        </td>

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>

                        </td>

                        <td className="p-4">
                          {new Date(
                            order.created_at
                          ).toLocaleDateString()}
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}