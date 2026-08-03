import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: "#F0F7FF",
          100: "#E1EFFE",
          200: "#C3DEFC",
          300: "#A5CDFA",
        },
        brand: {
          DEFAULT: "#0058C7",
          hover: "#004AA8",
          dark: "#003D8C",
        },
        accent: {
          DEFAULT: "#005EFC",
        },
        dark: "#1A1A1A",
        gray: "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        bengali: ["'Hind Siliguri'", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      boxShadow: {
        sh1: "0 1px 4px rgba(0,0,0,.07)",
        sh2: "0 4px 18px rgba(0,0,0,.10)",
        sh3: "0 8px 36px rgba(0,0,0,.13)",
      },
    },
  },
  plugins: [],
};
export default config;
