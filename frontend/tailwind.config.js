/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#714B67',
          dark: '#5d3e56',
          light: '#875A7B',
          hover: '#5d3e56',
        },
        secondary: {
          DEFAULT: '#017E84',
          dark: '#016169',
          light: '#00AAB0',
        },
        accent: {
          DEFAULT: '#E46E78',
          light: '#F29B9B',
        },
        success: {
          DEFAULT: '#21B799',
          light: '#D1F2EB',
        },
        warning: {
          DEFAULT: '#E4A900',
          light: '#FCF3CF',
        },
        error: {
          DEFAULT: '#E46E78',
          light: '#FADBD8',
        },
        info: {
          DEFAULT: '#5B899E',
          light: '#D6EAF8',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      },
    },
  },
  plugins: [],
}
