import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare Pages 部署在根路径 (/)，GitHub Pages 部署在子路径 (/wei_log/)
const base = process.env.CF_PAGES ? '/' : (process.env.GITHUB_ACTIONS ? '/wei_log/' : '/')

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    rollupOptions: {
      output: {
        // 将第三方依赖（React 等）拆分为独立 chunk，利用浏览器缓存
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})