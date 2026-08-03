import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, wallets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

const RATES: Record<string, number> = {
  MWK_USD: 4300, MWK_ZAR: 88, MWK_KES: 12.7,
  MWK_NGN: 1000, MWK_GBP: 2080, MWK_EUR: 5000,
};

function getRate(from: string, to: string): number | null {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  const rev = `${to}_${from}`;
  if (RATES[key]) return RATES[key];
  if (RATES[rev]) return 1 / RATES[rev];
  if (from !== "MWK" && to !== "MWK") {
    const f = RATES[`MWK_${from}`];
    const t = RATES[`MWK_${to}`];
    if (f && t) return f / t;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { secretKey, amount, from, to } = await request.json();

    if (!secretKey || secretKey.length !== 9) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const rate = getRate(from, to);
    if (rate === null) {
      return NextResponse.json({ error: "Unsupported currency pair" }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.secretKey, secretKey)).limit(1);
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, account.id)).limit(1);
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    // Calculate MWK cost
    const mwkCost = from === "MWK" ? Math.round(amount) : Math.ceil(amount * rate);
    const fee = Math.ceil(mwkCost * 0.01);
    const totalCost = mwkCost + fee;

    if (wallet.balance < totalCost) {
      return NextResponse.json({ error: "Insufficient MWK balance" }, { status: 400 });
    }

    const netResult = from === "MWK"
      ? Math.floor((amount - amount * 0.01) * rate)
      : Math.floor(amount * 0.99);

    await db
      .update(wallets)
      .set({ balance: wallet.balance - totalCost })
      .where(eq(wallets.id, wallet.id));

    await db.insert(transactions).values({
      accountId: account.id,
      type: "swap",
      amount: Math.round(amount),
      currency: from,
      status: "success",
      txRef: `swap-${Date.now()}`,
      meta: { from, to, rate, fee, netResult, totalCost },
    });

    return NextResponse.json({ success: true, netResult, fee, rate, totalCost });
  } catch (error) {
    console.error("Swap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
