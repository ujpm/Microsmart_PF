/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Medical Palette
        medical: {
          50: '#f0f9ff',  // Backgrounds
          100: '#e0f2fe',
          500: '#0ea5e9', // Primary Buttons
          600: '#0284c7', // Hover States
          900: '#0c4a6e', // Text / Headers
        },
        // For Alerting (Malaria Positive)
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        // For Safety (Healthy)
        success: {
          500: '#22c55e',
        }
      }
    },
  },
  plugins: [],
}