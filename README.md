# Wei Log — 个人作品集

> 黄伟 (Wei) 的个人作品集网站 · AI 视觉创作者 / 设计师

基于 **React 18 + Vite 6** 构建的暗色调设计作品集，支持展示图片和视频作品，部署于 Cloudflare Pages。

## 功能特性

- 🎨 **暗色调视觉风格** — 红色强调色，沉浸式浏览体验
- 📱 **响应式设计** — 适配桌面端与移动端
- 🖼️ **作品展示** — 支持图片与视频作品，悬停自动播放
- 🔍 **分类筛选** — 按 AI短剧 / AI视频 / 电商 / 生活 分类浏览
- ✨ **滚动动画** — 淡入滚动动画效果
- 📬 **联系表单** — 集成 Formspree 表单提交
- 🎯 **平滑导航** — 固定导航栏 + 滚动监听高亮

## 作品分类

| 分类 | 数量 | 说明 |
|------|------|------|
| AI短剧 | 7 件 | 角色设计图、故事板 |
| AI视频 | 2 件 | AI 生成短片 |
| 电商 | 2 件 | 商品主图、详情页设计 |
| 生活 | 2 件 | 生活摄影作品 |

## 技术栈

| 技术 | 用途 |
|------|------|
| **React 18** | 组件化 UI 框架 |
| **Vite 6** | 构建工具（开发服务器 + 打包） |
| **CSS3** | 纯 CSS 样式（无第三方 UI 库） |
| **Formspree** | 表单提交服务 |
| **Cloudflare Pages** | 静态站点部署 |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

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
├── data.js               # 作品数据与分类
├── style.css             # 全局样式
├── components/
│   ├── Navbar.jsx        # 顶部导航栏
│   ├── Hero.jsx          # 首屏 Hero
│   ├── Works.jsx         # 作品展示区
│   ├── WorkCard.jsx      # 作品卡片
│   ├── About.jsx         # 关于我
│   ├── Contact.jsx       # 联系表单
│   └── Footer.jsx        # 页脚
public/
└── portfolios/           # 作品资源文件
```

## 部署

本项目使用 Cloudflare Pages 部署，支持 Vite 构建输出。

```bash
npm run build  # 构建输出到 dist/
```

## 配置联系表单

联系表单使用 Formspree 服务。在 `src/components/Contact.jsx` 中替换：

```js
const res = await fetch('https://formspree.io/f/your-form-id', {
```

为你的 Formspree 表单 ID。前往 [Formspree](https://formspree.io/) 注册免费获取。

## 许可证

MIT
