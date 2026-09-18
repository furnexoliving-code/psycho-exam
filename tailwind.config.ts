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
        wt: {
          teal: "#1cb8cc",
          tealDark: "#149dad",
          banner: "#1668b3",
          bar: "#e9f7fa",
          pill: "#22b9cf",
          submit: "#34226e",
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
