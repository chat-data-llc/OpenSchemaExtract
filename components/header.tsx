import Link from "next/link";
import { auth, signOut } from "@/auth";
import { LogoutButton } from "./logout-button";

const GITHUB_REPO = "chat-data-llc/OpenSchemaExtract";

async function fetchStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

export async function Header() {
  const [session, stars] = await Promise.all([auth(), fetchStarCount()]);
  const isLoggedIn = !!session?.user;

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="max-w-4xl mx-auto px-4 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 9 Q 8 9 8 11 V 14 Q 8 16 6 16 Q 8 16 8 18 V 21 Q 8 23 10 23"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M22 9 Q 24 9 24 11 V 14 Q 24 16 26 16 Q 24 16 24 18 V 21 Q 24 23 22 23"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect x="11" y="11.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="15.25" width="6" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="18.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            OpenSchemaExtract
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GitHub${stars !== null ? ` — ${stars} stars` : ""}`}
            className="group inline-flex items-stretch text-xs font-semibold rounded-md overflow-hidden border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
          >
            <span className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-750 transition-colors">
              <svg
                className="w-3.5 h-3.5"
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
              <span>Stars</span>
            </span>
            {stars !== null && (
              <span className="flex items-center px-2 py-1 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-l border-neutral-300 dark:border-neutral-700 tabular-nums">
                {formatStars(stars)}
              </span>
            )}
          </a>
          {isLoggedIn && (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Dashboard
              </Link>
              <LogoutButton action={doSignOut} />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
