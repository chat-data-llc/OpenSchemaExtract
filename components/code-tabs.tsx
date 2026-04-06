"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";

export interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(tabs[0]?.label ?? "");
  const current = tabs.find((t) => t.label === active) ?? tabs[0];

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
        <div className="flex items-center gap-1 p-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setActive(t.label)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                active === t.label
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton
          value={current?.code || ""}
          className="mr-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        />
      </div>
      <pre className="p-4 text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto font-[family-name:var(--font-geist-mono)] leading-relaxed">
        {current?.code}
      </pre>
    </div>
  );
}
