"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const handleDeposit = async () => {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !email || !key) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: v, email, secretKey: key }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Deposit Funds</h1>
        <p className="text-gray-500 mb-8">Add funds via PayChangu — Mobile Money, Card, or Bank Transfer.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (MWK)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min="100"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex flex-wrap gap-2 mt-3">
              {[1000, 5000, 10000, 25000, 50000].map((a) => (
                <button key={a} onClick={() => setAmount(a.toString())}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${amount === a.toString() ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (for receipt)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">{error}</div>}

          <button onClick={handleDeposit} disabled={loading || !amount || !email}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting...</>
              : "Deposit via PayChangu"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
