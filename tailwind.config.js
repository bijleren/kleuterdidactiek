/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sunny-yellow': '#FFE66D',
        'sky-blue': '#4ECDC4',
        'coral-pink': '#FF6B6B',
        'grass-green': '#95E1A3',
        'lavender': '#C9B1FF',
        'cream': '#FFF8E7',
        'soft-orange': '#FFB347',
        'deep-purple': '#5D5FEF',
      },
      fontFamily: {
        baloo: ['"Baloo 2"', 'cursive'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
