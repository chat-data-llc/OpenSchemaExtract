import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { verifyConsentRequest } from "@/lib/oauth/tokens";
import { getClient } from "@/lib/oauth/clients";
import { ConsentClient } from "./consent-client";

interface ConsentPayload {
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scope: string;
  state: string | null;
  code_challenge: string;
  code_challenge_method: "S256";
  resource: string | null;
}

export const dynamic = "force-dynamic";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const { req: token } = await searchParams;
  if (!token) {
    return (
      <ConsentError
        title="Missing request"
        message="This consent link is incomplete."
      />
    );
  }
  const verified = verifyConsentRequest<ConsentPayload>(token);
  if (!verified.ok) {
    return (
      <ConsentError
        title="Request expired or invalid"
        message={`Please start the authorization again. (${verified.reason})`}
      />
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.id !== verified.payload.user_id) {
    return (
      <ConsentError
        title="Session mismatch"
        message="You're logged in as a different user than the one this request was initiated for."
      />
    );
  }
  const client = await getClient(verified.payload.client_id);
  if (!client) {
    return (
      <ConsentError
        title="Unknown client"
        message="This application is not registered."
      />
    );
  }

  const scopes = verified.payload.scope.split(/\s+/).filter(Boolean);
  const firstRedirectUri = verified.payload.redirect_uri;
  let redirectHost = firstRedirectUri;
  try {
    redirectHost = new URL(firstRedirectUri).host || firstRedirectUri;
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M10 9 Q 8 9 8 11 V 14 Q 8 16 6 16 Q 8 16 8 18 V 21 Q 8 23 10 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 9 Q 24 9 24 11 V 14 Q 24 16 26 16 Q 24 16 24 18 V 21 Q 24 23 22 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="11" y="11.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="15.25" width="6" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="11" y="18.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 text-center">
            Authorize access
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 text-center">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {client.clientName}
            </span>{" "}
            wants to access your OpenSchemaExtract account.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
                Redirect host
              </dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-geist-mono)] text-xs break-all">
                {redirectHost}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
                Requested permissions
              </dt>
              <dd className="mt-0.5">
                <ul className="space-y-1">
                  {scopes.map((s) => (
                    <li
                      key={s}
                      className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100"
                    >
                      <svg
                        className="w-4 h-4 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <code className="text-xs font-[family-name:var(--font-geist-mono)]">
                        {s}
                      </code>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <ConsentClient token={token} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
          You can revoke this access at any time from your dashboard.
        </p>
      </div>
    </div>
  );
}

function ConsentError({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {message}
        </p>
      </div>
    </div>
  );
}
