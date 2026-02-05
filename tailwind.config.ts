import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '898px',
      // xl:"1024px"
    },
    container: {
      center: true,
    },
    extend: {
      animation: {
        'gradient-x': 'gradient-x 10s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'custom-gradient':
          'linear-gradient(150deg, #1B1B16 1.28%, #565646 90.75%)',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #9867F0, #ED4E50)',
        'teal-gradient': 'linear-gradient(135deg, #0d9488, #0891b2, #2563eb)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(152, 103, 240, 0.5)',
        'teal-glow': '0 0 40px rgba(13, 148, 136, 0.5)',
      },
      colors: {
        'primary': {
          "50": "#E1F2E1",
          "100": "#C0E7C2",
          "200": "#9DDFA0",
          "300": "#78D97B",
          "400": "#50D555",
          "500": "#2AD02F",
          "600": "#1DB322",
          "700": "#129417",
          "800": "#0A730E",
          "900": "#054F07",
          "950": "#012802"
        },
      },
    },
  },
  plugins: [],
};
export default config;
