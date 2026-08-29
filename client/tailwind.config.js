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
          // Warm Ivory Canvas
          canvas: '#F7F4EA',
          canvasSoft: '#FAF8F2',
          surface: '#FFFFFF',
          surfaceElevated: '#FBFCFA',
          
          // Typography (Deep Navy Ink & Muted Gray-Green)
          ink: '#0F2233',
          navy: '#0F2233',
          graphite: '#0F2233',
          forestInk: '#0F2233',
          secondary: '#3A4C40',
          muted: '#747A6C',
          
          // Borders (Warm Neutral)
          border: '#D6D1BE',
          borderSoft: '#E8E4D5',
          borderStrong: '#C4BEA9',
          
          // GridShare v5 Semantic Palette
          teal: '#156B5C',
          tealSoft: '#E8F3F1',
          tealHover: '#105347',
          
          // Solar (Sun / Generation)
          solar: '#D99A1F',
          solarSoft: '#FAF4E8',
          solarGold: '#D99A1F',
          softSolar: '#FAF4E8',
          
          // Restrained Terracotta (Deficit / Exception / Reserve)
          terra: '#C2571F',
          terraSoft: '#F9ECE6',
          deficitCoral: '#C2571F',
          softCoral: '#F9ECE6',
          
          // Battery
          battery: '#156B5C',
          batteryAmber: '#D99A1F',
          
          // Grid & Infrastructure
          gridBlue: '#0F2233',
          softGrid: '#FAF4E8',
          
          // AI Intelligence Layer (Integrated Navy + Teal)
          ai: '#156B5C',
          aiViolet: '#0F2233',
          softAi: '#E8F3F1',
        },
        brand: {
          50: '#FAF8F2',
          100: '#E8F3F1',
          500: '#156B5C',
          600: '#105347',
          700: '#0F2233',
          800: '#0F2233',
          900: '#07131D',
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
