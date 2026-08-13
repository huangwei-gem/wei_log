import { projects, filterCategories } from '../data.js'
import LazyVideo from './LazyVideo.jsx'
import { useState, useEffect, useRef } from 'react'

/* ==========================================================
   网格画廊卡片
   ========================================================== */
function WorkCard({ project, onClick }) {
  const isVideo = project.type === 'video'

  return (
    <div className="work-card" onClick={() => onClick(project)}>
      <div className="work-card-inner">
        {isVideo ? (
          <>
            <LazyVideo poster={project.img} videoSrc={project.video} className="work-card-media" />
            <span className="work-card-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : (
          <img className="work-card-media" src={project.thumb || project.img} alt={project.title} loading="lazy" decoding="async" />
        )}
        <div className="work-card-gradient" />
        <div className="work-card-overlay">
          <div className="work-card-bar" />
          <div className="work-card-overlay-content">
            <p className="work-card-overlay-title">{project.title}</p>
            <div className="work-card-overlay-divider" />
            <p className="work-card-overlay-desc">{project.desc}</p>
            {project.date && <span className="work-card-date">{project.date}</span>}
            <span className="work-card-overlay-action">
              {isVideo ? '播放' : '查看'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================
   轮播行 — JS 驱动，最新作品居中展示
   ========================================================== */
function MarqueeRow({ projects, direction = 'left', speed = 32, onCardClick }) {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const animFrameRef = useRef(null)
  const lastTimeRef = useRef(0)
  const pausedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const initializedRef = useRef(false)

  // Sort by date descending (newest first)
  const sorted = [...projects].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    return 0
  })
  const doubled = [...sorted, ...sorted]

  // Initialize position once and start animation
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const track = trackRef.current
    if (!track) return

    const raf = requestAnimationFrame(() => {
      const firstCard = track.querySelector('.marquee-card')
      if (!firstCard) { setReady(true); return }

      const cardWidth = firstCard.offsetWidth + 16 // card + gap
      const viewportWidth = window.innerWidth
      const totalWidth = cardWidth * sorted.length

      // 居中偏移量：让第一张卡片（最新作品）位于视口中央
      const offset = Math.max(0, viewportWidth / 2 - cardWidth / 2)

      // 两个方向都从 offset - totalWidth 开始（第二组在中央），
      // 这样行首即满铺，且最新作品（第二组的第一张）位于视口中央
      // 向左滚动：向左移动 totalWidth 后复位；向右滚动：向右移动 totalWidth 后复位
      const startPos = offset - totalWidth
      const endPos = direction === 'left' ? (offset - 2 * totalWidth) : offset
      const dir = direction === 'left' ? -1 : 1

      posRef.current = startPos
      track.style.transform = `translateX(${startPos}px)`
      track.style.opacity = '1'
      setReady(true)

      const pxPerMs = (totalWidth / speed / 1000) * dir

      const animate = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp
        const delta = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp

        if (!pausedRef.current) {
          posRef.current += pxPerMs * delta

          // 循环复位
          if (dir < 0 && posRef.current <= endPos) {
            posRef.current = startPos
          } else if (dir > 0 && posRef.current >= endPos) {
            posRef.current = startPos
          }

          track.style.transform = `translateX(${posRef.current}px)`
        }
        animFrameRef.current = requestAnimationFrame(animate)
      }

      lastTimeRef.current = 0
      animFrameRef.current = requestAnimationFrame(animate)
    })

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [direction, speed, sorted.length]) // 注意：不依赖 isPaused

  return (
    <div
      className="marquee-row"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="marquee-fade marquee-fade-left" />
      <div className="marquee-fade marquee-fade-right" />

      <div ref={trackRef} className="marquee-track" style={{ opacity: 0 }}>
        {doubled.map((p, i) => (
          <div key={p.title + '-m' + i} className="marquee-card" onClick={() => onCardClick(p)}>
            <div className="marquee-card-inner">
              {p.type === 'video' ? (
                <>
                  <video muted loop playsInline preload="none" poster={p.img || undefined} className="marquee-card-media">
                    <source src={p.video} type="video/mp4" />
                  </video>
                  <span className="marquee-card-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </>
              ) : (
                <img className="marquee-card-media" src={p.thumb || p.img} alt={p.title} loading="lazy" decoding="async" fetchpriority={i < 6 ? 'high' : 'low'} />
              )}
              <div className="marquee-card-gradient" />
              <div className="marquee-card-overlay">
                <div className="marquee-card-bar" />
                <div className="marquee-card-content">
                  <p className="marquee-card-title">{p.title}</p>
                  <div className="marquee-card-divider" />
                  <p className="marquee-card-desc">{p.desc}</p>
                  {p.date && <span className="marquee-card-date">{p.date}</span>}
                  <span className="marquee-card-action">
                    {p.type === 'video' ? '播放' : '查看'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==========================================================
   首页轮播展示（Hero 下方）
   ========================================================== */
export function HeroMarquee({ projects, onCardClick }) {
  if (!projects || projects.length === 0) return null

  return (
    <section className="hero-marquee-section">
      <div className="marquee-section">
        <MarqueeRow projects={projects} direction="left" speed={Math.max(20, projects.length * 4)} onCardClick={onCardClick} />
        {projects.length >= 3 && (
          <MarqueeRow projects={projects} direction="right" speed={Math.max(25, projects.length * 5)} onCardClick={onCardClick} />
        )}
      </div>
    </section>
  )
}

/* ==========================================================
   网格画廊
   ========================================================== */
export function WorksGrid({ projects, filter, setFilter, onCardClick }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.cat === filter)

  return (
    <section id="works" ref={ref} className="works-grid-section">
      <div className="container">
        <div className="section-header">
          <p className="section-label">WORKS</p>
          <h2>作品集</h2>
          <p className="section-desc">精选 AI 视觉与设计作品</p>
        </div>
        <div className="filter-bar">
          {filterCategories.map(c => (
            <button key={c.key} className={'filter-btn' + (filter === c.key ? ' active' : '')} onClick={() => setFilter(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className={'gallery-grid' + (visible ? ' visible' : '')}>
          {filtered.map((p, i) => (
            <WorkCard key={p.title + '-g' + i} project={p} onClick={onCardClick} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="gallery-empty"><p>该分类暂无作品</p></div>
        )}
      </div>
    </section>
  )
}
