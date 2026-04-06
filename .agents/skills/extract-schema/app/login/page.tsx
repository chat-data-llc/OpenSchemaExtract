import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl || "/dashboard");
  }
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : undefined;
  const nextCallback =
    safeCallback ||
    (callbackUrl && isSameOrigin(callbackUrl) ? callbackUrl : "/dashboard");

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M10 9 Q 8 9 8 11 V 14 Q 8 16 6 16 Q 8 16 8 18 V 21 Q 8 23 10 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 9 Q 24 9 24 11 V 14 Q 24 16 26 16 Q 24 16 24 18 V 21 Q 24 23 22 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="11" y="11.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="15.25" width="6" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="18.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign in to OpenSchemaExtract
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 text-center">
            Manage API keys and build integrations
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: nextCallback });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors font-[family-name:var(--font-geist-sans)]"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with GitHub
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
          By continuing you agree to allow GitHub to share your public profile.
        </p>
      </div>
    </div>
  );
}

function isSameOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    const base = process.env.AUTH_URL || process.env.OAUTH_ISSUER || "";
    if (!base) return false;
    const b = new URL(base);
    return u.host === b.host && u.protocol === b.protocol;
  } catch {
    return false;
  }
}
