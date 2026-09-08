/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D1117',
          secondary: '#161B22',
          tertiary: '#21262D',
        },
        border: {
          primary: '#30363D',
          secondary: '#484F58',
        },
        text: {
          primary: '#C9D1D9',
          secondary: '#8B949E',
          muted: '#6E7681',
        },
        accent: {
          blue: '#58A6FF',
          green: '#3FB950',
          red: '#F85149',
          purple: '#BB86FC',
          orange: '#F0883E',
          yellow: '#D29922',
        },
        signal: {
          buy: '#00C853',
          sell: '#F44336',
          hold: '#FF9800',
          strong_buy: '#00E676',
          strong_sell: '#D50000',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
