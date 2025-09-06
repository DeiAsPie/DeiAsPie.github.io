/**** Tailwind config for Hugo theme 'curated' ****/
module.exports = {
  darkMode: 'class',
  content: [
    "./content/**/*.{html,md}",
    "./layouts/**/*.html",
    "./themes/curated/layouts/**/*.html",
    "./assets/js/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [
    // Tailwind v4: Register plugins in CSS via `@plugin` for best results.
  ],
};
