const PAYCHANGU_API_URL = "https://api.paychangu.com";

function getSecretKey(): string {
  const key = process.env.PAYCHANGU_SECRET_KEY;
  if (!key) throw new Error("PAYCHANGU_SECRET_KEY is not set");
  return key;
}

function getWebhookSecret(): string {
  const key = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!key) throw new Error("PAYCHANGU_WEBHOOK_SECRET is not set");
  return key;
}

export function generateTxRef(prefix: string = "tx"): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

// Standard Checkout — for deposits
export async function initiateCheckout(params: {
  amount: number;
  email: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title?: string;
  description?: string;
}) {
  const secretKey = getSecretKey();
  const res = await fetch(`${PAYCHANGU_API_URL}/payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: "MWK",
      email: params.email,
      first_name: "PayWallet",
      last_name: "User",
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      tx_ref: params.txRef,
      customization: {
        title: params.title || "Wallet Deposit",
        description: params.description || "Add funds to your wallet",
      },
    }),
  });
  return res.json();
}

// Verify transaction by tx_ref
export async function verifyTransaction(txRef: string) {
  const secretKey = getSecretKey();
  const res = await fetch(`${PAYCHANGU_API_URL}/verify-payment/${txRef}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
  });
  return res.json();
}

// Mobile Money Payout — for withdrawals
export async function initiateMobileMoneyPayout(params: {
  amount: number;
  mobile: string;
  network: string;
  chargeId: string;
}) {
  const secretKey = getSecretKey();
  const res = await fetch(`${PAYCHANGU_API_URL}/mobile-money/payouts/initialize`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      mobile: params.mobile,
      mobile_money_operator_ref_id: params.network,
      charge_id: params.chargeId,
    }),
  });
  return res.json();
}

// Validate webhook HMAC signature
export function validateWebhookSignature(payload: string, signature: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const secret = getWebhookSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex") === signature;
}
