import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hasPassword = Boolean(user.passwordHash);
  const hasGoogle = Boolean(user.googleId);
  if (!hasPassword && !hasGoogle) {
    return NextResponse.json(
      { error: "Add a password or Google login before unlinking GitHub, or your account would be inaccessible." },
      { status: 400 },
    );
  }

  user.githubId = undefined;
  user.githubLogin = undefined;
  user.githubAvatar = undefined;
  user.githubAccessToken = undefined;
  await user.save();

  return NextResponse.json({ success: true });
}
