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
        primary: {
          DEFAULT: "#1E3A8A", // dark blue
          dark: "#0F172A",
        },
        accent: {
          DEFAULT: "#3B82F6", // bright blue
          dark: "#4ADE80", // neon green
        },
        background: {
          DEFAULT: "#F8FAFC", // light chrome
          dark: "#000000", // pure black
        },
        foreground: {
          DEFAULT: "#1E293B", // dark chrome text
          dark: "#4ADE80", // neon green text
        },
      },
    },
  },
  darkMode: "class", // or 'media' if you want to use system preferences
  plugins: [],
};
export default config;
