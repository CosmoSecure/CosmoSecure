/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: 'class', // Enable dark mode using a class
  theme: {
    extend: {
      colors: {
        // Define CSS variables for theme colors
        'theme-background': 'var(--background-color)',
        'theme-background-transparent': 'var(--background-color-transparent)',
        'theme-text': 'var(--text-color)',
        'theme-text-transparent': 'var(--text-color-transparent)',
        'theme-primary': 'var(--primary-color)',
        'theme-primary-transparent': 'var(--primary-color-transparent)',
        'theme-secondary': 'var(--secondary-color)',
        'theme-secondary-transparent': 'var(--secondary-color-transparent)',
        'theme-accent': 'var(--accent-color)',
        'theme-accent-transparent': 'var(--accent-color-transparent)',

        // Existing colors
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