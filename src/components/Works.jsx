import { projects, filterCategories } from '../data.js'
import { useState, useEffect, useRef, useCallback } from 'react'
import Lightbox from './Lightbox.jsx'

// 单个作品卡片
function MarqueeCard({ project, onClick }) {
  const isVideo = project.type === 'video'

  return (
    <div className="marquee-card" onClick={() => onClick(project)}>
      <div className="marquee-card-inner">
        {isVideo ? (
          <>
            <video
              muted
              loop
              playsInline
              preload="metadata"
              poster={project.img || undefined}
              className="marquee-card-media"
            >
              <source src={project.video} type="video/mp4" />
            </video>
            <span className="marquee-card-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : (
          <img
            className="marquee-card-media"
            src={project.img}
            alt={project.title}
            loading="lazy"
          />
        )}

        {/* 底部渐变 */}
        <div className="marquee-card-gradient" />

        {/* 悬浮覆盖层 */}
        <div className="marquee-card-overlay">
          {/* 顶部渐变条 */}
          <div className="marquee-card-bar" />

          <div className="marquee-card-content">
            <p className="marquee-card-title">{project.title}</p>
            <div className="marquee-card-divider" />
            <p className="marquee-card-desc">{project.desc}</p>
            <span className="marquee-card-action">
              {isVideo ? '播放' : '查看'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 单行轮播条
function MarqueeRow({ projects, direction = 'left', speed = 32 }) {
  const [isPaused, setIsPaused] = useState(false)
  const animName = direction === 'left' ? 'scroll-left' : 'scroll-right'

  // 复制两份实现无缝循环
  const doubled = [...projects, ...projects]

  return (
    <div
      className="marquee-row"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 左右渐隐边缘 */}
      <div className="marquee-fade marquee-fade-left" />
      <div className="marquee-fade marquee-fade-right" />

      <div
        className="marquee-track"
        style={{
          animationName: animName,
          animationDuration: `${speed}s`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {doubled.map((p, i) => (
          <MarqueeCard key={p.title + '-' + i} project={p} />
        ))}
      </div>
    </div>
  )
}

export default function Works() {
  const [filter, setFilter] = useState('all')
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [lightboxProject, setLightboxProject] = useState(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.cat === filter)

  const currentIndex = lightboxProject
    ? filtered.findIndex(p => p === lightboxProject)
    : -1

  const openLightbox = useCallback((project) => setLightboxProject(project), [])
  const closeLightbox = useCallback(() => setLightboxProject(null), [])

  const goNext = useCallback(() => {
    setLightboxProject(prev => {
      if (!prev) return null
      const idx = filtered.findIndex(p => p === prev)
      if (idx < filtered.length - 1) return filtered[idx + 1]
      return prev
    })
  }, [filtered])

  const goPrev = useCallback(() => {
    setLightboxProject(prev => {
      if (!prev) return null
      const idx = filtered.findIndex(p => p === prev)
      if (idx > 0) return filtered[idx - 1]
      return prev
    })
  }, [filtered])

  const hasPrev = lightboxProject ? currentIndex > 0 : false
  const hasNext = lightboxProject ? currentIndex < filtered.length - 1 : false

  return (
    <>
      <section id="works" ref={ref} className="works-marquee-section">
        <div className="container">
          <div className="section-header">
            <p className="section-label">WORKS</p>
            <h2>我的作品集</h2>
            <p className="section-desc">精选 AI 视觉与设计作品</p>
          </div>

          <div className="filter-bar">
            {filterCategories.map(c => (
              <button
                key={c.key}
                className={'filter-btn' + (filter === c.key ? ' active' : '')}
                onClick={() => setFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 轮播区域 */}
        {visible && filtered.length > 0 && (
          <div className="marquee-section">
            <MarqueeRow
              projects={filtered}
              direction="left"
              speed={Math.max(20, filtered.length * 4)}
            />
            {filtered.length >= 3 && (
              <MarqueeRow
                projects={filtered}
                direction="right"
                speed={Math.max(25, filtered.length * 5)}
              />
            )}
          </div>
        )}
      </section>

      <Lightbox
        project={lightboxProject}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </>
  )
}
