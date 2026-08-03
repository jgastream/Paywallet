"use client";

import { useState } from "react";
import Shell, { formatMWK } from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [mobile, setMobile] = useState("");
  const [network, setNetwork] = useState("airtel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const handleWithdraw = async () => {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !mobile || !key) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: v, mobile, network, secretKey: key }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Withdrawal initiated! Funds will arrive shortly.");
        setAmount("");
        setMobile("");
      } else {
        setError(data.error || "Failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Withdraw Funds</h1>
        <p className="text-gray-500 mb-8">Send money from your wallet to mobile money.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (MWK)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Network</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setNetwork("airtel")} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${network === "airtel" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                📱 Airtel Money
              </button>
              <button onClick={() => setNetwork("tnm")} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${network === "tnm" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                📱 TNM Mpamba
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0990000000"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">{success}</div>}

          <button onClick={handleWithdraw} disabled={loading || !amount || !mobile}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              : "Withdraw Funds"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
