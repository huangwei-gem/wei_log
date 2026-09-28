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

// 海报文件名去掉 _poster / -cover 等后缀 = 对应视频的文件名，
// 这样按视频名生成的缩略图才能被 scanFolder 里的 .thumbnails/<视频base>.webp 探测命中
function stripPosterSuffix(baseName) {
  const lower = baseName.toLowerCase()
  const suffix = POSTER_SUFFIXES.find((s) => lower.endsWith(s))
  return suffix ? baseName.slice(0, baseName.length - suffix.length) : baseName
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

  // 海报也要出缩略图：视频卡片原先直接加载 100–200KB 的全尺寸 JPG 封面，
  // 而图片卡片用的是 25–44KB 的 webp。缩略图按对应视频的文件名落盘。
  const base = stripPosterSuffix(path.basename(filePath, ext))

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

// ---------- 分类文件夹列举（多处共用） ----------

function listCategoryFolders() {
  return fs.readdirSync(portfoliosDir).filter((name) => {
    const p = path.join(portfoliosDir, name)
    return fs.statSync(p).isDirectory() && name !== ".thumbnails"
  })
}

// ---------- 封面质量（成片开头常有淡入，取首帧会得到纯黑封面） ----------

const MIN_POSTER_LUMA = 16

function probeDuration(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim()
    const d = parseFloat(out)
    return Number.isFinite(d) && d > 0 ? d : 0
  } catch {
    return 0
  }
}

async function meanLuma(imgPath) {
  try {
    const s = await sharp(imgPath).stats()
    // stats().channels 是对象数组，取各自的 mean 再平均
    const means = s.channels.map((c) => c.mean)
    return means.reduce((a, b) => a + b, 0) / means.length
  } catch {
    return 255 // 读不动就当没问题，别把正常流程卡住
  }
}

async function repairDarkPosters() {
  const repaired = []
  for (const folder of listCategoryFolders()) {
    const folderPath = path.join(portfoliosDir, folder)
    const files = fs.readdirSync(folderPath)
    const videos = files.filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    for (const v of videos) {
      const poster = findPosterForVideo(v, files)
      if (!poster) continue
      const posterPath = path.join(folderPath, poster)
      if ((await meanLuma(posterPath)) >= MIN_POSTER_LUMA) continue

      const dur = probeDuration(path.join(folderPath, v))
      if (!dur) continue

      // 先写到临时文件，只有确实变亮才替换 —— 判定失误时不能把好封面毁掉
      const tmpPath = posterPath + ".repair.tmp"
      let ok = false
      for (const frac of [0.4, 0.7, 0.15, 0.9]) {
        try {
          execSync(
            `ffmpeg -y -v error -i "${path.join(folderPath, v)}" -ss ${(dur * frac).toFixed(2)} -frames:v 1 -q:v 3 "${tmpPath}"`,
            { stdio: "ignore" },
          )
        } catch {
          continue
        }
        if ((await meanLuma(tmpPath)) >= MIN_POSTER_LUMA) {
          fs.renameSync(tmpPath, posterPath)
          ok = true
          break
        }
      }
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

      if (ok) repaired.push(`${folder}/${poster}`)
      else
        console.warn(
          t(
            `  WARN: ${folder}/${poster} is still too dark after re-sampling — pick a cover manually`,
            `  WARN: ${folder}/${poster} 换点取样后仍偏暗，请手动指定封面`,
          ),
        )
    }
  }
  if (repaired.length) {
    console.log(t("--- Re-sampled dark video covers ---", "--- 修正过暗的视频封面 ---"))
    for (const r of repaired) console.log(`  ${t("Fixed", "已修正")} ${r}`)
  }
}

// ---------- 体积守卫（Cloudflare Pages 单文件上限 25 MiB） ----------

const CF_FILE_LIMIT_MIB = 25

function checkFileSizeLimit() {
  const over = []
  for (const folder of listCategoryFolders()) {
    const folderPath = path.join(portfoliosDir, folder)
    for (const f of fs.readdirSync(folderPath)) {
      const fp = path.join(folderPath, f)
      if (!fs.statSync(fp).isFile()) continue
      const mib = fs.statSync(fp).size / 1048576
      if (mib > CF_FILE_LIMIT_MIB) over.push({ name: `${folder}/${f}`, mib })
    }
  }
  if (over.length) {
    console.log(t("--- File size check ---", "--- 文件体积检查 ---"))
    for (const o of over)
      console.error(
        t(
          `  X ${o.name} = ${o.mib.toFixed(1)} MiB, over the ${CF_FILE_LIMIT_MIB} MiB Cloudflare Pages per-file cap. Re-encode it or the deploy will fail.`,
          `  X ${o.name} = ${o.mib.toFixed(1)} MiB，超过 Cloudflare Pages 的 ${CF_FILE_LIMIT_MIB} MiB 单文件上限，不重压部署会失败。`,
        ),
      )
  }
  return over
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
  const present = new Set(projects.map((p) => p.cat))
  const cats = [{ key: "all", label: "全部" }]
  // 按 FOLDER_CATEGORIES 的声明顺序排，而不是按作品日期先后 —— 后者会让分类栏
  // 随着新作品的加入不断换顺序
  for (const cfg of Object.values(FOLDER_CATEGORIES)) {
    if (present.has(cfg.key)) {
      cats.push({ key: cfg.key, label: cfg.label })
      present.delete(cfg.key)
    }
  }
  for (const key of present) cats.push({ key, label: key })
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

  // Step 2: Video posters must exist before thumbnails — generateAllThumbnails now
  // derives each video's card thumbnail from its poster
  console.log(t("--- Generating video posters ---", "--- 生成视频封面 ---"))
  generateMissingPosters()

  // Step 3: Replace covers sampled from a fade-in (they come out pure black)
  await repairDarkPosters()

  // Step 4: Generate thumbnails
  await generateAllThumbnails()

  // Step 5: Fail loudly on files Cloudflare Pages cannot serve
  checkFileSizeLimit()

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
