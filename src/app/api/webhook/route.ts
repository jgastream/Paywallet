import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSignature, verifyTransaction } from "@/lib/paychangu";
import { db } from "@/db";
import { transactions, wallets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("Signature") || request.headers.get("signature");

    if (signature) {
      const isValid = validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const { event_type, status, tx_ref, amount } = body;
    console.log("Webhook:", { event_type, status, tx_ref, amount });

    if (event_type === "checkout.payment" && status === "success" && tx_ref) {
      // Verify with PayChangu
      const verification = await verifyTransaction(tx_ref);
      if (verification.status === "success" && verification.data?.status === "success") {
        // Find the pending transaction
        const [tx] = await db.select().from(transactions).where(eq(transactions.txRef, tx_ref)).limit(1);
        if (tx && tx.status === "pending") {
          // Credit wallet
          const [wallet] = await db.select().from(wallets).where(eq(wallets.accountId, tx.accountId)).limit(1);
          if (wallet) {
            await db.update(wallets).set({ balance: wallet.balance + tx.amount }).where(eq(wallets.id, wallet.id));
            await db.update(transactions).set({ status: "success" }).where(eq(transactions.id, tx.id));
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
