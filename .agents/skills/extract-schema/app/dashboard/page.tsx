import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { apiKeysCollection } from "@/lib/db";
import { Header } from "@/components/header";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const col = await apiKeysCollection();
  const docs = await col
    .find({ userId: session.user.id, revokedAt: null })
    .sort({ createdAt: -1 })
    .toArray();

  const keys = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    preview: d.keyPreview,
    createdAt: d.createdAt.toISOString(),
    lastUsedAt: d.lastUsedAt ? d.lastUsedAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <DashboardClient
          initialKeys={keys}
          userName={session.user.name || session.user.email || "there"}
        />
      </div>
    </div>
  );
}
