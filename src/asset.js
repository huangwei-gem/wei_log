// 站点部署在子路径（GitHub Pages 的 /wei_log/）时，public/ 下的资源必须带上 base 前缀。
// data.js 由扫描脚本生成，只记录 /portfolios/... 这种根相对路径；构建期 base 因平台而异，
// 所以统一在运行期用 BASE_URL 补齐。Cloudflare Pages 的 base 为 '/'，拼接结果与原来一致。
const prefix = import.meta.env.BASE_URL.replace(/\/$/, '')

export function asset(path) {
  if (!path || prefix === '') return path
  return path.startsWith('/') ? prefix + path : path
}
