"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function Content() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = sp.get("status");
    const txRef = sp.get("tx_ref");
    const key = sp.get("key");

    if (s === "successful" || s === "success") {
      setStatus("success");
      setMsg("Payment confirmed. Your wallet has been credited.");
      if (txRef && key) {
        fetch(`/api/verify?tx_ref=${txRef}`).then(() => {
          if (key) window.location.href = "/dashboard";
        });
      }
    } else if (s === "failed") {
      setStatus("failed");
      setMsg("Payment was not completed.");
    } else if (txRef) {
      fetch(`/api/verify?tx_ref=${txRef}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.verified) { setStatus("success"); setMsg("Payment confirmed."); }
          else { setStatus("failed"); setMsg("Could not verify payment."); }
          setTimeout(() => router.replace("/dashboard"), 2000);
        })
        .catch(() => { setStatus("failed"); setMsg("Verification failed."); });
    } else {
      setStatus("failed");
      setMsg("No transaction reference.");
    }
  }, [sp, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
        {status === "loading" && (
          <><div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h1></>
        )}
        {status === "success" && (
          <><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div><h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit Successful!</h1><p className="text-gray-500">{msg}</p></>
        )}
        {status === "failed" && (
          <><div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </div><h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit Failed</h1><p className="text-gray-500 mb-6">{msg}</p></>
        )}
        <Link href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors mt-4">
          Back to Wallet
        </Link>
      </div>
    </div>
  );
}

export default function DepositResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <Content />
    </Suspense>
  );
}
