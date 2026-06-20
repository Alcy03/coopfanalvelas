/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coop: {
          green:      "#00763a",
          darkgreen:  "#0b592a",
          light:      "#EEF6F0",
          yellow:     "#fcc420",
          darkyellow: "#e79f18",
        },
      },
    },
  },
  plugins: [],
}
