import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { configureWebPush, isWebPushConfigured, webpush } from "@/lib/vapid";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: "Push not configured." }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { title?: string; body?: string };
    const title = body.title?.trim() || "UI Code Generator Pro";
    const text = body.body?.trim() || "You have a new notification.";

    await connectDB();
    configureWebPush();
    const subs = await PushSubscription.find({ userId: session.user.id });

    const payload = JSON.stringify({
      title,
      body: text,
      url: "/",
      tag: `notify-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
          { TTL: 60 * 60 },
        ),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({ sent: subs.length - failed, failed, total: subs.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
