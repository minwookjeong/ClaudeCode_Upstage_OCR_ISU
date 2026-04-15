import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 개발 중 /api/* 요청을 백엔드로 포워딩
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 업로드 이미지 서빙
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
