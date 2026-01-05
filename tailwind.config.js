/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired dark palette
        'surface': {
          DEFAULT: '#000000',
          '50': '#1d1d1f',
          '100': '#161617',
          '200': '#0d0d0d',
        },
        'elevated': {
          DEFAULT: '#1c1c1e',
          'high': '#2c2c2e',
        },
        'accent': {
          blue: '#0a84ff',
          green: '#30d158',
          orange: '#ff9f0a',
          pink: '#ff375f',
          purple: '#bf5af2',
          teal: '#64d2ff',
        },
        'text': {
          primary: '#f5f5f7',
          secondary: '#86868b',
          tertiary: '#6e6e73',
        },
        // Legacy support
        'void': '#000000',
        'void-light': '#1c1c1e',
        'void-lighter': '#2c2c2e',
        'neon-cyan': '#64d2ff',
        'neon-green': '#30d158',
        'neon-pink': '#ff375f',
        'neon-orange': '#ff9f0a',
        'neon-purple': '#bf5af2',
        'neon-yellow': '#ffd60a',
        'terminal-green': '#30d158',
        'warn-amber': '#ff9f0a',
        'error-red': '#ff453a',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        'display': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        'xl': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.025em' }],
        '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'elevated': '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
        'glow-blue': '0 0 20px rgba(10,132,255,0.3)',
        'glow-green': '0 0 20px rgba(48,209,88,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
