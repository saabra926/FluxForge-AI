"use client";

import { create } from "zustand";

type ShellState = {
  mobileSidebarOpen: boolean;
  appearanceOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setAppearanceOpen: (open: boolean) => void;
};

export const useShellStore = create<ShellState>((set) => ({
  mobileSidebarOpen: false,
  appearanceOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setAppearanceOpen: (open) => set({ appearanceOpen: open }),
}));
