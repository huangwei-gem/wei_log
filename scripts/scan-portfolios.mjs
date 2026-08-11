// ============================================================
// Auto-scan public/portfolios and generate src/data.js
//
// Usage:
//   1. Put your work files into public/portfolios/<category-folder>/
//   2. Run:  npm run scan
//   3. Commit & push to deploy (git add . && git commit && git push)
//
// Rules:
//   - Images (.jpg/.jpeg/.png/.webp/.gif)   -> image work
//   - Videos (.mp4/.webm/.mov)              -> video work
//   - A poster image with the same base name (e.g. xxx_poster.jpg)
//     is automatically used as the video cover
//   - Videos without a poster will auto-generate one from the first
//     frame (requires ffmpeg, silently skipped if unavailable)
//   - Images are automatically compressed via sharp (lossy PNG/JPEG)
//     to reduce page load times
//   - Each folder may contain a meta.json to customize title/desc:
//       {
//         "girl1.png": { "title": "Girl 1", "desc": "Character design" },
//         "video1.mp4": "My Video"   // string = title only
//       }
//   - Folder name -> category key (see FOLDER_CATEGORIES below;
//     add a new line here to register a new category)
//
//   Optional: add --english for English console output
//   (npm run scan -- --english)
// ============================================================

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const portfoliosDir = path.join(rootDir, 'public', 'portfolios')
const dataFile = path.join(rootDir, 'src', 'data.js')

// Output language: add --english flag for English messages
const ENGLISH = process.argv.includes('--english')
const t = (en, zh) => (ENGLISH ? en : zh)

// Folder name -> category config (register a new category here)
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

// ---------- Helpers ----------

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
  const exact = files.find(
    (f) =>
      isPoster(f) &&
      path.basename(f, path.extname(f)).toLowerCase().startsWith(videoBase),
  )
  return exact || null
}

function readMeta(folderPath) {
  const metaFile = path.join(folderPath, 'meta.json')
  if (!fs.existsSync(metaFile)) return {}
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
  } catch (err) {
    console.warn(
      t(
        `  WARN: Failed to parse meta.json (ignored): ${metaFile}\n    ${err.message}`,
        `  ⚠ meta.json 解析失败（已忽略）: ${metaFile}\n    ${err.message}`,
      ),
    )
    return {}
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB'
}

function isFfmpegAvailable() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// ---------- Image compression ----------

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const sizeBefore = fs.statSync(filePath).size
  const tmpPath = filePath + '.tmp'

  try {
    if (ext === '.png') {
      await sharp(filePath)
        .png({ quality: 80, effort: 10, palette: true })
        .toFile(tmpPath)
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(filePath)
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(tmpPath)
    } else {
      return // webp/gif — skip
    }

    const sizeAfter = fs.statSync(tmpPath).size
    // Only replace if compression actually saved space (>5%)
    if (sizeAfter < sizeBefore * 0.95) {
      fs.renameSync(tmpPath, filePath)
      const saved = Math.round((1 - sizeAfter / sizeBefore) * 100)
      return { name: path.basename(filePath), before: sizeBefore, after: sizeAfter, saved }
    } else {
      fs.unlinkSync(tmpPath)
      return null // not worth replacing
    }
  } catch (err) {
    try { fs.unlinkSync(tmpPath) } catch {}
    console.warn(
      t(
        `  WARN: Failed to compress ${path.basename(filePath)}: ${err.message}`,
        `  ⚠ 压缩失败 ${path.basename(filePath)}: ${err.message}`,
      ),
    )
    return null
  }
}

async function compressAllImages() {
  console.log(t('--- Compressing images ---', '--- 压缩图片 ---'))

  const folderNames = fs.readdirSync(portfoliosDir)
    .filter((name) => fs.statSync(path.join(portfoliosDir, name)).isDirectory())

  let totalBefore = 0
  let totalAfter = 0
  let compressedCount = 0

  for (const folder of folderNames) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    const images = files.filter((f) => {
      const ext = path.extname(f).toLowerCase()
      return (ext === '.png' || ext === '.jpg' || ext === '.jpeg') && !f.startsWith('.')
    })

    const results = await Promise.all(
      images.map((img) => compressImage(path.join(folderPath, img))),
    )

    for (const r of results) {
      if (r) {
        totalBefore += r.before
        totalAfter += r.after
        compressedCount++
        console.log(
          t(
            `  ${r.name}: ${formatSize(r.before)} -> ${formatSize(r.after)} (${r.saved}% saved)`,
            `  ${r.name}: ${formatSize(r.before)} → ${formatSize(r.after)}（节省 ${r.saved}%）`,
          ),
        )
      }
    }
  }

  if (compressedCount > 0) {
    const totalSaved = Math.round((1 - totalAfter / totalBefore) * 100)
    console.log(
      t(
        `  Total: ${compressedCount} image(s) compressed, ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (${totalSaved}% saved)`,
        `  共压缩 ${compressedCount} 张图片，${formatSize(totalBefore)} → ${formatSize(totalAfter)}（节省 ${totalSaved}%）`,
      ),
    )
  } else {
    console.log(t('  No images needed compression', '  没有需要压缩的图片'))
  }
}

// ---------- Auto-generate missing video posters ----------

function generateMissingPosters() {
  const hasFfmpeg = isFfmpegAvailable()
  if (!hasFfmpeg) {
    console.log(
      t('  ffmpeg not found — skipping auto poster generation', '  ffmpeg 未安装，跳过自动生成视频封面'),
    )
    return
  }

  const folderNames = fs.readdirSync(portfoliosDir)
    .filter((name) => fs.statSync(path.join(portfoliosDir, name)).isDirectory())

  for (const folder of folderNames) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    const videos = files.filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))

    for (const v of videos) {
      if (findPosterForVideo(v, files)) continue

      const videoPath = path.join(folderPath, v)
      const posterName = path.basename(v, path.extname(v)) + '_poster.jpg'
      const posterPath = path.join(folderPath, posterName)

      console.log(
        t(
          `  Generating poster for ${v}...`,
          `  🎬 正在生成封面: ${v}...`,
        ),
      )
      try {
        execSync(
          `ffmpeg -i "${videoPath}" -vframes 1 -q:v 2 -y "${posterPath}"`,
          { stdio: 'ignore', timeout: 30000 },
        )
        console.log(
          t(
            `    -> ${posterName}`,
            `    ✓ 已生成: ${posterName}`,
          ),
        )
      } catch (err) {
        console.warn(
          t(
            `    WARN: Failed to generate poster: ${err.message}`,
            `    ⚠ 生成失败: ${err.message}`,
          ),
        )
      }
    }
  }
}

// ---------- Main logic ----------

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
    if (isPoster(img)) continue
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
  lines.push('// ========= Work Data =========')
  lines.push('// Auto-generated by "npm run scan" - do not edit projects manually')
  lines.push('const projects = [')

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

// ---------- Run ----------

async function main() {
  if (!fs.existsSync(portfoliosDir)) {
    console.error(t(`X Folder not found: ${portfoliosDir}`, `✗ 未找到目录: ${portfoliosDir}`))
    process.exit(1)
  }

  // Step 1: Compress images
  await compressAllImages()

  // Step 2: Auto-generate missing video posters
  console.log(t('--- Generating video posters ---', '--- 生成视频封面 ---'))
  generateMissingPosters()

  // Step 3: Scan folders and build data
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
      console.warn(
        t(
          `  WARN: Folder "${folder}" is not in FOLDER_CATEGORIES, using default category (add it at the top of this script)`,
          `  ⚠ 新文件夹「${folder}」不在 FOLDER_CATEGORIES 中，已使用默认分类（可在脚本顶部添加）`,
        ),
      )
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

  // Summary
  console.log(t(`\n✓ Scan complete! Generated ${projects.length} work(s):\n`, `\n✓ 扫描完成！共生成 ${projects.length} 个作品：\n`))
  for (const folder of folderNames) {
    const count = projects.filter((p) => p.img.includes(`/${folder}/`)).length
    console.log(`  📁 ${folder}  →  ${count} ${t('item(s)', '个作品')}`)
  }
  console.log(t('\nWritten to src/data.js', '\n已写入 src/data.js'))
  console.log(t('Next: git add . && git commit -m "add works" && git push to deploy', '接下来：git add . && git commit -m "add works" && git push 即可自动部署上线'))
}

await main()