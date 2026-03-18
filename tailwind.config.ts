/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Cormorant Garamond'", "Georgia", "serif"],
        khmer: ["'Noto Serif Khmer'", "serif"],
        decorative: ["'IM Fell English SC'", "serif"],
        body: ["'Lato'", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#FDFAF5",
          100: "#FAF4E8",
          200: "#F5E9D0",
          300: "#EDD9B2",
          400: "#D4B896",
        },
        gold: {
          300: "#D4AF6A",
          400: "#C49A45",
          500: "#A67C2C",
          600: "#8B6520",
          700: "#6B4E16",
        },
        burgundy: {
          500: "#6B2737",
          600: "#5A1F2E",
          700: "#4A1824",
          800: "#3A1220",
        },
        charcoal: {
          700: "#2C2416",
          800: "#1E1A10",
          900: "#14120B",
        },
      },
      backgroundImage: {
        "paper-texture":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        book: "0 20px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3), inset -3px 0 8px rgba(0,0,0,0.2)",
        "book-left":
          "0 20px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3), inset 3px 0 8px rgba(0,0,0,0.2)",
        page: "4px 0 15px rgba(0,0,0,0.15)",
        "page-hover": "8px 0 25px rgba(0,0,0,0.25)",
      },
      keyframes: {
        "page-turn-forward": {
          "0%": { transform: "rotateY(0deg)", transformOrigin: "left center" },
          "100%": {
            transform: "rotateY(-180deg)",
            transformOrigin: "left center",
          },
        },
        "page-turn-back": {
          "0%": {
            transform: "rotateY(-180deg)",
            transformOrigin: "left center",
          },
          "100%": { transform: "rotateY(0deg)", transformOrigin: "left center" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "page-turn-forward": "page-turn-forward 0.8s ease-in-out forwards",
        "page-turn-back": "page-turn-back 0.8s ease-in-out forwards",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};
