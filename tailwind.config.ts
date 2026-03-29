import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      colors: {
        bg: { DEFAULT: "#06080f", 2: "#0b0f1a", 3: "#0f1525" },
        panel: "#0c1120",
        accent: { DEFAULT: "#3b82f6", 2: "#8b5cf6", 3: "#06d6a0" },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease both",
        float: "float 3s ease-in-out infinite",
        spinSlow: "spin 2s linear infinite",
        glowPulse: "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0.2)" }, "50%": { boxShadow: "0 0 16px 4px rgba(59,130,246,0.35)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
