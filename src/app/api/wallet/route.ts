import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, wallets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET — fetch wallet + transactions for an account
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key || key.length !== 9) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.secretKey, key)).limit(1);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, account.id)).limit(1);
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Auto-unlock expired locks
    if (wallet.lockedUntil && wallet.lockedUntil < new Date()) {
      await db
        .update(wallets)
        .set({ balance: wallet.balance + wallet.lockedBalance, lockedBalance: 0, lockedUntil: null })
        .where(eq(wallets.id, wallet.id));
      wallet.balance = wallet.balance + wallet.lockedBalance;
      wallet.lockedBalance = 0;
      wallet.lockedUntil = null;
    }

    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, account.id))
      .orderBy(transactions.createdAt);

    return NextResponse.json({
      wallet: {
        balance: wallet.balance,
        lockedBalance: wallet.lockedBalance,
        lockedUntil: wallet.lockedUntil?.toISOString() || null,
      },
      transactions: txs.reverse().map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        txRef: t.txRef,
        meta: t.meta,
        isLocked: t.isLocked,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Wallet GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
