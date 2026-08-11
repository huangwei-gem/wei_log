import { projects, filterCategories } from '../data.js'
import LazyVideo from './LazyVideo.jsx'
import { useState, useEffect, useRef } from 'react'

/* ==========================================================
   网格画廊卡片（参考 upma.cn/image-prompts）
   ========================================================== */
function WorkCard({ project, onClick }) {
  const isVideo = project.type === 'video'

  return (
    <div className="work-card" onClick={() => onClick(project)}>
      <div className="work-card-inner">
        {isVideo ? (
          <>
            <LazyVideo
            poster={project.img}
            videoSrc={project.video}
            className="work-card-media"
          />
            <span className="work-card-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : (
          <img
            className="work-card-media"
            src={project.img}
            alt={project.title}
            loading="lazy"
          />
        )}

        {/* 底部渐变 */}
        <div className="work-card-gradient" />

        {/* 悬浮覆盖层 */}
        <div className="work-card-overlay">
          <div className="work-card-bar" />
          <div className="work-card-overlay-content">
            <p className="work-card-overlay-title">{project.title}</p>
            <div className="work-card-overlay-divider" />
            <p className="work-card-overlay-desc">{project.desc}</p>
            <span className="work-card-overlay-action">
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

/* ==========================================================
   轮播行（首页展示用）
   ========================================================== */
function MarqueeRow({ projects, direction = 'left', speed = 32, onCardClick }) {
  const [isPaused, setIsPaused] = useState(false)
  const animName = direction === 'left' ? 'scroll-left' : 'scroll-right'

  const doubled = [...projects, ...projects]

  return (
    <div
      className="marquee-row"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
          <div
            key={p.title + '-m' + i}
            className="marquee-card"
            onClick={() => onCardClick(p)}
          >
            <div className="marquee-card-inner">
              {p.type === 'video' ? (
                <>
                  <video
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={p.img || undefined}
                    className="marquee-card-media"
                  >
                    <source src={p.video} type="video/mp4" />
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
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                />
              )}
              <div className="marquee-card-gradient" />
              <div className="marquee-card-overlay">
                <div className="marquee-card-bar" />
                <div className="marquee-card-content">
                  <p className="marquee-card-title">{p.title}</p>
                  <div className="marquee-card-divider" />
                  <p className="marquee-card-desc">{p.desc}</p>
                  <span className="marquee-card-action">
                    {p.type === 'video' ? '播放' : '查看'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
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
        <MarqueeRow
          projects={projects}
          direction="left"
          speed={Math.max(20, projects.length * 4)}
          onCardClick={onCardClick}
        />
        {projects.length >= 3 && (
          <MarqueeRow
            projects={projects}
            direction="right"
            speed={Math.max(25, projects.length * 5)}
            onCardClick={onCardClick}
          />
        )}
      </div>
    </section>
  )
}

/* ==========================================================
   网格画廊（参考 upma.cn/image-prompts）
   ========================================================== */
export function WorksGrid({ projects, filter, setFilter, onCardClick }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

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
            <button
              key={c.key}
              className={'filter-btn' + (filter === c.key ? ' active' : '')}
              onClick={() => setFilter(c.key)}
            >
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
          <div className="gallery-empty">
            <p>该分类暂无作品</p>
          </div>
        )}
      </div>
    </section>
  )
}
