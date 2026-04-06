import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenSchemaExtract — Extract Structured Data from Any URL",
  description:
    "Give it any URL and get every structured data block (JSON-LD, Microdata, RDFa) parsed into clean JSON. Products, recipes, events, reviews — all the hidden metadata the web already has.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "OpenSchemaExtract",
    description:
      "Extract JSON-LD, Microdata, and RDFa structured data from any URL.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
