import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cấu hình Vite cho React 18
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
