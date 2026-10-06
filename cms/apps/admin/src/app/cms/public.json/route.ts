import { NextResponse } from "next/server";
import bundledSnapshot from "@/data/public.json";
import { loadRemoteSnapshot } from "@/lib/snapshot-store";
import { normalizeSnapshotPages, pickNewestSnapshot } from "@/lib/snapshot-normalize";
import { readPublicSnapshotFile, type PublicSnapshot } from "@ddc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function snapshot(): Promise<PublicSnapshot> {
  const remote = await loadRemoteSnapshot();
  const disk = readPublicSnapshotFile();
  const bundled = bundledSnapshot as PublicSnapshot;
  const newest = pickNewestSnapshot(remote, disk, bundled) || bundled;
  return normalizeSnapshotPages(newest).snap;
}

/** Public CMS snapshot for ddc-cms rewrite at /cms/public.json */
export async function GET() {
  try {
    const data = await snapshot();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("public snapshot GET failed", err);
    return NextResponse.json(
      { error: "snapshot unavailable" },
      { status: 503, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
}
