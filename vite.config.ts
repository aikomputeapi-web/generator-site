import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // Bank statement generator (Python Flask app) runs on port 5001
      '/api/bankstatement': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bankstatement/, '')
      },
      // Node Express API (auth, documents) runs on port 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
