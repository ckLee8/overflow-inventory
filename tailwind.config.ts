import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f3efe6",
        foreground: "#1a1814",
        card: {
          DEFAULT: "#fbf8f1",
          foreground: "#1a1814",
        },
        muted: {
          DEFAULT: "#ebe6d9",
          foreground: "#6b645c",
        },
        primary: {
          DEFAULT: "#2f5d56",
          foreground: "#f6f3ea",
        },
        secondary: {
          DEFAULT: "#e7e1d4",
          foreground: "#1a1814",
        },
        destructive: {
          DEFAULT: "#a63d32",
          foreground: "#fbf8f1",
        },
        border: "#d9d1c3",
        input: "#d9d1c3",
        ring: "#2f5d56",
        warn: "#9a6b24",
        ok: "#2f6b4f",
        inbound: "#dce8e5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Iowan Old Style", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "22px",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(26,24,20,0.05), 0 1px 2px -1px rgba(26,24,20,0.06), 0 2px 4px 0 rgba(26,24,20,0.04)",
        "card-hover":
          "0 0 0 1px rgba(47,93,86,0.18), 0 1px 2px -1px rgba(26,24,20,0.08), 0 8px 20px -12px rgba(47,93,86,0.28)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
