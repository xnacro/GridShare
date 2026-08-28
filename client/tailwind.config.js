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
          canvas: '#F9FAF6',
          canvasSoft: '#F3F6EC',
          surface: '#FFFFFF',
          surfaceElevated: '#FBFCFA',
          
          // Typography (Near-Black Green palette)
          graphite: '#011207',
          forestInk: '#012F13',
          secondary: '#4A5B4F',
          muted: '#7A8C7F',
          
          // Borders
          border: '#D5E6BE',
          borderSoft: '#E2F0CC',
          borderStrong: '#BED69E',
          
          // Palette from user image
          sageMint: '#E2F0CC',
          appleGreen: '#8BC53D',
          darkForest: '#012F13',
          nearBlack: '#011207',
          
          // Brand & Energy Accents
          deepForest: '#012F13',
          forest: '#0B3E1D',
          emerald: '#8BC53D',
          brightEnergy: '#8BC53D',
          softEmerald: '#E2F0CC',
          
          // Solar
          solarGold: '#8BC53D',
          softSolar: '#E2F0CC',
          
          // Battery
          batteryAmber: '#8BC53D',
          
          // Grid
          gridBlue: '#012F13',
          softGrid: '#E2F0CC',
          
          // Deficit / Alert
          deficitCoral: '#D45C5C',
          softCoral: '#FDECEC',
          
          // AI Intelligence Layer
          aiViolet: '#012F13',
          softAi: '#E2F0CC',
        },
        brand: {
          50: '#F4F9EB',
          100: '#E2F0CC',
          500: '#8BC53D',
          600: '#75AA2F',
          700: '#0B3E1D',
          800: '#012F13',
          900: '#011207',
        },
      },
      fontFamily: {
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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
