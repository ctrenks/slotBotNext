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
        background: {
          light: "#353535", // light mode background
          dark: "#1a1a1a", // dark mode background
        },
        text: {
          light: "#353535", // light mode text
          dark: "#ffffff", // dark mode text
        },
        // You can add more color variations as needed
        primary: {
          light: "#3b82f6", // light mode primary color
          dark: "#60a5fa", // dark mode primary color
        },
      },
    },
  },
  darkMode: "class", // or 'media' if you want to use system preferences
  plugins: [],
};
export default config;
