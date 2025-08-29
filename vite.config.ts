// vite config
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [tailwindcss()]
})