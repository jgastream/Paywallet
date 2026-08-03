import { NextRequest, NextResponse } from "next/server";
import { initiateCheckout, generateTxRef } from "@/lib/paychangu";
import { db } from "@/db";
import { accounts, wallets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { amount, email, secretKey } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required for payment receipt" }, { status: 400 });
    }
    if (!secretKey || secretKey.length !== 9) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 400 });
    }

    // Find account
    const [account] = await db.select().from(accounts).where(eq(accounts.secretKey, secretKey)).limit(1);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const txRef = generateTxRef("dep");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");
    const appUrl = host ? `${proto}://${host}` : "http://localhost:3000";

    const result = await initiateCheckout({
      amount: Math.round(amount),
      email,
      txRef,
      callbackUrl: `${appUrl}/api/webhook`,
      returnUrl: `${appUrl}/deposit/result?key=${secretKey}`,
      title: "Wallet Deposit",
      description: `Deposit MWK ${amount.toLocaleString()} to wallet`,
    });

    if (result.status === "success") {
      // Record pending transaction
      await db.insert(transactions).values({
        accountId: account.id,
        type: "deposit",
        amount: Math.round(amount),
        currency: "MWK",
        status: "pending",
        txRef: result.data.data.tx_ref,
        meta: { checkoutUrl: result.data.checkout_url },
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: result.data.checkout_url,
        txRef: result.data.data.tx_ref,
      });
    }

    return NextResponse.json({ error: result.message || "Failed to initiate payment" }, { status: 400 });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
