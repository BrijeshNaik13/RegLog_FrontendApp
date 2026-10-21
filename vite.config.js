import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Bind to the IPv4 loopback address only. This keeps the dev server on
    // your own machine and makes http://127.0.0.1:5173 work reliably
    // (on some systems "localhost" resolves to IPv6 only).
    host: '127.0.0.1',
    port: 5173,
    // Fail with a clear message instead of silently moving to port 5174,
    // which would break the CORS configuration of the backend.
    strictPort: true,
    open: '/register',
  },

  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
})
