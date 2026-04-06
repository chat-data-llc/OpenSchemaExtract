"use client";

import { useTransition } from "react";

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => action())}
      className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Logout"}
    </button>
  );
}
