import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paychangu";
import { db } from "@/db";
import { transactions, wallets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const txRef = request.nextUrl.searchParams.get("tx_ref");
    if (!txRef) return NextResponse.json({ error: "tx_ref required" }, { status: 400 });

    const result = await verifyTransaction(txRef);

    if (result.status === "success" && result.data) {
      const isVerified = result.data.status === "success";

      // If verified, credit wallet if not already done
      if (isVerified) {
        const [tx] = await db.select().from(transactions).where(eq(transactions.txRef, txRef)).limit(1);
        if (tx && tx.status === "pending") {
          const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, tx.accountId)).limit(1);
          if (wallet) {
            await db.update(wallets).set({ balance: wallet.balance + tx.amount }).where(eq(wallets.id, wallet.id));
            await db.update(transactions).set({ status: "success" }).where(eq(transactions.id, tx.id));
          }
        }
      }

      return NextResponse.json({
        success: true,
        verified: isVerified,
        data: { txRef: result.data.tx_ref, amount: result.data.amount, status: result.data.status },
      });
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
