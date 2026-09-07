// Pure referral math (no I/O) — safe for unit tests.

export function referralCreditCents(): number {
  return 10000; // $100 account credit per paid referral
}

export function newReferralCode(rand: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no lookalikes
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(rand() * alphabet.length)];
  return `CREW-${out}`;
}

export function isValidReferralCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return /^CREW-[A-HJ-NP-Z2-9]{8}$/.test(code.trim().toUpperCase());
}
