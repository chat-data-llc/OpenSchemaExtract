import { UrlForm } from "@/components/url-form";
import { Header } from "@/components/header";
import { GetStarted } from "@/components/get-started";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        {/* Hero */}
        <div className="text-center mt-8 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
            Extract structured data
            <br />
            <span className="text-neutral-400 dark:text-neutral-500">
              from any URL
            </span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
            Give it any URL — get every structured data block parsed into clean
            JSON. Products, recipes, events, reviews — all the hidden metadata
            the web already has.
          </p>
        </div>

        {/* Form */}
        <UrlForm />

        {/* Supported formats */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-neutral-400 dark:text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            JSON-LD
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Microdata
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            RDFa
          </span>
        </div>

        {/* Get Started */}
        <GetStarted isLoggedIn={isLoggedIn} />

        <div className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Build by{" "}
          <a
            href="https://www.chat-data.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Chat Data
          </a>
        </div>
      </div>
    </div>
  );
}
