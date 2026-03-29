import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { ToastProvider } from "@/hooks/useToast";
import "./globals.css";

const syne = Syne({ subsets:["latin"], weight:["400","600","700","800"], variable:"--font-syne", display:"swap" });
const dmSans = DM_Sans({ subsets:["latin"], weight:["300","400","500"], variable:"--font-dm-sans", display:"swap" });
const jetbrains = JetBrains_Mono({ subsets:["latin"], weight:["400","500","600"], variable:"--font-jetbrains", display:"swap" });

export const metadata: Metadata = {
  title: "FluxForge AI | Next-Gen AI Design Engine",
  description:
    "Forge production-ready UI & backends instantly with high-fidelity AI models.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          <ToastProvider>
            <ThemeProvider>
              <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </div>
            </ThemeProvider>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
