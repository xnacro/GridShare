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
          canvas: '#F5F6F2',
          surface: '#FFFFFF',
          dark: '#12251D',
          deepForest: '#173C2B',
          emerald: '#1C9A67',
          brightEnergy: '#39C985',
          softEmerald: '#E7F5EE',
          aiViolet: '#7357C8',
          softAi: '#F0ECFF',
          solarAmber: '#E7A82D',
          softSolar: '#FFF3D7',
          gridBlue: '#3A78D1',
          softGrid: '#EAF1FD',
          text: '#142019',
          secondary: '#5C6962',
          border: '#DDE4DF',
        },
        brand: {
          50: '#E7F5EE',
          100: '#d1fae5',
          500: '#39C985',
          600: '#1C9A67',
          700: '#173C2B',
          800: '#12251D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(20, 32, 25, 0.03)',
        'card': '0 1px 3px 0 rgba(20, 32, 25, 0.04), 0 1px 2px -1px rgba(20, 32, 25, 0.04)',
        'elevated': '0 4px 12px -2px rgba(20, 32, 25, 0.06), 0 2px 6px -1px rgba(20, 32, 25, 0.03)',
        'modal': '0 20px 25px -5px rgba(20, 32, 25, 0.08), 0 8px 10px -6px rgba(20, 32, 25, 0.04)',
      }
    },
  },
  plugins: [],
}
