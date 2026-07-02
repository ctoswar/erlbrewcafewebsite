/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['../*.html'],
  theme: {
    extend: {
      colors: {
        ink: '#181714',
        'ink-80': 'rgba(24,23,20,0.8)',
        'ink-40': 'rgba(24,23,20,0.4)',
        'ink-15': 'rgba(24,23,20,0.15)',
        'ink-06': 'rgba(24,23,20,0.06)',
        paper: '#F4EFE6',
        'paper-deep': '#EBE4D8',
        sage: '#4D6B48',
        gold: '#B8935A',
        gold2: '#D4AA6E',
        cream: '#FBF7F1',
        rust: '#7A3B28',
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", 'Georgia', 'serif'],
        'serif-jp': ["'Noto Serif JP'", 'serif'],
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
