import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/** Returns a GitHub OAuth access token for API calls when the user has linked GitHub (server-side only; use sparingly). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.githubAccessToken) {
    return NextResponse.json({ token: null, login: user?.githubLogin ?? null });
  }

  return NextResponse.json({
    token: user.githubAccessToken,
    login: user.githubLogin ?? null,
  });
}
