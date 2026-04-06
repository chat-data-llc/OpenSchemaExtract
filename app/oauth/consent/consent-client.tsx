"use client";

import { useState } from "react";

export function ConsentClient({ token }: { token: string }) {
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);

  async function submit(approve: boolean) {
    setSubmitting(approve ? "approve" : "deny");
    const form = new FormData();
    form.set("req", token);
    form.set("approve", approve ? "1" : "0");
    const res = await fetch("/api/oauth/authorize", {
      method: "POST",
      body: form,
      redirect: "manual",
    });

    // The endpoint replies with a 3xx redirect to the client's redirect_uri.
    // Manual fetch keeps us on the consent page; use the Location header to navigate.
    const loc = res.headers.get("location");
    if (loc && (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400))) {
      window.location.assign(loc);
      return;
    }

    // Fallback: log and reset if something unexpected happened.
    const body = await res.text().catch(() => "");
    console.error("Consent POST failed", res.status, body);
    setSubmitting(null);
  }

  return (
    <div className="mt-6 flex items-center gap-2">
      <button
        type="button"
        onClick={() => submit(false)}
        disabled={submitting !== null}
        className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {submitting === "deny" ? "Denying…" : "Deny"}
      </button>
      <button
        type="button"
        onClick={() => submit(true)}
        disabled={submitting !== null}
        className="flex-1 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50"
      >
        {submitting === "approve" ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}
