import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: {
    target: 'es2022',
    rollupOptions: {
      // the site, plus the owner's live panel at /admin
      input: { main: resolve(import.meta.dirname, 'index.html'), admin: resolve(import.meta.dirname, 'admin.html') },
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
          return undefined
        },
      },
    },
  },
})
