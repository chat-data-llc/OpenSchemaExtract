import { DEFAULT_URL_PROTOCOL } from "./constants";

export function normalizeUrlInput(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return `${DEFAULT_URL_PROTOCOL}${trimmed}`;
}

export function isValidAbsoluteUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
