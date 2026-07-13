import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        priority: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#14b8a6",
        },
      },
    },
  },
  plugins: [
    require('lightswind/plugin'),],
};

export default config;
