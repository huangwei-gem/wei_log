import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare Pages 部署在根路径 (/)，GitHub Pages 部署在子路径 (/wei_log/)
const base = process.env.CF_PAGES ? '/' : (process.env.GITHUB_ACTIONS ? '/wei_log/' : '/')

export default defineConfig({
  plugins: [react()],
  base,
})
