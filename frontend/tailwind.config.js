/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B3A5C",
          hover: "#142D47",
          light: "#EBF1F8",
        },
        accent: {
          DEFAULT: "#E85D26",
          hover: "#C94D1E",
        },
        surface: "#FFFFFF",
        border: "#E2E6EA",
        "border-strong": "#C8CDD3",
        muted: "#9AA3AE",
        success: { DEFAULT: "#2E7D52", bg: "#EDF7F2" },
        warning: { DEFAULT: "#D97706", bg: "#FEF3E2" },
        danger:  { DEFAULT: "#DC2626", bg: "#FEF2F2" },
        info:    { DEFAULT: "#1D6FB5", bg: "#EBF4FD" },
      },
      fontFamily: {
        heading: ["DM Sans", "sans-serif"],
        body:    ["IBM Plex Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": "11px",
      },
      borderRadius: {
        card: "8px",
        btn:  "6px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}
