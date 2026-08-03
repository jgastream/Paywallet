"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSecretKey } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "login" | "create">("home");
  const [loginKey, setLoginKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/create", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.secretKey);
        setSecretKey(data.secretKey);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loginKey.length !== 9) {
      setError("Secret key must be 9 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: loginKey.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSecretKey(data.secretKey);
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid key");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">PayWallet</span>
          </div>
          <div className="text-xs text-gray-400">Powered by PayChangu</div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Your Digital<br />Wallet, Simplified.
          </h1>
          <p className="text-lg text-white/80 mb-10 max-w-lg">
            Deposit funds, lock savings, withdraw via mobile money, and swap currencies — all from one secure dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setMode("create")} className="bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
              Create Account
            </button>
            <button onClick={() => setMode("login")} className="bg-white/15 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/25 transition-colors border border-white/20">
              Login with Key
            </button>
          </div>
        </div>
      </section>

      {/* Main content area */}
      <section className="flex-1 bg-gray-50 py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          {/* HOME mode — features */}
          {mode === "home" && (
            <div className="animate-fade-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Can Do</h2>
              <div className="grid grid-cols-2 gap-4">
                <Feature icon="📥" title="Deposit" desc="Fund your wallet via PayChangu" color="bg-green-50 border-green-200" />
                <Feature icon="📤" title="Withdraw" desc="Send to Airtel or TNM" color="bg-rose-50 border-rose-200" />
                <Feature icon="🔒" title="Lock" desc="Secure savings for 1–12 months" color="bg-amber-50 border-amber-200" />
                <Feature icon="💱" title="Swap" desc="Exchange MWK for USD, ZAR, etc." color="bg-purple-50 border-purple-200" />
              </div>
            </div>
          )}

          {/* CREATE ACCOUNT */}
          {mode === "create" && (
            <div className="animate-fade-up bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your Wallet</h2>
              <p className="text-gray-500 text-sm mb-6">
                Generate a free wallet with a unique 9-character secret key. No email needed.
              </p>

              {!createdKey ? (
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Create Wallet</>
                  )}
                </button>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
                    <p className="text-sm font-semibold text-green-800 mb-3">Your Secret Key — Save This!</p>
                    <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-4 py-3">
                      <span className="text-2xl font-mono font-bold text-gray-900 tracking-widest flex-1">{createdKey}</span>
                      <button onClick={copyKey} className="text-sm text-indigo-600 font-medium hover:underline">
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      ⚠️ Write this down somewhere safe. This is your only way to access your wallet.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                  >
                    Open My Wallet →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <div className="animate-fade-up bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Your Wallet</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your 9-character secret key to log in.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secret Key</label>
                <input
                  type="text"
                  value={loginKey}
                  onChange={(e) => { setLoginKey(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="XXXXXXXXX"
                  maxLength={9}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono text-xl tracking-widest text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">{loginKey.length}/9 characters</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || loginKey.length !== 9}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                ) : "Login"}
              </button>
            </div>
          )}

          {error && mode === "home" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4 text-sm text-red-700">{error}</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} PayWallet &middot; Powered by PayChangu
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div className={`${color} border rounded-2xl p-5 text-center`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
