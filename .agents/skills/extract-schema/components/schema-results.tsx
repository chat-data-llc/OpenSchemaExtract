"use client";

import { useState } from "react";
import type { ExtractionResult, SchemaBlock } from "@/src/types";

const FORMAT_COLORS: Record<string, string> = {
  "json-ld": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  microdata:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  rdfa: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function FormatBadge({ format }: { format: SchemaBlock["format"] }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${FORMAT_COLORS[format] ?? ""}`}
    >
      {format}
    </span>
  );
}

function BlockCard({ block }: { block: SchemaBlock }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <FormatBadge format={block.format} />
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {block.type}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <pre className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50 overflow-x-auto border-t border-neutral-200 dark:border-neutral-800 font-[family-name:var(--font-geist-mono)] leading-relaxed">
          {JSON.stringify(block.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function SchemaResults({ result }: { result: ExtractionResult }) {
  const [view, setView] = useState<"byType" | "json">("byType");
  const [activeType, setActiveType] = useState<string>("All");

  const types = ["All", ...result.schemaTypes];
  const filtered =
    activeType === "All"
      ? result.blocks
      : (result.byType[activeType] ?? []);

  return (
    <div className="mt-8">
      {/* Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Found{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {result.blocks.length}
          </span>{" "}
          block{result.blocks.length !== 1 ? "s" : ""} across{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {result.schemaTypes.length}
          </span>{" "}
          type{result.schemaTypes.length !== 1 ? "s" : ""}
        </p>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => setView("byType")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              view === "byType"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            By Type
          </button>
          <button
            onClick={() => setView("json")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              view === "json"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {view === "byType" ? (
        <div>
          {/* Type filter tabs */}
          {types.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    activeType === t
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600"
                  }`}
                >
                  {t}
                  {t !== "All" && (
                    <span className="ml-1 opacity-60">
                      ({result.byType[t]?.length ?? 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Block cards */}
          <div className="flex flex-col gap-2">
            {filtered.map((block, i) => (
              <BlockCard key={i} block={block} />
            ))}
          </div>
        </div>
      ) : (
        <pre className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto font-[family-name:var(--font-geist-mono)] leading-relaxed">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
