// ============================================================
// 自动扫描 public/portfolios 目录，生成 src/data.js
//
// 用法：
//   1. 把作品文件放到 public/portfolios/<分类文件夹>/ 下
//   2. 运行 npm run scan
//   3. 提交并推送（git add . && git commit && git push），自动部署上线
//
// 规则：
//   - 图片 (.jpg/.jpeg/.png/.webp/.gif)      → 图片作品
//   - 视频 (.mp4/.webm/.mov)                 → 视频作品
//   - 视频同目录下的同名海报图片（如 xxx_poster.jpg）自动作为该视频封面
//   - 每个文件夹可放一个 meta.json 自定义标题/描述：
//       {
//         "女1_merge.png": { "title": "女角色 1", "desc": "AI 短剧角色设计" },
//         "40s微笑.mp4": "40s 微笑"   // 只写标题也可以
//       }
//   - 文件夹名 → 分类 key（见 FOLDER_CATEGORIES，可自行添加新分类）
// ============================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const portfoliosDir = path.join(rootDir, 'public', 'portfolios')
const dataFile = path.join(rootDir, 'src', 'data.js')

// 文件夹名 → 分类配置（新增分类：在这里加一行即可）
const FOLDER_CATEGORIES = {
  'AI短剧':     { key: 'ai-drama',   label: 'AI短剧' },
  'AI视频作品集': { key: 'ai-video',   label: 'AI视频' },
  '电商':       { key: 'ecommerce',  label: '电商' },
  '生活':       { key: 'life',       label: '生活' },
  '剪辑作品':    { key: 'video-edit', label: '剪辑' },
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])
const POSTER_SUFFIXES = ['_poster', '-poster', '_cover', '-cover']

// ---------- 工具函数 ----------

function toTitle(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
  return base
    .replace(/_(?=\d)/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPoster(fileName) {
  const base = path.basename(fileName, path.extname(fileName)).toLowerCase()
  return POSTER_SUFFIXES.some((s) => base.endsWith(s))
}

function findPosterForVideo(videoName, files) {
  const videoBase = path.basename(videoName, path.extname(videoName)).toLowerCase()
  // 精确匹配：视频名 + 海报后缀（如 意外的重逢.mp4 → 意外的重逢_poster.jpg）
  const exact = files.find(
    (f) =>
      isPoster(f) &&
      path.basename(f, path.extname(f)).toLowerCase().startsWith(videoBase),
  )
  return exact || null // 没有海报就返回 null，封面直接用视频本身
}

function readMeta(folderPath) {
  const metaFile = path.join(folderPath, 'meta.json')
  if (!fs.existsSync(metaFile)) return {}
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
  } catch (err) {
    console.warn(`  ⚠ meta.json 解析失败（已忽略）: ${metaFile}\n    ${err.message}`)
    return {}
  }
}

// ---------- 主逻辑 ----------

function scanFolder(folderName) {
  const folderPath = path.join(portfoliosDir, folderName)
  if (!fs.existsSync(folderPath)) return []

  const allFiles = fs.readdirSync(folderPath)
    .filter((f) => !f.startsWith('.'))
    .sort()

  const images = allFiles.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
  const videos = allFiles.filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))

  const catConfig = FOLDER_CATEGORIES[folderName] || {
    key: 'folder-' + folderName,
    label: folderName,
  }
  const meta = readMeta(folderPath)

  const items = []

  for (const img of images) {
    if (isPoster(img)) continue // 海报由视频条目引用，不单独展示
    const m = meta[img]
    items.push({
      title: (typeof m === 'string' ? m : (m && m.title)) || toTitle(img),
      desc: (m && m.desc) || `${catConfig.label}作品`,
      cat: catConfig.key,
      type: 'image',
      img: `/portfolios/${folderName}/${img}`,
    })
  }

  for (const v of videos) {
    const poster = findPosterForVideo(v, allFiles)
    const m = meta[v]
    items.push({
      title: (typeof m === 'string' ? m : (m && m.title)) || toTitle(v),
      desc: (m && m.desc) || `${catConfig.label}作品`,
      cat: catConfig.key,
      type: 'video',
      img: poster ? `/portfolios/${folderName}/${poster}` : `/portfolios/${folderName}/${v}`,
      video: `/portfolios/${folderName}/${v}`,
    })
  }

  return items
}

function buildDataJs(projects, catToFolder) {
  const lines = []
  lines.push('// ========= 作品数据 =========')
  lines.push('// 由 npm run scan 自动生成 — 请勿手动编辑 projects 数组')
  lines.push('const projects = [')

  // 按分类分组输出，方便阅读
  const grouped = {}
  for (const p of projects) {
    if (!grouped[p.cat]) grouped[p.cat] = []
    grouped[p.cat].push(p)
  }

  const catLabels = {}
  for (const cfg of Object.values(FOLDER_CATEGORIES)) catLabels[cfg.key] = cfg.label

  for (const [cat, items] of Object.entries(grouped)) {
    const comment = catToFolder[cat] || catLabels[cat] || cat
    lines.push(`  // ${comment}`)
    for (const p of items) {
      const parts = [
        `title: '${p.title}'`,
        `desc: '${p.desc}'`,
        `cat: '${p.cat}'`,
        `type: '${p.type}'`,
        `img: '${p.img}'`,
      ]
      if (p.video) parts.push(`video: '${p.video}'`)
      lines.push(`  { ${parts.join(', ')} },`)
    }
  }

  lines.push(']')
  return lines.join('\n')
}

function buildCategories(projects) {
  const seen = new Set()
  const cats = [{ key: 'all', label: '全部' }]
  for (const p of projects) {
    if (!seen.has(p.cat)) {
      seen.add(p.cat)
      const cfg = Object.values(FOLDER_CATEGORIES).find((c) => c.key === p.cat)
      cats.push({ key: p.cat, label: cfg ? cfg.label : p.cat })
    }
  }
  return cats
}

// ---------- 执行 ----------

if (!fs.existsSync(portfoliosDir)) {
  console.error(`✗ 未找到目录: ${portfoliosDir}`)
  process.exit(1)
}

// 按 FOLDER_CATEGORIES 定义顺序输出分类，未知文件夹排最后
const knownOrder = Object.keys(FOLDER_CATEGORIES)
const folderNames = fs.readdirSync(portfoliosDir)
  .filter((name) => fs.statSync(path.join(portfoliosDir, name)).isDirectory())
  .sort((a, b) => {
    const ia = knownOrder.indexOf(a)
    const ib = knownOrder.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b, 'zh-CN')
  })

const projects = []
const catToFolder = {}
for (const folder of folderNames) {
  const items = scanFolder(folder)
  if (!FOLDER_CATEGORIES[folder]) {
    console.warn(`  ⚠ 新文件夹「${folder}」不在 FOLDER_CATEGORIES 中，已使用默认分类（可在脚本顶部添加）`)
  }
  for (const item of items) catToFolder[item.cat] = folder
  projects.push(...items)
}

const categories = buildCategories(projects)

const output = [
  buildDataJs(projects, catToFolder),
  '',
  'const filterCategories = [',
  ...categories.map((c) => `  { key: '${c.key}', label: '${c.label}' },`),
  ']',
  '',
  'export { projects, filterCategories }',
  '',
].join('\n')

fs.writeFileSync(dataFile, output, 'utf-8')

// 打印结果
console.log(`✓ 扫描完成！共生成 ${projects.length} 个作品：\n`)
for (const folder of folderNames) {
  const count = projects.filter((p) => p.img.includes(`/${folder}/`)).length
  console.log(`  📁 ${folder}  →  ${count} 个作品`)
}
console.log('\n已写入 src/data.js')
console.log('接下来：git add . && git commit -m "add works" && git push 即可自动部署上线')