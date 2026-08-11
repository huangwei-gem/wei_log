# Wei Log — 个人作品集

> 黄维 (Wei) 的个人作品集网站 · AI 视觉创作者 / 设计师

基于 **React 18 + Vite 6** 构建的个人作品集，支持图片与视频作品展示、暗色/亮色双主题，部署于 Cloudflare Pages（push main 自动上线）。

## 功能特性

- 🎨 **暗色 / 亮色双主题** — 红色强调色，一键切换
- 📱 **响应式设计** — 适配桌面端与移动端
- 🖼️ **作品展示** — 支持图片与视频作品，点击放大预览，不跳转外部页面
- 🔍 **分类筛选** — 按 AI短剧 / AI视频 / 电商 / 生活 分类浏览
- 🎠 **首页轮播** — 作品轮播展示
- ✨ **滚动动画** — 淡入滚动动画效果
- 🎯 **平滑导航** — 固定导航栏 + 滚动监听高亮

## 作品分类

| 分类 | 数量 | 说明 |
|------|------|------|
| AI短剧 | 7 件 | 角色设计图、故事板 |
| AI视频 | 2 件 | AI 生成短片 |
| 电商 | 2 件 | 商品主图、详情页设计 |
| 生活 | 2 件 | 生活摄影作品 |

## 添加作品（重要！）

**不用改代码**，把作品文件放进对应分类文件夹，运行扫描命令即可：

```bash
npm run scan
```

### 具体步骤

1. **放文件**：把图片/视频拖进 `public/portfolios/<分类文件夹>/`
   - 图片：`.jpg/.jpeg/.png/.webp/.gif`
   - 视频：`.mp4/.webm/.mov`
   - 视频可选配同名海报图，如 `意外的重逢.mp4` + `意外的重逢_poster.jpg`（自动作为封面）
2. **运行扫描**：`npm run scan` → 自动更新 `src/data.js`
3. **推送上线**：
   ```bash
   git add .
   git commit -m "添加新作品"
   git push
   ```
   Cloudflare Pages 会自动构建部署，稍等 1-2 分钟即可访问。

### 自定义标题 / 描述（可选）

默认用文件名当标题。想要更好看的标题，可在分类文件夹里放一个 `meta.json`：

```json
{
  "女1_merge.png": { "title": "女角色 1", "desc": "AI 短剧角色设计" },
  "40s微笑.mp4": "40s 微笑"
}
```

- 值为字符串 = 只改标题
- 值为对象 = 同时改标题和描述
- 没写到的文件自动用文件名做标题

### 新增分类

在 `scripts/scan-portfolios.mjs` 顶部的 `FOLDER_CATEGORIES` 里加一行，再新建同名文件夹即可。

> 💡 更省事的方式：直接把文件放好，然后跟 Codex 说「帮我添加作品」，我会帮你完成扫描 + 提交 + 推送。

## 技术栈

| 技术 | 用途 |
|------|------|
| **React 18** | 组件化 UI 框架 |
| **Vite 6** | 构建工具（开发服务器 + 打包） |
| **CSS3** | 纯 CSS 样式（无第三方 UI 库） |
| **Cloudflare Pages** | 静态站点部署 |


## 一键脚本（英文界面）

不想记命令？直接用这两个脚本（双击运行）：

| 脚本 | 作用 |
|------|------|
| **`publish.cmd`** | 一键发布：扫描作品 → 构建 → 提交 → 推送 → 自动部署上线 |
| **`start-dev.cmd`** | 一键启动本地开发服务器 |

`publish.cmd` 会执行：
1. `npm run scan -- --english`（扫描作品文件夹，英文输出）
2. `npm run build`（构建生产版本）
3. `git add` + `git commit`（有改动才提交）
4. `git push`（推送到 GitHub，Cloudflare Pages 自动部署）

> 日常流程：把新作品文件放进 `public/portfolios/<分类>/` → 双击 `publish.cmd` → 等 1-2 分钟即可上线。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 扫描作品文件夹，重新生成数据
npm run scan

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── main.jsx              # 入口
├── App.jsx               # 主应用（组合组件）
├── data.js               # 作品数据（由 scan 脚本自动生成）
├── style.css             # 全局样式
├── components/
│   ├── Navbar.jsx        # 顶部导航栏
│   ├── Hero.jsx          # 首屏 Hero
│   ├── Works.jsx         # 作品展示区
│   ├── WorkCard.jsx      # 作品卡片
│   ├── Lightbox.jsx      # 作品放大预览
│   ├── About.jsx         # 关于我
│   ├── Contact.jsx       # 联系我
│   └── Footer.jsx        # 页脚
public/
└── portfolios/           # 作品资源文件（按分类分文件夹存放）
    ├── AI短剧/
    ├── AI视频作品集/
    ├── 电商/
    ├── 生活/
    └── 剪辑作品/
scripts/
└── scan-portfolios.mjs   # 作品扫描脚本（生成 src/data.js）
```

## 部署

本项目使用 Cloudflare Pages 部署，push 到 `main` 分支后自动构建上线。

```bash
npm run build  # 本地验证构建输出到 dist/
```

## 许可证

MIT