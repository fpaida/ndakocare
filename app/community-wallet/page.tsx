"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

export default function CommunityWalletPage() {
  const { language } = useLanguage();

  const [walletBalance, setWalletBalance] = useState(0);

  const [communities, setCommunities] = useState<any[]>([]);

  const [communityName, setCommunityName] =
    useState("");

  const [description, setDescription] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    if (wallet) {
      setWalletBalance(Number(wallet.balance));
    }

    const { data: communitiesData } =
      await supabase
        .from("community_wallets")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", {
          ascending: false,
        });

    setCommunities(communitiesData || []);
  };

  const createCommunity = async () => {
    if (!communityName) {
      alert(
        language === "fr"
          ? "Nom requis"
          : "Community name required"
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    await supabase
      .from("community_wallets")
      .insert([
        {
          owner_id: session.user.id,
          name: communityName,
          description,
          balance: 0,
        },
      ]);

    setCommunityName("");
    setDescription("");

    loadData();
  };

  const contribute = async (
    communityId: string,
    amount: number
  ) => {
    if (walletBalance < amount) {
      alert(
        language === "fr"
          ? "Solde insuffisant"
          : "Insufficient wallet balance"
      );
      return;
    }

    const community =
      communities.find(
        (c) => c.id === communityId
      );

    if (!community) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const newWalletBalance =
      walletBalance - amount;

    // Update user wallet
    await supabase
      .from("wallets")
      .update({
        balance: newWalletBalance,
      })
      .eq("user_id", session.user.id);

    // Update community balance
    await supabase
      .from("community_wallets")
      .update({
        balance:
          Number(community.balance) +
          amount,
      })
      .eq("id", communityId);

    // Save contribution
    await supabase
      .from("community_contributions")
      .insert([
        {
          wallet_id: communityId,
          user_id: session.user.id,
          amount,
        },
      ]);

    // Activity Center
    await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: session.user.id,
          transaction_type:
            "Community Contribution",
          amount,
          currency: "USD",
          description:
            `Contribution to ${community.name}`,
        },
      ]);

    // Notification
    await supabase
      .from("notifications")
      .insert([
        {
          user_id: session.user.id,
          title:
            language === "fr"
              ? "Contribution réussie"
              : "Contribution Successful",

          message:
            language === "fr"
              ? `${amount}$ ajouté à ${community.name}`
              : `$${amount} contributed to ${community.name}`,
        },
      ]);

    alert(
      language === "fr"
        ? "Contribution effectuée"
        : "Contribution completed"
    );

    loadData();
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-6xl mx-auto">

          {/* Header */}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

            <h1 className="text-4xl font-bold text-green-700 mb-4">
              🌍 Community Wallet
            </h1>

            <p className="text-gray-600">
              {language === "fr"
                ? "Gérez vos communautés et contributions."
                : "Manage your communities and contributions."}
            </p>

            <div className="mt-4 text-2xl font-bold text-green-700">
              Wallet Balance:
              ${walletBalance.toFixed(2)}
            </div>

          </div>

          {/* Create Community */}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

            <h2 className="text-2xl font-bold mb-4">
              {language === "fr"
                ? "Créer une Communauté"
                : "Create Community"}
            </h2>

            <input
              type="text"
              placeholder={
                language === "fr"
                  ? "Nom de la communauté"
                  : "Community Name"
              }
              value={communityName}
              onChange={(e) =>
                setCommunityName(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl mb-4"
            />

            <textarea
              placeholder={
                language === "fr"
                  ? "Description"
                  : "Description"
              }
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl mb-4"
            />

            <button
              onClick={createCommunity}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {language === "fr"
                ? "Créer"
                : "Create"}
            </button>

          </div>

          {/* Communities */}

          <div className="grid md:grid-cols-2 gap-6">

            {communities.map(
              (community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-3xl shadow-lg p-6"
                >
                  <h3 className="text-2xl font-bold text-green-700">
                    {community.name}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    {
                      community.description
                    }
                  </p>

                  <div className="mt-4 text-3xl font-bold">
                    $
                    {Number(
                      community.balance
                    ).toFixed(2)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">

                    <button
                      onClick={() =>
                        contribute(
                          community.id,
                          10
                        )
                      }
                      className="bg-green-600 text-white p-3 rounded-xl"
                    >
                      +$10
                    </button>

                    <button
                      onClick={() =>
                        contribute(
                          community.id,
                          25
                        )
                      }
                      className="bg-blue-600 text-white p-3 rounded-xl"
                    >
                      +$25
                    </button>

                    <button
                      onClick={() =>
                        contribute(
                          community.id,
                          50
                        )
                      }
                      className="bg-purple-600 text-white p-3 rounded-xl"
                    >
                      +$50
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </div>
    </>
  );
}