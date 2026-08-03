"use client";

export function getSecretKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("paywallet_key");
}

export function setSecretKey(key: string): void {
  localStorage.setItem("paywallet_key", key);
}

export function clearSecretKey(): void {
  localStorage.removeItem("paywallet_key");
}
