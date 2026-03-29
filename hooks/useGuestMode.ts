"use client";
import { useSession } from "next-auth/react";

/** Guests may use core generation with restrictions; authenticated users get full features. */
export function useGuestMode() {
  const { status } = useSession();
  const isGuest = status === "unauthenticated";
  const isAuthenticated = status === "authenticated";
  const sessionLoading = status === "loading";
  return { isGuest, isAuthenticated, sessionLoading };
}
