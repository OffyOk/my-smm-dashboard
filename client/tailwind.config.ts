import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        panel: {
          950: "#0b1020",
          900: "#121a2b",
          800: "#1a2540",
          200: "#d5d9e2",
          100: "#edf0f6",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(148,163,184,0.15), 0 24px 60px rgba(15,23,42,0.35)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};

export default config;
