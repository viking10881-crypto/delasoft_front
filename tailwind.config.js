import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      colors: {
        brand: {
          DEFAULT: "#0878E8",
          hover:   "#075FC0",
          muted:   "rgba(8,120,232,0.12)",
        },
        delasoft: {
          blue:     "#0878E8",
          navy:     "#082B68",
          silver:   "#A7A9AC",
          black:    "#0B0B0D",
          graphite: "#1C1C22",
          white:    "#F5F5F7",
          grey:     "#B8B8C2",
        },
      },
      keyframes: {
        progress: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)"    },
        },
        "fade-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)"    },
        },
        shimmer: {
          "0%":   { transform: "translateX(-200%)" },
          "100%": { transform: "translateX(200%)"  },
        },
      },
      animation: {
        progress:  "progress 2s ease-in-out forwards",
        "fade-in": "fade-in 0.2s ease-out",
        shimmer:   "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [animate],
};
