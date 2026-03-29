"use client";

import { useEffect, type ReactNode } from "react";
import { useUIPreferencesStore } from "@/store/uiPreferencesStore";
import { applyUIPreferencesToDocument, resolveAppearance } from "@/lib/apply-ui-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const run = () => {
      applyUIPreferencesToDocument(useUIPreferencesStore.getState());
      const resolved = resolveAppearance(useUIPreferencesStore.getState().appearanceMode);
      document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
    };
    run();
    return useUIPreferencesStore.subscribe(run);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOS = () => {
      if (useUIPreferencesStore.getState().appearanceMode === "system") {
        applyUIPreferencesToDocument(useUIPreferencesStore.getState());
        const resolved = resolveAppearance("system");
        document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
      }
    };
    mq.addEventListener("change", onOS);
    return () => mq.removeEventListener("change", onOS);
  }, []);

  return <>{children}</>;
}
