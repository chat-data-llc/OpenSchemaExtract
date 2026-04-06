import { createHash, timingSafeEqual } from "crypto";
import { base64urlEncode } from "@/lib/base64url";

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  // RFC 7636: code_verifier must be 43..128 chars of [A-Z / a-z / 0-9 / - / . / _ / ~]
  if (verifier.length < 43 || verifier.length > 128) return false;
  if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) return false;
  const expected = base64urlEncode(createHash("sha256").update(verifier).digest());
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(challenge, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
