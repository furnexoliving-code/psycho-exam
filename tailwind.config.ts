import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rrb: {
          banner: "#1565b0",
          bannerDark: "#0d4a85",
          teal: "#0fb9c4",
          tealDark: "#0a97a1",
        },
        palette: {
          notVisited: "#d9d9d9",
          notAnswered: "#e8453c",
          answered: "#4caf50",
          review: "#8e44ad",
          reviewAnswered: "#8e44ad",
        },
      },
      fontFamily: {
        exam: ['"Segoe UI"', "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
