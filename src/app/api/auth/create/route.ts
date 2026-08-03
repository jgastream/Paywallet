
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, wallets } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateSecretKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 9; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export async function POST() {
  try {
    let secretKey = generateSecretKey();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(accounts).where(eq(accounts.secretKey, secretKey)).limit(1);
      if (existing.length === 0) break;
      secretKey = generateSecretKey();
      attemptsa
    }

    const [account] = await db.insert(accounts).values({ secretKey }).returning();

    await db.insert(wallets).values({
      accountId: account.id,
      balance: 0,
      lockedBalance: 0,
    });

    return NextResponse.json({ success: true, secretKey });
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
