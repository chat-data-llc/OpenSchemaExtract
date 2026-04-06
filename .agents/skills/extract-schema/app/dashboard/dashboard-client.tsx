"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { CodeTabs } from "@/components/code-tabs";

interface ApiKeySummary {
  id: string;
  name: string;
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}

export function DashboardClient({
  initialKeys,
  userName,
}: {
  initialKeys: ApiKeySummary[];
  userName: string;
}) {
  const [keys, setKeys] = useState<ApiKeySummary[]>(initialKeys);
  const [creating, setCreating] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createKey() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName || "Untitled key" }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      setRevealed({ name: json.name, key: json.key });
      setKeys((prev) => [
        {
          id: json.id,
          name: json.name,
          preview: json.preview,
          createdAt: json.createdAt,
          lastUsedAt: null,
        },
        ...prev,
      ]);
      setShowNameModal(false);
      setNewName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this API key? Calls using it will start failing.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const exampleKey = revealed?.key || "osx_live_YOUR_KEY";
  const tabs = [
    {
      label: "cURL",
      code: `curl -H "Authorization: Bearer ${exampleKey}" \\
  "http://localhost:3000/api/extract?url=https://schema.org/Recipe"`,
    },
    {
      label: "Python",
      code: `import requests

resp = requests.get(
    "http://localhost:3000/api/extract",
    params={"url": "https://schema.org/Recipe"},
    headers={"Authorization": "Bearer ${exampleKey}"},
)
print(resp.json())`,
    },
    {
      label: "TypeScript",
      code: `const res = await fetch(
  "http://localhost:3000/api/extract?url=" +
    encodeURIComponent("https://schema.org/Recipe"),
  { headers: { Authorization: "Bearer ${exampleKey}" } }
);
const data = await res.json();
console.log(data);`,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your API keys and test the extraction endpoint.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* API Keys section */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              API Keys
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Use these to authenticate requests to{" "}
              <code className="font-[family-name:var(--font-geist-mono)]">
                /api/extract
              </code>
            </p>
          </div>
          <button
            onClick={() => setShowNameModal(true)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
          >
            + New key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No API keys yet. Create one to start making programmatic
              requests.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {keys.map((k) => (
              <li
                key={k.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {k.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-geist-mono)]">
                      {k.preview}
                    </code>
                    <span className="text-xs text-neutral-400 dark:text-neutral-600">
                      •
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Created {formatRelative(k.createdAt)}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-600">
                      •
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Last used {formatRelative(k.lastUsedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(k.id)}
                  disabled={deletingId === k.id}
                  className="text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deletingId === k.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quickstart */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Quickstart
        </h2>
        <CodeTabs tabs={tabs} />
      </div>

      {/* Name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Name your new key
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Give it a name so you can identify it later.
            </p>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Production server"
              className="mt-4 w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createKey();
              }}
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setNewName("");
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={creating}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal modal */}
      {revealed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              API key created
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Copy this key now. For security, it won&apos;t be shown again.
            </p>
            <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 flex items-center justify-between gap-3">
              <code className="text-xs text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-geist-mono)] break-all">
                {revealed.key}
              </code>
              <CopyButton
                value={revealed.key}
                className="shrink-0 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              />
            </div>
            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setRevealed(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
