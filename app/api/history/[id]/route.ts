// ============================================================
// app/api/history/[id]/route.ts — Get full generation by ID
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Generation from "@/models/Generation";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const item = await Generation.findById(params.id).lean();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
