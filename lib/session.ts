import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mm_session";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-session-secret";

export type SessionPayload = {
  userId: string;
  role: string;
  exp: number;
};

export function createSessionToken(userId: string, role: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + maxAgeMs,
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(b64).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(b64, "base64url").toString()) as SessionPayload;
    if (!data.userId || !data.role || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}
