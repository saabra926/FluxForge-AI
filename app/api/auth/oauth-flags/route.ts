import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
  });
}
