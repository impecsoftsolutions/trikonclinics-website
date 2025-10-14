/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trikon-red': '#E31E24',
        'trikon-cyan': '#4DD0E1',
        'trikon-purple': '#7B68EE',
        'theme-primary': 'var(--color-primary)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-accent': 'var(--color-accent)',
        'theme-success': 'var(--color-success)',
        'theme-warning': 'var(--color-warning)',
        'theme-error': 'var(--color-error)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-bg-light': 'var(--color-bg-light)',
        'theme-bg-dark': 'var(--color-bg-dark)',
      },
    },
  },
  plugins: [],
};
