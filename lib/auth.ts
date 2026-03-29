import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { upsertOAuthUser } from "@/lib/oauth-user";

const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 days

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const githubConfigured = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(githubConfigured
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: { params: { scope: "read:user user:email" } },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: String(credentials.email).toLowerCase().trim() });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: maxAgeSeconds,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      if (account && profile && (account.provider === "github" || account.provider === "google")) {
        await connectDB();
        const u = await upsertOAuthUser(account, profile);
        token.id = u._id.toString();
        token.email = u.email;
        token.name = u.name ?? undefined;
        token.picture = u.image ?? undefined;
        token.githubLogin = u.githubLogin ?? undefined;
        token.githubLinked = Boolean(u.githubId);
      } else if (user) {
        await connectDB();
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        const db = await User.findById(user.id).lean();
        token.githubLogin = db?.githubLogin ?? undefined;
        token.githubLinked = Boolean(db?.githubId);
      }

      if (trigger === "update" && token.id) {
        await connectDB();
        const fresh = await User.findById(token.id).lean();
        if (fresh) {
          token.githubLogin = fresh.githubLogin ?? undefined;
          token.githubLinked = Boolean(fresh.githubId);
          token.name = fresh.name ?? token.name;
          token.picture = fresh.image ?? token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.githubLogin = token.githubLogin as string | undefined;
        session.user.githubLinked = token.githubLinked as boolean | undefined;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await connectDB();
        await User.findByIdAndUpdate(token.id, { $unset: { githubAccessToken: "" } });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
