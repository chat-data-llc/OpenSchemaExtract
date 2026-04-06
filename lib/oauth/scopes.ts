export const SCOPE_EXTRACT_READ = "extract:read";
export const DEFAULT_SCOPE = SCOPE_EXTRACT_READ;
export const SUPPORTED_SCOPES = [SCOPE_EXTRACT_READ] as const;

export function parseScopeString(input: string | null | undefined): string[] {
  if (!input) return [];
  return input.split(/\s+/).filter(Boolean);
}

export function filterSupported(scopes: string[]): string[] {
  return scopes.filter((s) => (SUPPORTED_SCOPES as readonly string[]).includes(s));
}

export function scopeSubsetOf(requested: string[], granted: string[]): boolean {
  return requested.every((s) => granted.includes(s));
}
