/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#06080c',
          900: '#0a0d13',
          850: '#0e121a',
          800: '#131822',
          700: '#1b2230',
          600: '#273042',
          500: '#3a4559',
          400: '#5d6a80',
          300: '#8b97ab',
          200: '#b9c2d0',
          100: '#e3e8ef',
          50: '#f5f7fa',
        },
        brand: {
          50: '#e6fffb',
          100: '#b3fff3',
          200: '#73fbe6',
          300: '#33f0d5',
          400: '#14e0c2',
          500: '#0bbfa5',
          600: '#089885',
          700: '#0a7568',
          800: '#0c5b52',
          900: '#0d4b44',
        },
        gold: {
          100: '#fff4d1',
          200: '#ffe7a1',
          300: '#ffd866',
          400: '#f5c242',
          500: '#e0a91f',
          600: '#b78313',
          700: '#8c6211',
        },
        coral: {
          100: '#ffe0e0',
          200: '#ffb8b9',
          300: '#ff8a8c',
          400: '#ff5a5f',
          500: '#f0353b',
          600: '#c9232a',
          700: '#9d1c22',
        },
        sky: {
          100: '#dff1ff',
          200: '#b5e0ff',
          300: '#7cc8ff',
          400: '#46adfa',
          500: '#228ee6',
          600: '#1670bd',
          700: '#155b96',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
        },
        'flip-in': {
          '0%': { transform: 'perspective(900px) rotateY(90deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'perspective(900px) rotateY(0deg) scale(1)', opacity: '1' },
        },
        burst: {
          '0%': { transform: 'scale(0.2)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        scan: {
          '0%': { top: '4%' },
          '50%': { top: '92%' },
          '100%': { top: '4%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer 6s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'flip-in': 'flip-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        burst: 'burst 1.1s ease-out both',
        scan: 'scan 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
