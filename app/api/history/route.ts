// ============================================================
// app/api/history/route.ts — CRUD for generation history
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Generation from "@/models/Generation";

// GET /api/history — fetch latest 50 generations
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const framework = searchParams.get("framework");

    const filter = framework ? { "config.framework": framework } : {};

    const [items, total] = await Promise.all([
      Generation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-code -files") // omit heavy fields for list view
        .lean(),
      Generation.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: items, total }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/history?id=xxx — delete one generation
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await connectDB();
    await Generation.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
