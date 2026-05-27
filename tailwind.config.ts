import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2327",
        primary: "#2271b1",
        blush: "#135e96",
        rose: "#f0f6fc",
        mint: "#edfaef",
        canvas: "#f6f7f7",
        muted: "#50575e"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        verdana: ["Verdana", "Geneva", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
