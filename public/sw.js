// GitHub Pages 对所有响应硬写 Cache-Control: max-age=600，public/_headers 在这里不起作用，
// 所以回访用户要重新拉 vendor.js 和全部缩略图。这个 SW 是 GitHub Pages 上唯一可用的缓存手段。
const STATIC = 'wei-log-static'   // 带内容哈希的 JS/CSS：文件名变了就是新内容，可长期缓存
const MEDIA = 'wei-log-media'     // 作品图片：stale-while-revalidate，先给旧的再后台换新
const HTML = 'wei-log-html'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 视频不接管：SW 代理会破坏 Range 分段请求，进度条就拖不动了
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.pathname)) return

  // 导航与 HTML 永远优先走网络，保证 push 之后刷新就能看到新版本
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(HTML).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req))
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(STATIC).then((c) => c.put(req, copy))
          }
          return res
        })
      )
    )
    return
  }

  if (url.pathname.includes('/portfolios/')) {
    e.respondWith(
      caches.open(MEDIA).then(async (cache) => {
        const hit = await cache.match(req)
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => null)
        return hit || (await network) || Response.error()
      })
    )
  }
})
