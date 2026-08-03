"use client";

import { useState, useEffect, useCallback } from "react";
import Shell, { formatMWK, type WalletInfo, type Tx } from "@/components/Shell";
import { getSecretKey } from "@/lib/auth";
import Link from "next/link";

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const key = typeof window !== "undefined" ? getSecretKey() : null;

  const load = useCallback(async () => {
    if (!key) return;
    const res = await fetch(`/api/wallet?key=${key}`);
    const d = await res.json();
    if (d.wallet) setWallet(d.wallet);
    if (d.transactions) setTxs(d.transactions);
  }, [key]);

  useEffect(() => { load(); }, [load]);

  if (!wallet) return <Shell><div /></Shell>;

  const totalDeposits = txs.filter((t) => t.type === "deposit" && t.status === "success").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = txs.filter((t) => t.type === "withdrawal" && t.status === "success").reduce((s, t) => s + t.amount, 0);

  const timeLeft = () => {
    if (!wallet.lockedUntil) return null;
    const end = new Date(wallet.lockedUntil);
    if (end < new Date()) return "Expired";
    const days = Math.floor((end.getTime() - Date.now()) / 86400000);
    const months = Math.floor(days / 30);
    return months > 0 ? `${months}m ${days % 30}d left` : `${days}d left`;
  };

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        {/* Balance */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Available Balance</p>
              <p className="text-4xl md:text-5xl font-extrabold">{formatMWK(wallet.balance)}</p>
              {wallet.lockedBalance > 0 && (
                <p className="text-white/70 text-sm mt-2">🔒 Locked: {formatMWK(wallet.lockedBalance)} {timeLeft() && `(${timeLeft()})`}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/deposit" className="bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">Deposit</Link>
              <Link href="/withdraw" className="bg-white/15 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/25 transition-colors border border-white/20 text-sm">Withdraw</Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Available" value={formatMWK(wallet.balance)} emoji="💰" />
          <Stat label="Locked" value={formatMWK(wallet.lockedBalance)} emoji="🔒" />
          <Stat label="Deposited" value={formatMWK(totalDeposits)} emoji="📥" accent="text-green-600" />
          <Stat label="Withdrawn" value={formatMWK(totalWithdrawals)} emoji="📤" accent="text-rose-600" />
        </div>

        {/* Quick actions */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Action href="/deposit" label="Deposit" color="bg-green-50 text-green-700 hover:bg-green-100" icon="M12 4v16m8-8H4" />
          <Action href="/withdraw" label="Withdraw" color="bg-rose-50 text-rose-700 hover:bg-rose-100" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          <Action href="/lock" label="Lock" color="bg-amber-50 text-amber-700 hover:bg-amber-100" icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          <Action href="/swap" label="Swap" color="bg-purple-50 text-purple-700 hover:bg-purple-100" icon="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </div>

        {/* Recent */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          {txs.length > 0 && <Link href="/history" className="text-sm text-indigo-600 font-medium hover:underline">View All →</Link>}
        </div>

        {txs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-400 mb-4">No transactions yet</p>
            <Link href="/deposit" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">Make a Deposit</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {txs.slice(0, 5).map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value, emoji, accent }: { label: string; value: string; emoji: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1"><span>{emoji}</span><span className="text-xs text-gray-500">{label}</span></div>
      <p className={`text-lg font-bold ${accent || "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function Action({ href, label, color, icon }: { href: string; label: string; color: string; icon: string }) {
  return (
    <Link href={href} className={`${color} rounded-2xl p-5 text-center font-semibold transition-colors group`}>
      <svg className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </Link>
  );
}

const colors: Record<string, string> = { deposit: "bg-green-100 text-green-700", withdrawal: "bg-rose-100 text-rose-700", lock: "bg-amber-100 text-amber-700", swap: "bg-purple-100 text-purple-700" };

function TxRow({ tx }: { tx: Tx }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${colors[tx.type] || "bg-gray-100 text-gray-700"}`}>
        {tx.type[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 capitalize">{tx.type}</p>
        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
      <p className={`text-sm font-bold ${tx.type === "deposit" ? "text-green-600" : tx.type === "withdrawal" ? "text-rose-600" : "text-gray-900"}`}>
        {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "−" : ""}{formatMWK(tx.amount)}
      </p>
    </div>
  );
}
