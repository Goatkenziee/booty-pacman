import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        foreground: "#f0f0f5",
        primary: {
          DEFAULT: "#a855f7",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1a1a2e",
          foreground: "#a0a0b0",
        },
        card: {
          DEFAULT: "#12121a",
          foreground: "#f0f0f5",
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;