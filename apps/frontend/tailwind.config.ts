import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use 'class' strategy instead of 'media'
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
