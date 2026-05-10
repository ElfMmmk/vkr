import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1f1d",
        paper: "#f8f7f4",
        line: "#dedbd2",
        muted: "#746f66",
        accent: "#b64032",
        cobalt: "#234f9b"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 31, 29, 0.10)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
          "Segoe UI",
          "Arial",
          "sans-serif"
        ],
        serif: ["Georgia", "Times New Roman", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
