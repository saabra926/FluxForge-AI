import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = String(body.email ?? "")
      .toLowerCase()
      .trim();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    // Same response whether or not user exists (avoid email enumeration)
    const generic = { success: true, message: "If an account exists, a reset link has been sent." };

    if (!user?.passwordHash) {
      return NextResponse.json(generic);
    }

    const token = randomBytes(32).toString("hex");
    const oneHour = 60 * 60 * 1000;
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + oneHour);
    await user.save();

    const base =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
      (req.headers.get("origin") ?? req.nextUrl.origin);
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json(generic);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
