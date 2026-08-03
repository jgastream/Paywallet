"use client";

import { useState } from "react";
import Shell, { formatMWK } from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";

export default function LockPage() {
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const options = [
    { v: "1", l: "1 Month" }, { v: "3", l: "3 Months" },
    { v: "6", l: "6 Months" }, { v: "12", l: "12 Months" },
  ];

  const handleLock = async () => {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !key) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: key, amount: v, months: parseInt(months) }),
      });
      const data = await res.json();
      if (data.success) {
        const d = new Date();
        d.setMonth(d.getMonth() + parseInt(months));
        setSuccess(`Locked until ${d.toLocaleDateString()}`);
        setAmount("");
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lock Funds</h1>
        <p className="text-gray-500 mb-8">Secure your savings for a fixed period. Locked funds cannot be withdrawn early.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount to Lock (MWK)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
            <div className="grid grid-cols-4 gap-3">
              {options.map((o) => (
                <button key={o.v} onClick={() => setMonths(o.v)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${months === o.v ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatMWK(parseFloat(amount))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{options.find((o) => o.v === months)?.l}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Unlocks On</span><span className="font-semibold">{(() => { const d = new Date(); d.setMonth(d.getMonth() + parseInt(months)); return d.toLocaleDateString(); })()}</span></div>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">{success}</div>}

          <button onClick={handleLock} disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Lock Funds
          </button>
        </div>
      </div>
    </Shell>
  );
}
