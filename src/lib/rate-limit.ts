import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const MAX_EXTRACTIONS = 3;

const COOKIE_NAME = "scan-expense-usage";
const COOKIE_MAX_AGE_IN_SECONDS = 60 * 60 * 24 * 365;

interface ExtractionAllowance {
  isAllowed: boolean;
  remainingExtractions: number;
}

function signValue(value: string): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret) throw new Error("A variável RATE_LIMIT_SECRET não está configurada.");

  return createHmac("sha256", secret).update(value).digest("base64url");
}

function hasValidSignature(value: string, signature: string): boolean {
  const expectedSignature = Buffer.from(signValue(value));
  const receivedSignature = Buffer.from(signature);

  return (
    expectedSignature.length === receivedSignature.length &&
    timingSafeEqual(expectedSignature, receivedSignature)
  );
}

function parseUsageCount(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;

  const [usageCount = "", signature = ""] = cookieValue.split(".");
  if (!hasValidSignature(usageCount, signature)) return MAX_EXTRACTIONS;

  return Number(usageCount);
}

async function readUsageCount(): Promise<number> {
  const cookieStore = await cookies();
  return parseUsageCount(cookieStore.get(COOKIE_NAME)?.value);
}

export async function readRemainingExtractions(): Promise<number> {
  return Math.max(0, MAX_EXTRACTIONS - (await readUsageCount()));
}

export async function consumeExtraction(): Promise<ExtractionAllowance> {
  const usageCount = await readUsageCount();
  if (usageCount >= MAX_EXTRACTIONS) return { isAllowed: false, remainingExtractions: 0 };

  const nextUsageCount = String(usageCount + 1);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${nextUsageCount}.${signValue(nextUsageCount)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_IN_SECONDS,
    path: "/",
  });

  return { isAllowed: true, remainingExtractions: MAX_EXTRACTIONS - (usageCount + 1) };
}
