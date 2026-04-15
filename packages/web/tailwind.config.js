/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#EEF3F8',
          100: '#C8D6E3',
          200: '#9AAEC2',
          300: '#6C85A0',
          400: '#3E5D7E',
          500: '#1A3A5C',
          600: '#162F4A',
          700: '#102438',
          800: '#0B1926',
          900: '#050D13',
          950: '#0A1E3D',
          DEFAULT: '#1A3A5C',
        },
        gold: {
          400: '#C9A961',
          500: '#D4AF37',
          DEFAULT: '#D4AF37',
        },
        'blue-gray': '#8B9DB8',
        accent: {
          50:  '#EEF5FF',
          100: '#BFDBF7',
          200: '#90C1EF',
          300: '#61A7E7',
          400: '#328DDF',
          500: '#2E6DA4',
          600: '#245788',
          700: '#1B416C',
          800: '#122B50',
          900: '#091534',
          DEFAULT: '#2E6DA4',
        },
        catalyst: {
          bg:   '#FEF9EC',
          mid:  '#EF9F27',
          text: '#7A4F06',
        },
        vanguard: {
          bg:   '#FDF0EE',
          mid:  '#C0392B',
          text: '#7B1D12',
        },
        cultivator: {
          bg:   '#EBF4F1',
          mid:  '#1F6B5A',
          text: '#0F3D2E',
        },
        architect: {
          bg:   '#EEF3F8',
          mid:  '#2E6DA4',
          text: '#1A3A5C',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'Arial', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
