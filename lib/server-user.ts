import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Returns the authenticated user's id, or `null` for guests / unauthenticated requests. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
