"use client";

import { useState, useEffect, useCallback } from "react";
import Shell, { formatMWK } from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";
import Link from "next/link";

interface Tx { id: number; type: string; amount: number; currency: string; status: string; meta: Record<string, unknown> | null; createdAt: string; }

const TYPE_COLORS: Record<string, string> = { deposit: "bg-green-100 text-green-700", withdrawal: "bg-rose-100 text-rose-700", lock: "bg-amber-100 text-amber-700", swap: "bg-purple-100 text-purple-700" };
const STATUS_COLORS: Record<string, string> = { success: "bg-green-50 text-green-700", pending: "bg-amber-50 text-amber-700", failed: "bg-rose-50 text-rose-700" };

export default function HistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filter, setFilter] = useState("all");
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const load = useCallback(async () => {
    if (!key) return;
    const res = await fetch(`/api/wallet?key=${key}`);
    const d = await res.json();
    if (d.transactions) setTxs(d.transactions);
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? txs : txs.filter((t) => t.type === filter);

  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-500 mb-8">All your deposits, withdrawals, locks, and swaps.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "deposit", "withdrawal", "lock", "swap"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${filter === f ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4">No transactions found</p>
            <Link href="/deposit" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">Make a Deposit</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${TYPE_COLORS[tx.type] || "bg-gray-100"}`}>
                  {tx.type[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{tx.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status] || "bg-gray-100 text-gray-700"}`}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <p className={`text-sm font-bold ${tx.type === "deposit" ? "text-green-600" : tx.type === "withdrawal" ? "text-rose-600" : tx.type === "lock" ? "text-amber-600" : "text-purple-600"}`}>
                  {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "−" : ""}{formatMWK(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
