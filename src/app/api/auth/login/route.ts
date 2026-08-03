import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json();

    if (!secretKey || secretKey.length !== 9) {
      return NextResponse.json({ error: "Enter your 9-character secret key" }, { status: 400 });
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.secretKey, secretKey.toUpperCase().trim()))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Invalid secret key. No account found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, secretKey: account.secretKey });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
