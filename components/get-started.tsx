"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyButton } from "./copy-button";

type TabId = "api-key" | "agent-skill" | "self-hosting" | "mcp";
type Accent = "blue" | "purple" | "green" | "amber";

const TABS: ReadonlyArray<{
  id: TabId;
  index: string;
  label: string;
  accent: Accent;
}> = [
  { id: "api-key", index: "01", label: "With API Key", accent: "blue" },
  { id: "agent-skill", index: "02", label: "Agent Skill", accent: "purple" },
  { id: "self-hosting", index: "03", label: "Self Hosting", accent: "green" },
  { id: "mcp", index: "04", label: "MCP", accent: "amber" },
];

// Static classes so Tailwind's JIT detects them
const accentStyles: Record<Accent, { border: string; dot: string }> = {
  blue: { border: "border-blue-400", dot: "bg-blue-400" },
  purple: { border: "border-purple-400", dot: "bg-purple-400" },
  green: { border: "border-green-400", dot: "bg-green-400" },
  amber: { border: "border-amber-400", dot: "bg-amber-400" },
};

export function GetStarted({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [active, setActive] = useState<TabId>("api-key");

  return (
    <section className="mt-20">
      <style>{`
        @keyframes gs-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gs-fade { animation: gs-fade 260ms cubic-bezier(0.16, 1, 0.3, 1); }
        .gs-scroll::-webkit-scrollbar { display: none; }
        .gs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Eyebrow */}
      <div className="flex items-center gap-4 mb-6">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600 flex items-center gap-2">
          <span className="text-neutral-300 dark:text-neutral-700 text-base leading-none">§</span>
          Get Started
        </span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Tabs */}
      <div
        className="gs-scroll flex items-end gap-8 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
        role="tablist"
        aria-label="Integration methods"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const styles = accentStyles[tab.accent];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={[
                "group relative flex items-baseline gap-2.5 pb-3 pt-1 -mb-px whitespace-nowrap border-b-2 transition-colors duration-200",
                isActive
                  ? `${styles.border} text-neutral-900 dark:text-neutral-100`
                  : "border-transparent text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300",
              ].join(" ")}
            >
              <span
                className={[
                  "font-[family-name:var(--font-geist-mono)] text-[11px] tabular-nums transition-colors",
                  isActive
                    ? "text-neutral-500 dark:text-neutral-500"
                    : "text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-500",
                ].join(" ")}
              >
                {tab.index}
              </span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        key={active}
        id={`panel-${active}`}
        role="tabpanel"
        className="gs-fade pt-10"
      >
        {active === "api-key" && <ApiKeyPanel isLoggedIn={isLoggedIn} />}
        {active === "agent-skill" && <AgentSkillPanel />}
        {active === "self-hosting" && <SelfHostingPanel />}
        {active === "mcp" && <McpPanel isLoggedIn={isLoggedIn} />}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Panels
 * ------------------------------------------------------------------------- */

function ApiKeyPanel({ isLoggedIn }: { isLoggedIn: boolean }) {
  const code = `curl -H "Authorization: Bearer osx_live_..." \\
  https://openschemaextract.chat-data.com/api/extract?url=https://schema.org/Recipe`;

  return (
    <PanelLayout
      heading="Generate a key in the dashboard, pass it as a bearer token."
      subtext="Returns every JSON-LD, Microdata, and RDFa block on the page as clean JSON. Keys can be rotated or revoked at any time."
      action={
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors font-[family-name:var(--font-geist-sans)]"
        >
          {isLoggedIn ? "Go to Dashboard" : "Login to get API key"}
          <ArrowRight />
        </Link>
      }
      code={
        <CodeBlock lang="bash" code={code}>
          <Hl t="command">curl</Hl>
          {" "}
          <Hl t="flag">-H</Hl>
          {" "}
          <Hl t="string">{`"Authorization: Bearer osx_live_..."`}</Hl>
          {" "}
          <Hl t="punct">\</Hl>
          {"\n  "}
          <Hl t="string">https://openschemaextract.chat-data.com/api/extract</Hl>
          <Hl t="punct">?</Hl>
          <Hl t="key">url</Hl>
          <Hl t="punct">=</Hl>
          <Hl t="string">https://schema.org/Recipe</Hl>
        </CodeBlock>
      }
    />
  );
}

function AgentSkillPanel() {
  const code = `npx skills add chat-data-llc/OpenSchemaExtract`;

  return (
    <PanelLayout
      heading="Bring structured-data extraction to Claude Code, Cursor, and 40+ agents."
      subtext='Once installed, just ask your agent to "extract schema from stripe.com" and it will automatically call the API.'
      code={
        <CodeBlock lang="bash" code={code}>
          <Hl t="command">npx</Hl>
          {" "}
          <Hl t="base">skills add</Hl>
          {" "}
          <Hl t="string">chat-data-llc/OpenSchemaExtract</Hl>
        </CodeBlock>
      }
    />
  );
}

function SelfHostingPanel() {
  const installCode = `npm install openschemaextract`;
  const usageCode = `import { extractSchema } from "openschemaextract";

const result = await extractSchema("https://schema.org/Recipe");

if (result.ok) {
  console.log(result.data.blocks); // All schema blocks
  console.log(result.data.schemaTypes); // ["Recipe"]
} else {
  console.error(result.error.message);
}`;

  return (
    <PanelLayout
      heading="Use as a Node.js library. Zero API calls, runs entirely on your server."
      subtext="MIT licensed. No rate limits, no external dependencies. Perfect for batch processing or integrating into your own tools."
      code={
        <>
          <CodeBlock lang="bash" code={installCode}>
            <Hl t="command">npm</Hl>
            {" "}
            <Hl t="base">install</Hl>
            {" "}
            <Hl t="string">openschemaextract</Hl>
          </CodeBlock>
          <div className="mt-4">
            <CodeBlock lang="typescript" code={usageCode}>
              <Hl t="command">import</Hl>
              {" "}
              <Hl t="punct">{"{"}</Hl>
              {" "}
              <Hl t="base">extractSchema</Hl>
              {" "}
              <Hl t="punct">{"}"}</Hl>
              {" "}
              <Hl t="command">from</Hl>
              {" "}
              <Hl t="string">{`"openschemaextract"`}</Hl>
              <Hl t="punct">;</Hl>
              {"\n\n"}
              <Hl t="command">const</Hl>
              {" "}
              <Hl t="base">result</Hl>
              {" "}
              <Hl t="punct">=</Hl>
              {" "}
              <Hl t="command">await</Hl>
              {" "}
              <Hl t="base">extractSchema</Hl>
              <Hl t="punct">(</Hl>
              <Hl t="string">{`"https://schema.org/Recipe"`}</Hl>
              <Hl t="punct">);</Hl>
              {"\n\n"}
              <Hl t="command">if</Hl>
              {" "}
              <Hl t="punct">(</Hl>
              <Hl t="base">result</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">ok</Hl>
              <Hl t="punct">)</Hl>
              {" "}
              <Hl t="punct">{"{"}</Hl>
              {"\n  "}
              <Hl t="base">console</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">log</Hl>
              <Hl t="punct">(</Hl>
              <Hl t="base">result</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">data</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">blocks</Hl>
              <Hl t="punct">);</Hl>
              {" "}
              <Hl t="comment">{"// All schema blocks"}</Hl>
              {"\n  "}
              <Hl t="base">console</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">log</Hl>
              <Hl t="punct">(</Hl>
              <Hl t="base">result</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">data</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">schemaTypes</Hl>
              <Hl t="punct">);</Hl>
              {" "}
              <Hl t="comment">{'// ["Recipe"]'}</Hl>
              {"\n"}
              <Hl t="punct">{"}"}</Hl>
              {" "}
              <Hl t="command">else</Hl>
              {" "}
              <Hl t="punct">{"{"}</Hl>
              {"\n  "}
              <Hl t="base">console</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">error</Hl>
              <Hl t="punct">(</Hl>
              <Hl t="base">result</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">error</Hl>
              <Hl t="punct">.</Hl>
              <Hl t="base">message</Hl>
              <Hl t="punct">);</Hl>
              {"\n"}
              <Hl t="punct">{"}"}</Hl>
            </CodeBlock>
          </div>
        </>
      }
    />
  );
}

function McpPanel({ isLoggedIn }: { isLoggedIn: boolean }) {
  const installCode = `claude mcp add --transport stdio openschemaextract -- npx -y openschemaextract-mcp`;
  const withKeyCode = `claude mcp add --transport stdio \\
  --env OPENSCHEMAEXTRACT_API_KEY=your_api_key \\
  openschemaextract -- npx -y openschemaextract-mcp`;
  const jsonCode = `{
  "mcpServers": {
    "openschemaextract": {
      "command": "npx",
      "args": ["-y", "openschemaextract-mcp"],
      "env": {
        "OPENSCHEMAEXTRACT_API_KEY": "your_api_key"
      }
    }
  }
}`;

  return (
    <div className="grid gap-6">
      <h3 className="text-xl sm:text-[1.375rem] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug max-w-2xl">
        Use OpenSchemaExtract as an MCP server in Claude Code, Cursor, or any MCP-compatible client.
      </h3>

      <div className="space-y-6">
        {/* Step 1 */}
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            1. Install the MCP server:
          </p>
          <CodeBlock lang="bash" code={installCode}>
            <Hl t="command">claude</Hl>
            {" "}
            <Hl t="base">mcp add</Hl>
            {" "}
            <Hl t="flag">--transport</Hl>
            {" "}
            <Hl t="base">stdio</Hl>
            {" "}
            <Hl t="base">openschemaextract</Hl>
            {" "}
            <Hl t="punct">--</Hl>
            {" "}
            <Hl t="command">npx</Hl>
            {" "}
            <Hl t="flag">-y</Hl>
            {" "}
            <Hl t="string">openschemaextract-mcp</Hl>
          </CodeBlock>
        </div>

        {/* Step 2 */}
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            2. {isLoggedIn ? "Get your API key from the dashboard" : "Login to get your API key"}, then add it:
          </p>
          {!isLoggedIn && (
            <div className="mb-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Login to get API key
                <ArrowRight />
              </Link>
            </div>
          )}
          <CodeBlock lang="bash" code={withKeyCode}>
            <Hl t="command">claude</Hl>
            {" "}
            <Hl t="base">mcp add</Hl>
            {" "}
            <Hl t="flag">--transport</Hl>
            {" "}
            <Hl t="base">stdio</Hl>
            {" "}
            <Hl t="punct">\</Hl>
            {"\n  "}
            <Hl t="flag">--env</Hl>
            {" "}
            <Hl t="key">OPENSCHEMAEXTRACT_API_KEY</Hl>
            <Hl t="punct">=</Hl>
            <Hl t="string">your_api_key</Hl>
            {" "}
            <Hl t="punct">\</Hl>
            {"\n  "}
            <Hl t="base">openschemaextract</Hl>
            {" "}
            <Hl t="punct">--</Hl>
            {" "}
            <Hl t="command">npx</Hl>
            {" "}
            <Hl t="flag">-y</Hl>
            {" "}
            <Hl t="string">openschemaextract-mcp</Hl>
          </CodeBlock>
        </div>

        {/* Alternative */}
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Or add to your <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">.claude/settings.json</code>:
          </p>
          <CodeBlock lang="json" code={jsonCode}>
            <Hl t="punct">{"{"}</Hl>
            {"\n  "}
            <Hl t="key">{`"mcpServers"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="punct">{"{"}</Hl>
            {"\n    "}
            <Hl t="key">{`"openschemaextract"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="punct">{"{"}</Hl>
            {"\n      "}
            <Hl t="key">{`"command"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="string">{`"npx"`}</Hl>
            <Hl t="punct">,</Hl>
            {"\n      "}
            <Hl t="key">{`"args"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="punct">[</Hl>
            <Hl t="string">{`"-y"`}</Hl>
            <Hl t="punct">,</Hl>
            {" "}
            <Hl t="string">{`"openschemaextract-mcp"`}</Hl>
            <Hl t="punct">]</Hl>
            <Hl t="punct">,</Hl>
            {"\n      "}
            <Hl t="key">{`"env"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="punct">{"{"}</Hl>
            {"\n        "}
            <Hl t="key">{`"OPENSCHEMAEXTRACT_API_KEY"`}</Hl>
            <Hl t="punct">:</Hl>
            {" "}
            <Hl t="string">{`"your_api_key"`}</Hl>
            {"\n      "}
            <Hl t="punct">{"}"}</Hl>
            {"\n    "}
            <Hl t="punct">{"}"}</Hl>
            {"\n  "}
            <Hl t="punct">{"}"}</Hl>
            {"\n"}
            <Hl t="punct">{"}"}</Hl>
          </CodeBlock>
        </div>
      </div>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
        Then ask Claude to &quot;extract schema from stripe.com&quot; and it will use the tool automatically.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Shared panel layout & primitives
 * ------------------------------------------------------------------------- */

function PanelLayout({
  heading,
  subtext,
  action,
  code,
}: {
  heading: string;
  subtext: string;
  action?: React.ReactNode;
  code: React.ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <h3 className="text-xl sm:text-[1.375rem] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug max-w-2xl">
        {heading}
      </h3>
      {action && <div>{action}</div>}
      {code}
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
        {subtext}
      </p>
    </div>
  );
}

function CodeBlock({
  lang,
  code,
  children,
}: {
  lang: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/70">
        <span className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {lang}
        </span>
        <CopyButton
          value={code}
          className="text-neutral-500 hover:text-neutral-200"
        />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] font-[family-name:var(--font-geist-mono)] text-neutral-200 leading-[1.65]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const hlClass: Record<
  "base" | "string" | "key" | "command" | "flag" | "comment" | "punct",
  string
> = {
  base: "text-neutral-200",
  string: "text-blue-300",
  key: "text-purple-300",
  command: "text-green-300",
  flag: "text-amber-300",
  comment: "text-neutral-500",
  punct: "text-neutral-400",
};

function Hl({
  t,
  children,
}: {
  t: keyof typeof hlClass;
  children: React.ReactNode;
}) {
  return <span className={hlClass[t]}>{children}</span>;
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10m0 0L9 4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
