/** Encode a Buffer to a URL-safe base64 string (no padding). */
export function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a URL-safe base64 string back to a Buffer. */
export function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const padded = input + "=".repeat(pad % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
