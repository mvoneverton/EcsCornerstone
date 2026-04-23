/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1E3D',
          900: '#1A3A5C',
          800: '#2A4D73',
          700: '#3A6491',
          600: '#4B7AAD',
          500: '#6E8DC2',
          400: '#96AED8',
          300: '#BDCFEB',
          200: '#D6E4F2',
          100: '#EEF3F8',
          50:  '#F7F9FC',
        },
        gold: {
          500: '#D4AF37',
          400: '#C9A961',
          100: '#F7F0DC',
        },
        'blue-gray': '#8B9DB8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
};
