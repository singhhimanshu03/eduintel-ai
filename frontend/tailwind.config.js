/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Class-based dark mode: adding `class="dark"` on <html> activates all `dark:` variants
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', dark: '#3730A3', light: '#818CF8' },
        success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
      },
    },
  },
  plugins: [],
};
