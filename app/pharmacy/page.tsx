"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function PharmacyPage() {
  const [balance, setBalance] = useState(0);

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState("");

  const [selectedMedicine, setSelectedMedicine] =
    useState("");

  const [quantity, setQuantity] = useState(1);

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
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (wallet) {
      setBalance(Number(wallet.balance));
    }

    const { data: ben } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("user_id", session.user.id);

    setBeneficiaries(ben || []);

    const { data: meds } = await supabase
      .from("medicines")
      .select("*");

    setMedicines(meds || []);
  };

  const handleOrder = async () => {
    const medicine = medicines.find(
      (m) => m.id === selectedMedicine
    );

    if (!medicine) {
      alert("Select a medicine");
      return;
    }

    const total =
      Number(medicine.price) * quantity;

    if (total > balance) {
      alert("Insufficient wallet balance");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const newBalance = balance - total;

    await supabase
      .from("wallets")
      .update({
        balance: newBalance,
      })
      .eq("user_id", session.user.id);

    await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: session.user.id,
          transaction_type: "Pharmacy",
          amount: total,
          currency: "USD",
          description:
            "Medicine purchase",
        },
      ]);

    await supabase
      .from("pharmacy_orders")
      .insert([
        {
          user_id: session.user.id,
          beneficiary_id:
            selectedBeneficiary,
          medicine_name:
            medicine.name,
          quantity,
          amount: total,
          status: "Pending",
        },
      ]);

    alert(
      "Medicine order submitted successfully"
    );

    loadData();
  };

  const selectedMed =
    medicines.find(
      (m) => m.id === selectedMedicine
    );

  const total =
    selectedMed
      ? Number(selectedMed.price) *
        quantity
      : 0;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-8">

          <h1 className="text-4xl font-bold text-green-700 mb-8">
            💊 Pharmacy
          </h1>

          <div className="bg-green-50 rounded-2xl p-6 mb-8">

            <p>Available Balance</p>

            <h2 className="text-5xl font-bold text-green-700">
              ${balance.toFixed(2)}
            </h2>

          </div>

          <select
            value={selectedBeneficiary}
            onChange={(e) =>
              setSelectedBeneficiary(
                e.target.value
              )
            }
            className="w-full border p-4 rounded-xl mb-4"
          >
            <option value="">
              Select Beneficiary
            </option>

            {beneficiaries.map((b) => (
              <option
                key={b.id}
                value={b.id}
              >
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMedicine}
            onChange={(e) =>
              setSelectedMedicine(
                e.target.value
              )
            }
            className="w-full border p-4 rounded-xl mb-4"
          >
            <option value="">
              Select Medicine
            </option>

            {medicines.map((m) => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.name} - ${m.price}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Number(e.target.value)
              )
            }
            className="w-full border p-4 rounded-xl mb-6"
          />

          <div className="bg-gray-50 rounded-xl p-6 mb-6">

            <h3 className="text-2xl font-bold">
              Total: ${total.toFixed(2)}
            </h3>

          </div>

          <button
            onClick={handleOrder}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl"
          >
            Buy Medicine
          </button>

        </div>

      </div>
    </>
  );
}