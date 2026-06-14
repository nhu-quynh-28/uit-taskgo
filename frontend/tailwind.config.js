/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./AppRoot.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E7D5B",
          foreground: "#F7FBF9",
        },
        secondary: {
          DEFAULT: "#E8F5E9",
          foreground: "#1B5E20",
        },
        background: "#F7FBF9",
        foreground: "#1A2421",
        card: "#FFFFFF",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: "#A8E6CF",
        border: "#E2E8F0",
        mint: "#E0F2F1",
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};