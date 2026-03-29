import type { Account, Profile } from "next-auth";
import User from "@/models/User";

async function fetchGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
  const r = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "UI-Code-Generator-Pro",
    },
  });
  if (!r.ok) return null;
  const emails = (await r.json()) as Array<{ email: string; primary?: boolean; verified?: boolean }>;
  const primary = emails.find((e) => e.primary);
  const verified = emails.find((e) => e.verified);
  return (primary ?? verified ?? emails[0])?.email ?? null;
}

function noreplyGitHubEmail(login: string, id: string | number) {
  return `${id}+${login}@users.noreply.github.com`.toLowerCase();
}

export async function upsertOAuthUser(account: Account, profile: Profile) {
  const accessToken = account.access_token ?? undefined;

  if (account.provider === "github") {
    const ghProfile = profile as Profile & {
      id?: number | string;
      login?: string;
      avatar_url?: string;
      email?: string | null;
    };
    const githubId = String(ghProfile.id ?? "");
    const login = ghProfile.login ?? "user";
    let email = (ghProfile.email as string | undefined)?.toLowerCase().trim();
    if (!email && accessToken) {
      email = (await fetchGitHubPrimaryEmail(accessToken)) ?? undefined;
    }
    if (!email) {
      email = noreplyGitHubEmail(login, githubId);
    }

    let user = await User.findOne({ githubId });
    if (!user) {
      user = await User.findOne({ email });
    }
    if (user) {
      user.githubId = githubId;
      user.githubLogin = login;
      user.githubAvatar = ghProfile.avatar_url ?? user.githubAvatar;
      user.githubAccessToken = accessToken ?? user.githubAccessToken;
      if (!user.image && ghProfile.avatar_url) user.image = ghProfile.avatar_url;
      if (!user.name && login) user.name = login;
      await user.save();
      return user;
    }

    return User.create({
      email,
      name: login,
      image: ghProfile.avatar_url,
      emailVerified: new Date(),
      githubId,
      githubLogin: login,
      githubAvatar: ghProfile.avatar_url,
      githubAccessToken: accessToken,
    });
  }

  if (account.provider === "google") {
    const sub = (profile as Profile & { sub?: string }).sub ?? "";
    const email = ((profile as Profile & { email?: string }).email ?? "").toLowerCase().trim();
    const name = (profile as Profile & { name?: string }).name;
    const picture = (profile as Profile & { picture?: string }).picture;

    let user = await User.findOne({ googleId: sub });
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (user) {
      user.googleId = sub;
      user.image = picture ?? user.image;
      user.name = name ?? user.name;
      if (!user.emailVerified) user.emailVerified = new Date();
      await user.save();
      return user;
    }

    return User.create({
      email,
      name: name ?? email.split("@")[0],
      image: picture,
      emailVerified: new Date(),
      googleId: sub,
    });
  }

  throw new Error("Unsupported OAuth provider");
}
