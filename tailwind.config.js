/** @type {import('tailwindcss').Config} */

function withAlpha(variable) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variable}) / ${opacityValue})`;
    }
    return `rgb(var(${variable}))`;
  };
}

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eeedfa',
          100: '#d5d3f0',
          200: '#b3b0e0',
          300: '#8b87cc',
          400: '#6a64b8',
          500: '#4a44a8',
          600: '#312c85',
          700: '#28236e',
          800: '#1f1b5c',
          900: '#161247',
        },
        seller: {
          50: '#e8f5ef',
          100: '#c8e6d8',
          200: '#a4d4be',
          300: '#7cc2a3',
          400: '#5cb896',
          500: '#398269',
          600: '#2d6854',
          700: '#235240',
          800: '#1a3d30',
          900: '#102920',
        },
        coral: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ff9e9e',
          400: '#FF8888',
          500: '#FF6B6B',
          600: '#E64545',
          700: '#c23030',
          800: '#a12828',
          900: '#832525',
        },
        accent: {
          50: '#e8faf9',
          100: '#c5f2ee',
          200: '#9de8e1',
          300: '#6FE0D8',
          400: '#4ECDC4',
          500: '#3AB5AD',
          600: '#2d9a93',
          700: '#237c76',
          800: '#1c625d',
          900: '#164c48',
        },
        warning: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#FF9800',
          600: '#F57C00',
          700: '#EF6C00',
          800: '#E65100',
          900: '#BF360C',
        },
        gray: {
          50: withAlpha('--gray-50'),
          100: withAlpha('--gray-100'),
          200: withAlpha('--gray-200'),
          300: withAlpha('--gray-300'),
          400: withAlpha('--gray-400'),
          500: withAlpha('--gray-500'),
          600: withAlpha('--gray-600'),
          700: withAlpha('--gray-700'),
          800: withAlpha('--gray-800'),
          900: withAlpha('--gray-900'),
        },
        surface: {
          DEFAULT: withAlpha('--surface'),
          alt: withAlpha('--surface-alt'),
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
