import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// 只在真实部署环境注册：本地 dev/preview 下 SW 会把旧资源缓存住，改了却看不到
if (import.meta.env.PROD && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker?.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
