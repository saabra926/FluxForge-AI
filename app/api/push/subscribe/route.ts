import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Push is not configured on this server." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    const endpoint = body.endpoint?.trim();
    const p256dh = body.keys?.p256dh;
    const auth = body.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription payload." }, { status: 400 });
    }

    await connectDB();
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Subscribe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");
    await connectDB();
    if (endpoint) {
      await PushSubscription.deleteOne({ userId: session.user.id, endpoint });
    } else {
      await PushSubscription.deleteMany({ userId: session.user.id });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unsubscribe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
