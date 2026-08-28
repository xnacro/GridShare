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
          canvas: '#F5F7F3',
          canvasSoft: '#EEF1EB',
          surface: '#FFFFFF',
          surfaceElevated: '#FBFCFA',
          
          // Typography
          graphite: '#15211B',
          forestInk: '#17382B',
          secondary: '#5E6A63',
          muted: '#87918B',
          
          // Borders
          border: '#DCE4DE',
          borderSoft: '#DCE4DE',
          borderStrong: '#C7D2CB',
          
          // Brand & Energy Accents
          deepForest: '#12392B',
          forest: '#17513B',
          emerald: '#209B67',
          brightEnergy: '#41C98A',
          softEmerald: '#E7F6EE',
          
          // Solar
          solarGold: '#E7AA31',
          softSolar: '#FFF3D7',
          
          // Battery
          batteryAmber: '#D79A27',
          
          // Grid
          gridBlue: '#397BD2',
          softGrid: '#EAF2FC',
          
          // Deficit / Alert
          deficitCoral: '#D85D5D',
          softCoral: '#FDECEC',
          
          // AI Intelligence Layer (Secondary Accent)
          aiViolet: '#7359C8',
          softAi: '#F1EDFF',
        },
        brand: {
          50: '#E7F6EE',
          100: '#C7EDD9',
          500: '#41C98A',
          600: '#209B67',
          700: '#17513B',
          800: '#12392B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
        'sm': '10px',
        'md': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '26px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(21, 33, 27, 0.03)',
        'card': '0 1px 3px 0 rgba(21, 33, 27, 0.04), 0 1px 2px -1px rgba(21, 33, 27, 0.03)',
        'elevated': '0 4px 16px -2px rgba(21, 33, 27, 0.06), 0 2px 6px -1px rgba(21, 33, 27, 0.03)',
        'modal': '0 20px 30px -6px rgba(21, 33, 27, 0.10), 0 10px 12px -5px rgba(21, 33, 27, 0.04)',
      },
    },
  },
  plugins: [],
}
