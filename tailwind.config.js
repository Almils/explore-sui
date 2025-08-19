// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',   // covers src/app and src/components
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        surface: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.10)',
        foreground: '#E9EEF6',
        muted: '#A6B1C2',
        brand: { 500: '#00E5FF', 600: '#00CBE3' },
        accent: { 500: '#7C5CFF', 600: '#6A49FF' },
      },
      boxShadow: { brand: '0 8px 30px rgba(0,229,255,.18)' },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #7C5CFF 0%, #00E5FF 100%)',
        'mesh':
          'radial-gradient(1400px 700px at 10% -10%, rgba(124,92,255,0.25), transparent), radial-gradient(1000px 600px at 90% 0%, rgba(0,229,255,.18), transparent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
