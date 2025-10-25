import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f4f2ff",
          100: "#ebe5ff",
          200: "#d7c9ff",
          300: "#b89fff",
          400: "#9a73ff",
          500: "#804bff",
          600: "#662fd6",
          700: "#4d21a3",
          800: "#361870",
          900: "#20104a",
        },
        secondary: {
          50: "#fff5f0",
          100: "#ffe6d8",
          200: "#ffc7ad",
          300: "#ffa175",
          400: "#ff8047",
          500: "#ff6324",
          600: "#f24516",
          700: "#c1340f",
          800: "#8f260b",
          900: "#5c1706",
        },
        neutral: {
          50: "#f8fafc",
          100: "#eef2f6",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        success: {
          500: "#22c55e",
        },
        warning: {
          500: "#f59e0b",
        },
        info: {
          500: "#38bdf8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "3rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(128, 75, 255, 0.22)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
      },
      backgroundImage: {
        "soft-grid":
          "radial-gradient(circle at 1px 1px, rgba(128, 75, 255, 0.12) 1px, transparent 0)",
        "radial-sunrise":
          "radial-gradient(120% 120% at 20% 0%, rgba(255, 240, 200, 0.9) 0%, rgba(255, 255, 255, 0) 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
