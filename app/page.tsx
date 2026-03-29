"use client";
import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { InputPanel } from "@/components/editor/InputPanel";
import { OutputPanel } from "@/components/editor/OutputPanel";
import { GitHubSyncModal, type GitHubModalTabId } from "@/components/github/GitHubSyncModal";
import { AppearancePanel } from "@/components/customization/AppearancePanel";
import { useToast } from "@/hooks/useToast";
import { useGuestMode } from "@/hooks/useGuestMode";
import { compressImage } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { TemplateFromQuery } from "@/components/app/TemplateFromQuery";
import { FullPageLoader } from "@/components/ui/Loader";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { showToast } = useToast();
  const { isGuest } = useGuestMode();
  const [githubModal, setGithubModal] = useState<{ open: boolean; tab?: GitHubModalTabId }>({ open: false });
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    // Simulate initial loading sequence for all UI resources
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const openGithub = () => {
    if (isGuest) {
      showToast("Sign in to use GitHub sync and deployment.", "info");
      return;
    }
    setGithubModal({ open: true, tab: "push" });
  };
  const openDeploy = () => {
    if (isGuest) {
      showToast("Sign in to use deployment (Vercel / Netlify).", "info");
      return;
    }
    setGithubModal({ open: true, tab: "deploy" });
  };
  const closeGithubModal = () => setGithubModal({ open: false });

  useEffect(() => {
    if (isGuest) {
      useAppStore.getState().clearHistory();
    }
  }, [isGuest]);

  // Clipboard paste: Ctrl+V image support
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const { base64, preview } = await compressImage(file, 1280, 0.88);
            useAppStore.getState().setImage(base64, preview);
            showToast("Screenshot pasted from clipboard!");
          } catch {
            showToast("Failed to process pasted image", "error");
          }
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [showToast]);

  return (
    <>
      <AnimatePresence mode="wait">
        {!isPageLoaded && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <Suspense fallback={null}>
        <TemplateFromQuery />
      </Suspense>
      <div className="app-backdrop" aria-hidden />
      <div className="app-backdrop-vignette" aria-hidden />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isPageLoaded ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-[2] flex min-h-0 flex-1 w-full flex-col overflow-hidden md:flex-row md:gap-0"
      >
        <Sidebar isGuest={isGuest} onGuestAction={showToast} />

        <div
          className="app-main-column relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          style={{ background: "color-mix(in srgb, var(--panel) 80%, transparent)", backdropFilter: "blur(12px)" }}
        >
          <Topbar isGuest={isGuest} onOpenGithub={openGithub} onOpenDeploy={openDeploy} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-0 lg:min-h-0 lg:flex-row">
            <div
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-b lg:min-h-0 lg:border-b-0 lg:border-r"
              style={{ borderColor: "var(--border2)", background: "var(--panel)" }}
            >
              <InputPanel onToast={showToast} />
            </div>
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0 lg:min-w-0 lg:flex-[1.15]">
              <OutputPanel onToast={showToast} isGuest={isGuest} />
            </div>
          </div>
        </div>
      </motion.div>
      <AppearancePanel onToast={showToast} />

      {githubModal.open && (
        <GitHubSyncModal
          key={githubModal.tab ?? "push"}
          initialTab={githubModal.tab}
          onClose={closeGithubModal}
          onToast={showToast}
        />
      )}
    </>
  );
}
