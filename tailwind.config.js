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
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
