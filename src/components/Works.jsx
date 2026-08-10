import { projects, filterCategories } from '../data.js'
import { useState, useEffect, useRef } from 'react'
import WorkCard from './WorkCard.jsx'

export default function Works() {
  const [filter, setFilter] = useState('all')
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.cat === filter)

  return (
    <section id="works" ref={ref}>
      <div className="container">
        <div className="section-header">
          <p className="section-label">WORKS</p>
          <h2>我的作品集</h2>
          <p className="section-desc">精选 AI 视觉与设计作品</p>
        </div>
        <div className="filter-bar">
          {filterCategories.map(c => (
            <button key={c.key} className={'filter-btn' + (filter === c.key ? ' active' : '')} onClick={() => setFilter(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className={'works-grid' + (visible ? ' visible' : '')}>
          {filtered.map((p, i) => <WorkCard key={i} project={p} />)}
        </div>
      </div>
    </section>
  )
}
