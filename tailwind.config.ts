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
          DEFAULT: "#3B82F6", // bright blue
          dark: "#1E40AF", // darker blue
        },
        accent: {
          DEFAULT: "#60A5FA", // lighter blue
          dark: "#2563EB", // medium blue
        },
        background: {
          DEFAULT: "#FFFFFF", // pure white
          dark: "#F8FAFC", // very light gray
        },
        foreground: {
          DEFAULT: "#1E293B", // dark gray text
          dark: "#334155", // medium gray text
        },
      },
    },
  },
  darkMode: "class", // or 'media' if you want to use system preferences
  plugins: [],
};
export default config;
