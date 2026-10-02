/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coride: {
          dark: '#0F5132',       // Deep Forest/Emerald Green primary
          primary: '#137547',    // Vibrant Deep Green
          emerald: '#10B981',    // Vibrant Accent Green
          light: '#E8F5E9',      // Subtle Green tint background
          surface: '#F8FAFC',    // Subtle clean card background
          border: '#E2E8F0',     // Crisp minimal border
          text: '#0F172A',       // High-contrast pitch black
          muted: '#64748B'       // Slate muted text
        }
      },
      borderRadius: {
        '2xl': '1rem',      // 16px rounded cards
        '3xl': '1.5rem'     // 24px large rounded modal & hero elements
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'elevated': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.02)',
        'nav': '0 -4px 16px rgba(15, 23, 42, 0.04)'
      }
    },
  },
  plugins: [],
}
