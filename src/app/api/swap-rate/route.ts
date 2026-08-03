import { NextRequest, NextResponse } from "next/server";

const RATES: Record<string, number> = {
  MWK_USD: 4200, MWK_ZAR: 88, MWK_KES: 12.7,
  MWK_NGN: 1000, MWK_GBP: 2080, MWK_EUR: 1800,
};

export async function GET(request: NextRequest) {
  try {
    const from = (request.nextUrl.searchParams.get("from") || "MWK").toUpperCase();
    const to = (request.nextUrl.searchParams.get("to") || "USD").toUpperCase();
    const amount = parseFloat(request.nextUrl.searchParams.get("amount") || "0");
    if (amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    if (from === to) {
      return NextResponse.json({ success: true, rate: 1, from, to, amount, netResult: amount, fee: 0 });
    }

    let rate: number | null = null;
    const key = `${from}_${to}`;
    const rev = `${to}_${from}`;
    if (RATES[key]) rate = RATES[key];
    else if (RATES[rev]) rate = 1 / RATES[rev];
    else if (from !== "MWK" && to !== "MWK") {
      const f = RATES[`MWK_${from}`];
      const t = RATES[`MWK_${to}`];
      if (f && t) rate = f / t;
    }

    if (rate === null) return NextResponse.json({ error: "Unsupported pair" }, { status: 400 });

    const fee = amount * 0.01;
    const netResult = (amount - fee) * rate;

    return NextResponse.json({ success: true, rate, from, to, amount, netResult, fee });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
