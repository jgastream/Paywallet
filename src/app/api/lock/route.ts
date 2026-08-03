import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, wallets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { secretKey, amount, months } = await request.json();

    if (!secretKey || secretKey.length !== 9) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    if (!amount || amount <= 0 || !months || months <= 0) {
      return NextResponse.json({ error: "Invalid amount or duration" }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.secretKey, secretKey)).limit(1);
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, account.id)).limit(1);
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const lockUntil = new Date();
    lockUntil.setMonth(lockUntil.getMonth() + months);

    await db
      .update(wallets)
      .set({
        balance: wallet.balance - amount,
        lockedBalance: wallet.lockedBalance + amount,
        lockedUntil: lockUntil,
      })
      .where(eq(wallets.id, wallet.id));

    await db.insert(transactions).values({
      accountId: account.id,
      type: "lock",
      amount,
      currency: "MWK",
      status: "success",
      txRef: `lock-${Date.now()}`,
      isLocked: true,
      meta: { lockUntil: lockUntil.toISOString(), months },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
