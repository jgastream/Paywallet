import { NextRequest, NextResponse } from "next/server";
import { initiateMobileMoneyPayout, generateTxRef } from "@/lib/paychangu";
import { db } from "@/db";
import { accounts, wallets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { amount, mobile, network, secretKey } = await request.json();

    if (!secretKey || secretKey.length !== 9) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!mobile) {
      return NextResponse.json({ error: "Mobile number required" }, { status: 400 });
    }
    if (!network) {
      return NextResponse.json({ error: "Network required" }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.secretKey, secretKey)).limit(1);
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, account.id)).limit(1);
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const chargeId = generateTxRef("wth");

    const result = await initiateMobileMoneyPayout({
      amount: Math.round(amount),
      mobile,
      network,
      chargeId,
    });

    // Deduct from wallet regardless of PayChangu response (payout is initiated)
    await db
      .update(wallets)
      .set({ balance: wallet.balance - amount })
      .where(eq(wallets.id, wallet.id));

    const status = result.status === "success" ? "pending" : "failed";

    await db.insert(transactions).values({
      accountId: account.id,
      type: "withdrawal",
      amount: Math.round(amount),
      currency: "MWK",
      status,
      chargeId,
      meta: { mobile, network, paychanguResponse: result },
    });

    if (result.status === "success") {
      return NextResponse.json({ success: true, chargeId, status: result.data.transaction.status });
    }

    return NextResponse.json({ error: result.message || "Withdrawal failed" }, { status: 400 });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
