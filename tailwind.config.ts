import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6fdf8',
          100: '#b3f7ec',
          200: '#80f1e0',
          300: '#4debd4',
          400: '#26e4ca',
          500: '#00D4AA',
          600: '#00bf99',
          700: '#00a382',
          800: '#00876b',
          900: '#006b54',
        },
        dark: '#0D1F2D',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config
