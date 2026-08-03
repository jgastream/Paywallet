"use client";

import { useState, useEffect, useCallback } from "react";
import Shell, { formatMWK } from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";

const CURS = [
  { c: "MWK", f: "🇲🇼" }, { c: "USD", f: "🇺🇸" }, { c: "ZAR", f: "🇿🇦" },
  { c: "GBP", f: "🇬🇧" }, { c: "EUR", f: "🇪🇺" }, { c: "KES", f: "🇰🇪" },
];

interface RateInfo { rate: number; netResult: number; fee: number; }

export default function SwapPage() {
  const [from, setFrom] = useState("MWK");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const fetchRate = useCallback(async () => {
    const v = parseFloat(amount);
    if (!v || v <= 0) { setRateInfo(null); return; }
    try {
      const res = await fetch(`/api/swap-rate?from=${from}&to=${to}&amount=${v}`);
      const d = await res.json();
      setRateInfo(d.success ? d : null);
    } catch { setRateInfo(null); }
  }, [amount, from, to]);

  useEffect(() => { const t = setTimeout(fetchRate, 400); return () => clearTimeout(t); }, [fetchRate]);

  const handleSwap = async () => {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !rateInfo || !key) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: key, amount: v, from, to }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Swapped → ${data.netResult.toLocaleString()} ${to}`);
        setAmount("");
        setRateInfo(null);
      } else {
        setError(data.error || "Failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reverse = () => { const t = from; setFrom(to); setTo(t); setAmount(""); setRateInfo(null); };

  return (
    <Shell>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Swap Currencies</h1>
        <p className="text-gray-500 mb-8">Exchange currencies at competitive rates. 1% fee applies.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">You Send</label>
            <div className="flex gap-3">
              <select value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value === to) setTo(from); setAmount(""); }}
                className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
                {CURS.map((c) => <option key={c.c} value={c.c}>{c.f} {c.c}</option>)}
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-semibold text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div className="flex justify-center py-3">
            <button onClick={reverse} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2.5 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">You Receive</label>
            <select value={to} onChange={(e) => { setTo(e.target.value); setAmount(""); }}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
              {CURS.filter((c) => c.c !== from).map((c) => <option key={c.c} value={c.c}>{c.f} {c.c}</option>)}
            </select>
          </div>

          {rateInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-semibold">1 {from} = {rateInfo.rate.toFixed(4)} {to}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">You Send</span><span className="font-semibold">{parseFloat(amount).toLocaleString()} {from}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee (1%)</span><span className="text-rose-600 font-semibold">−{rateInfo.fee.toLocaleString(undefined, { maximumFractionDigits: 4 })} {from}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between"><span className="font-medium">You Receive</span><span className="text-green-600 font-bold text-base">{rateInfo.netResult.toLocaleString(undefined, { maximumFractionDigits: 4 })} {to}</span></div>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">{success}</div>}

          <button onClick={handleSwap} disabled={loading || !amount || !rateInfo}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
            Swap Currencies
          </button>
        </div>
      </div>
    </Shell>
  );
}
