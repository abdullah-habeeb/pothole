/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        ink: {
          400: '#94a3b8',
          500: '#64748b',
          700: '#1e293b',
        },
      },
      borderRadius: {
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.25rem',
      },
      boxShadow: {
        floating: '0 10px 35px rgba(15, 23, 42, 0.08)',
        subtle: '0 4px 18px rgba(15, 23, 42, 0.05)',
        card: '0 12px 45px rgba(15, 23, 42, 0.12)',
      },
      spacing: {
        gutter: '1.25rem',
        section: '3.5rem',
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.32, 0.94, 0.6, 1)',
      },
    },
  },
  plugins: [],
}

