import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiKeysCollection } from "@/lib/db";
import { generateApiKey } from "@/lib/api-keys";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const col = await apiKeysCollection();
  const docs = await col
    .find({ userId: session.user.id, revokedAt: null })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    keys: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      preview: d.keyPreview,
      createdAt: d.createdAt.toISOString(),
      lastUsedAt: d.lastUsedAt ? d.lastUsedAt.toISOString() : null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }
  const name = (body.name || "Untitled key").toString().trim().slice(0, 80);

  const { plaintext, keyHash, keyPreview } = generateApiKey();
  const col = await apiKeysCollection();
  const now = new Date();
  const result = await col.insertOne({
    userId: session.user.id,
    name,
    prefix: "osx_live_",
    keyHash,
    keyPreview,
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  });

  return NextResponse.json({
    id: String(result.insertedId),
    name,
    key: plaintext,
    preview: keyPreview,
    createdAt: now.toISOString(),
  });
}
