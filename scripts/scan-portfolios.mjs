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
//   - Thumbnails (400px webp) are auto-generated for carousel use
//   - Date is auto-detected from file mtime, or override in meta.json:
//       { "girl1.png": { "title": "Girl 1", "desc": "...", "date": "2026-08-01" } }
//   - Folder name -> category key (see FOLDER_CATEGORIES below;
//     add a new line here to register a new category)
//
//   Optional: add --english for English console output
//   (npm run scan -- --english)
// ============================================================

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const portfoliosDir = path.join(rootDir, "public", "portfolios")
const thumbDir = path.join(portfoliosDir, ".thumbnails")
const dataFile = path.join(rootDir, "src", "data.js")

// Output language: add --english flag for English messages
const ENGLISH = process.argv.includes("--english")
const t = (en, zh) => (ENGLISH ? en : zh)

// Folder name -> category config (register a new category here)
const FOLDER_CATEGORIES = {
  "AI短剧":     { key: "ai-drama",   label: "AI短剧" },
  "AI视频作品集": { key: "ai-video",   label: "AI视频" },
  "电商":       { key: "ecommerce",  label: "电商" },
  "生活":       { key: "life",       label: "生活" },
  "剪辑作品":    { key: "video-edit", label: "剪辑" },
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"])
const POSTER_SUFFIXES = ["_poster", "-poster", "_cover", "-cover"]

// ---------- Helpers ----------

function toTitle(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
  return base
    .replace(/_(?=\d)/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
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
  const metaFile = path.join(folderPath, "meta.json")
  if (!fs.existsSync(metaFile)) return {}
  try {
    return JSON.parse(fs.readFileSync(metaFile, "utf-8"))
  } catch (err) {
    console.warn(
      t(
        `  WARN: Failed to parse meta.json (ignored): ${metaFile}\n    ${err.message}`,
        `  WARN: meta.json 解析失败（已忽略）: ${metaFile}\n    ${err.message}`,
      ),
    )
    return {}
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + "B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB"
  return (bytes / (1024 * 1024)).toFixed(2) + "MB"
}

function isFfmpegAvailable() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

// ---------- Image compression ----------

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const sizeBefore = fs.statSync(filePath).size
  const tmpPath = filePath + ".tmp"

  try {
    if (ext === ".png") {
      await sharp(filePath)
        .png({ quality: 80, effort: 10, palette: true })
        .toFile(tmpPath)
    } else if (ext === ".jpg" || ext === ".jpeg") {
      await sharp(filePath)
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(tmpPath)
    } else {
      return
    }

    const sizeAfter = fs.statSync(tmpPath).size
    if (sizeAfter < sizeBefore * 0.95) {
      fs.renameSync(tmpPath, filePath)
      const saved = Math.round((1 - sizeAfter / sizeBefore) * 100)
      return { name: path.basename(filePath), before: sizeBefore, after: sizeAfter, saved }
    } else {
      fs.unlinkSync(tmpPath)
    }
  } catch (err) {
    console.error(t(`  ERR compressing ${filePath}: ${err.message}`, `  ERR 压缩 ${filePath}: ${err.message}`))
  }
}

async function compressAllImages() {
  console.log(t("--- Compressing images ---", "--- 压缩图片 ---"))
  const folders = fs.readdirSync(portfoliosDir).filter((name) =>
    fs.statSync(path.join(portfoliosDir, name)).isDirectory() && name !== ".thumbnails",
  )
  const results = []
  for (const folder of folders) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (IMAGE_EXT.has(ext)) {
        const r = await compressImage(path.join(folderPath, file))
        if (r) results.push(r)
      }
    }
  }
  if (results.length > 0) {
    let totalBefore = 0, totalAfter = 0
    for (const r of results) {
      totalBefore += r.before
      totalAfter += r.after
      console.log(`  ${r.name}: ${formatSize(r.before)} -> ${formatSize(r.after)} (${t("saved", "节省")} ${r.saved}%)`)
    }
    console.log(t(`  Total: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (saved ${Math.round((1 - totalAfter / totalBefore) * 100)}%)`, `  总计: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (节省 ${Math.round((1 - totalAfter / totalBefore) * 100)}%)`))
  } else {
    console.log(t("  No images needed compression.", "  没有需要压缩的图片。"))
  }
}

// ---------- Thumbnail generation ----------

async function generateThumbnail(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (!IMAGE_EXT.has(ext)) return

  const base = path.basename(filePath, ext)
  // Skip poster images (they are already small)
  if (isPoster(filePath)) return

  const sizeBefore = fs.statSync(filePath).size
  const thumbName = base + ".webp"
  const thumbPath = path.join(thumbDir, thumbName)

  // Skip if thumbnail exists and is newer than source
  if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).mtimeMs > fs.statSync(filePath).mtimeMs) {
    return
  }

  try {
    await sharp(filePath)
      .resize(400, 533, { fit: "cover", position: "center" })
      .webp({ quality: 75, effort: 4 })
      .toFile(thumbPath)

    const sizeAfter = fs.statSync(thumbPath).size
    const saved = Math.round((1 - sizeAfter / sizeBefore) * 100)
    return { name: base, before: sizeBefore, after: sizeAfter, saved }
  } catch (err) {
    console.error(t(`  ERR generating thumbnail for ${filePath}: ${err.message}`, `  ERR 生成缩略图 ${filePath}: ${err.message}`))
  }
}

async function generateAllThumbnails() {
  console.log(t("--- Generating thumbnails ---", "--- 生成缩略图 ---"))

  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true })
  }

  const folders = fs.readdirSync(portfoliosDir).filter((name) =>
    fs.statSync(path.join(portfoliosDir, name)).isDirectory() && name !== ".thumbnails",
  )
  const results = []
  for (const folder of folders) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      if (fs.statSync(filePath).isFile()) {
        const r = await generateThumbnail(filePath)
        if (r) results.push(r)
      }
    }
  }
  if (results.length > 0) {
    let totalBefore = 0, totalAfter = 0
    for (const r of results) {
      totalBefore += r.before
      totalAfter += r.after
      console.log(`  ${r.name}: ${formatSize(r.before)} -> ${formatSize(r.after)} (${t("saved", "节省")} ${r.saved}%)`)
    }
    console.log(t(`  Total: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (saved ${Math.round((1 - totalAfter / totalBefore) * 100)}%)`, `  总计: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (节省 ${Math.round((1 - totalAfter / totalBefore) * 100)}%)`))
  } else {
    console.log(t("  All thumbnails up to date.", "  所有缩略图已是最新。"))
  }
}

// ---------- Video poster generation ----------

function generateMissingPosters() {
  if (!isFfmpegAvailable()) {
    console.log(t("  ffmpeg not found, skipping poster generation.", "  未找到 ffmpeg，跳过视频封面生成。"))
    return
  }
  const folders = fs.readdirSync(portfoliosDir).filter((name) =>
    fs.statSync(path.join(portfoliosDir, name)).isDirectory() && name !== ".thumbnails",
  )
  for (const folder of folders) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    const mp4s = files.filter((f) => f.endsWith(".mp4"))
    for (const mp4 of mp4s) {
      const base = path.basename(mp4, ".mp4")
      const poster = files.find((f) => {
        const fb = path.basename(f, path.extname(f)).toLowerCase()
        return POSTER_SUFFIXES.some((s) => fb === (base + s).toLowerCase())
      })
      if (poster) continue
      const posterPath = path.join(folderPath, base + "_poster.jpg")
      if (fs.existsSync(posterPath)) continue
      try {
        execSync(
          `ffmpeg -y -i "${path.join(folderPath, mp4)}" -vframes 1 -q:v 3 "${posterPath}"`,
          { stdio: "ignore" },
        )
        console.log(`  ${t("Generated poster for", "已生成封面")} ${mp4} -> ${base}_poster.jpg`)
      } catch {
        // silently skip
      }
    }
  }
}

// ---------- Scanner ----------

function scanFolder(folderName) {
  const folderPath = path.join(portfoliosDir, folderName)
  const allFiles = fs.readdirSync(folderPath)
  const images = allFiles.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
  const videos = allFiles.filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))

  const catConfig = FOLDER_CATEGORIES[folderName] || {
    key: "folder-" + folderName,
    label: folderName,
  }
  const meta = readMeta(folderPath)

  const items = []

  for (const img of images) {
    if (isPoster(img)) continue
    const m = meta[img]
    const filePath = path.join(folderPath, img)
    const mtime = fs.statSync(filePath).mtime
    const dateStr = mtime.toISOString().split("T")[0]
    const base = path.basename(img, path.extname(img))
    const thumbPath = `/portfolios/.thumbnails/${base}.webp`

    items.push({
      title: (typeof m === "string" ? m : (m && m.title)) || toTitle(img),
      desc: (m && m.desc) || `${catConfig.label}作品`,
      date: (m && m.date) || dateStr,
      cat: catConfig.key,
      type: "image",
      img: `/portfolios/${folderName}/${img}`,
      thumb: thumbPath,
    })
  }

  for (const v of videos) {
    const poster = findPosterForVideo(v, allFiles)
    const m = meta[v]
    const filePath = path.join(folderPath, v)
    const mtime = fs.statSync(filePath).mtime
    const dateStr = mtime.toISOString().split("T")[0]
    const base = path.basename(v, path.extname(v))
    const thumbPath = fs.existsSync(path.join(thumbDir, base + ".webp"))
      ? `/portfolios/.thumbnails/${base}.webp`
      : (poster ? `/portfolios/${folderName}/${poster}` : `/portfolios/${folderName}/${v}`)

    items.push({
      title: (typeof m === "string" ? m : (m && m.title)) || toTitle(v),
      desc: (m && m.desc) || `${catConfig.label}作品`,
      date: (m && m.date) || dateStr,
      cat: catConfig.key,
      type: "video",
      img: poster ? `/portfolios/${folderName}/${poster}` : `/portfolios/${folderName}/${v}`,
      video: `/portfolios/${folderName}/${v}`,
      thumb: thumbPath,
    })
  }

  // Sort by date descending (newest first)
  items.sort((a, b) => b.date.localeCompare(a.date))

  return items
}

function buildDataJs(projects) {
  const lines = []
  lines.push("// ========= Work Data =========")
  lines.push("// Auto-generated by \"npm run scan\" - do not edit projects manually")
  lines.push("const projects = [")

  for (const p of projects) {
    const parts = [
      `title: '${p.title.replace(/'/g, "\\'")}'`,
      `desc: '${p.desc.replace(/'/g, "\\'")}'`,
      `cat: '${p.cat}'`,
      `type: '${p.type}'`,
      `img: '${p.img}'`,
    ]
    if (p.video) parts.push(`video: '${p.video}'`)
    if (p.thumb) parts.push(`thumb: '${p.thumb}'`)
    if (p.date) parts.push(`date: '${p.date}'`)
    lines.push(`  { ${parts.join(", ")} },`)
  }

  lines.push("]")
  return lines.join("\n")
}

function buildCategories(projects) {
  const seen = new Set()
  const cats = [{ key: "all", label: "全部" }]
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
    console.error(t(`X Folder not found: ${portfoliosDir}`, `ERR 未找到目录: ${portfoliosDir}`))
    process.exit(1)
  }

  // Step 1: Compress images
  await compressAllImages()

  // Step 2: Generate thumbnails
  await generateAllThumbnails()

  // Step 3: Auto-generate missing video posters
  console.log(t("--- Generating video posters ---", "--- 生成视频封面 ---"))
  generateMissingPosters()

  // Step 4: Scan folders and build data
  const knownOrder = Object.keys(FOLDER_CATEGORIES)
  const folderNames = fs.readdirSync(portfoliosDir)
    .filter((name) => fs.statSync(path.join(portfoliosDir, name)).isDirectory() && name !== ".thumbnails")
    .sort((a, b) => {
      const ia = knownOrder.indexOf(a)
      const ib = knownOrder.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b, "zh-CN")
    })

  const projects = []
  for (const folder of folderNames) {
    const items = scanFolder(folder)
    if (!FOLDER_CATEGORIES[folder]) {
      console.warn(
        t(
          `  WARN: Folder "${folder}" is not in FOLDER_CATEGORIES, using default category (add it at the top of this script)`,
          `  WARN: 新文件夹「${folder}」不在 FOLDER_CATEGORIES 中，已使用默认分类（可在脚本顶部添加）`,
        ),
      )
    }
    // Items within each folder are already sorted by date descending
    projects.push(...items)
  }

  // Sort all projects by date descending (newest first overall)
  projects.sort((a, b) => b.date.localeCompare(a.date))

  const categories = buildCategories(projects)

  const output = [
    buildDataJs(projects),
    "",
    "const filterCategories = [",
    ...categories.map((c) => `  { key: '${c.key}', label: '${c.label}' },`),
    "]",
    "",
    "export { projects, filterCategories }",
    "",
  ].join("\n")

  fs.writeFileSync(dataFile, output, "utf-8")

  // Summary
  console.log(t(`\n✓ Scan complete! Generated ${projects.length} work(s):\n`, `\n✓ 扫描完成！共生成 ${projects.length} 个作品：\n`))
  for (const folder of folderNames) {
    const count = projects.filter((p) => p.cat === (FOLDER_CATEGORIES[folder]?.key || `folder-${folder}`)).length
    console.log(`  📁 ${folder}  →  ${count} ${t("item(s)", "个作品")}`)
  }
  console.log(t("\nWritten to src/data.js", "\n已写入 src/data.js"))
  console.log(t("Next: git add . && git commit -m \"add works\" && git push to deploy", "接下来：git add . && git commit -m \"add works\" && git push 即可自动部署上线"))
}

await main()
