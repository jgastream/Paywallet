"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getSecretKey, clearSecretKey } from "@/lib/auth";

export interface WalletInfo {
  balance: number;
  lockedBalance: number;
  lockedUntil: string | null;
}

export interface Tx {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  txRef: string | null;
  meta: Record<string, unknown> | null;
  isLocked: boolean | null;
  createdAt: string;
}

export function formatMWK(n: number) {
  return `MWK ${n.toLocaleString()}`;
}

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [key, setKey] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const k = getSecretKey();
    if (!k) { router.replace("/"); return; }
    setKey(k);
  }, [router]);

  const fetchWallet = useCallback(async () => {
    if (!key) return;
    try {
      const res = await fetch(`/api/wallet?key=${key}`);
      const data = await res.json();
      if (data.wallet) setWallet(data.wallet);
    } catch { /* retry later */ }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    fetchWallet().then(() => setLoading(false));
    const id = setInterval(fetchWallet, 10000);
    return () => clearInterval(id);
  }, [key, fetchWallet]);

  const logout = () => {
    clearSecretKey();
    router.replace("/");
  };

  if (!key) return null;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/deposit", label: "Deposit", icon: "M12 4v16m8-8H4" },
    { href: "/withdraw", label: "Withdraw", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
    { href: "/lock", label: "Lock", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { href: "/swap", label: "Swap", icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" },
    { href: "/history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">PayWallet</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {wallet && (
              <div className="hidden sm:block text-right">
                <div className="text-xs text-gray-500">Balance</div>
                <div className="text-sm font-bold text-gray-900">{formatMWK(wallet.balance)}</div>
              </div>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-gray-600"}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-40 bg-gray-200 rounded-2xl" />
              <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
              <div className="h-64 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        PayWallet &middot; Powered by PayChangu
      </footer>
    </div>
  );
}
