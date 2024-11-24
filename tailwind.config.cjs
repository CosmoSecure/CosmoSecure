/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'persian-pink': '#fa7ebf',
        'paynes-gray': '#47586d',
        'ultra-violet': '#6c6c8d',
        'rich-black': '#14171e',
        'rich-black-2': '#13151c',
        'raisin-black': '#262733',
        'african-violet': '#a787b0',
        'chinese-violet': '#8e6289',
        'mauve': '#e3b2f1',
        'glaucous': '#717aa7',
      },
      backgroundImage: {
        'log': "url('./src/assets/images/foo.jpg')",
      },
    },
  },
  plugins: [],
};