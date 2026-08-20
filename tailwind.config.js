export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        'navy-light': '#1a2942',
        'navy-lighter': '#1e3a5f',
        primary: '#2563EB',
        'primary-dark': '#1e40af',
        purple: '#7C3AED',
        'purple-dark': '#6d28d9',
        cyan: '#06B6D4',
        'cyan-light': '#22d3ee',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F172A 0%, #0f1c38 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-purple': '0 0 30px rgba(124, 58, 237, 0.2)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
