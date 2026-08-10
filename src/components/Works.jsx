import { projects, filterCategories } from '../data.js'
import { useState, useEffect, useRef, useCallback } from 'react'
import WorkCard from './WorkCard.jsx'
import Lightbox from './Lightbox.jsx'

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

  // 只在 lightbox 打开时计算索引，关闭时保持 -1
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

  // 用函数式更新避免 currentIndex 依赖
  const hasPrev = lightboxProject ? currentIndex > 0 : false
  const hasNext = lightboxProject ? currentIndex < filtered.length - 1 : false

  return (
    <>
      <section id="works" ref={ref}>
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

          <div className={'works-grid' + (visible ? ' visible' : '')}>
            {filtered.map((p, i) => (
              <WorkCard key={p.title + '-' + i} project={p} onClick={openLightbox} />
            ))}
          </div>
        </div>
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
