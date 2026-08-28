/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gs: {
          bg: '#F5F7F6',
          surface: '#FFFFFF',
          elevated: '#FBFCFB',
          text: {
            primary: '#102019',
            secondary: '#5D6B64',
            muted: '#83908A',
          },
          border: '#DDE5E0',
          dark: '#12251D',
          forest: '#163A2B',
          emerald: '#168A5A',
          green: '#34B978',
          mint: '#E7F5EE',
          solar: '#E8A72B',
          softSolar: '#FFF4D8',
          ai: '#7657D8',
          softAi: '#F0EBFF',
          grid: '#3678D4',
          softGrid: '#EAF2FF',
          coral: '#D95C5C',
          softCoral: '#FDECEC',
          battery: '#D99A26',
        },
        brand: {
          50: '#E7F5EE',
          100: '#d1fae5',
          500: '#34B978',
          600: '#168A5A',
          700: '#163A2B',
          900: '#12251D',
        },
        slate: {
          50: '#F5F7F6',
          100: '#EBF0ED',
          200: '#DDE5E0',
          300: '#CBD5CF',
          400: '#9BA8A1',
          500: '#83908A',
          600: '#5D6B64',
          700: '#3D4A43',
          800: '#23332B',
          900: '#102019',
          950: '#0B1611',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 32, 25, 0.03)',
        'card': '0 1px 3px 0 rgba(16, 32, 25, 0.04), 0 1px 2px -1px rgba(16, 32, 25, 0.04)',
        'elevated': '0 4px 6px -1px rgba(16, 32, 25, 0.05), 0 2px 4px -2px rgba(16, 32, 25, 0.03)',
        'modal': '0 20px 25px -5px rgba(16, 32, 25, 0.08), 0 8px 10px -6px rgba(16, 32, 25, 0.04)',
      }
    },
  },
  plugins: [],
}
