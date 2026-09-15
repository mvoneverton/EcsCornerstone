/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:      '#EEF3F8',
          100:     '#C8D6E3',
          200:     '#9AAEC2',
          300:     '#6C85A0',
          400:     '#3E5D7E',
          500:     '#1A3A5C',
          600:     '#162F4A',
          700:     '#102438',
          800:     '#0B1926',
          900:     '#050D13',
          DEFAULT: '#1A3A5C',
        },
        gold: {
          400:     '#C9A961',
          500:     '#D4AF37',
          DEFAULT: '#D4AF37',
        },
        'blue-gray': '#8B9DB8',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
