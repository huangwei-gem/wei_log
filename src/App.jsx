import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import { projects } from './data.js'

// 懒加载以下折叠的组件 — 减少首屏 bundle 大小
const HeroMarquee = lazy(() => import('./components/Works.jsx').then(m => ({ default: m.HeroMarquee })))
const WorksGrid = lazy(() => import('./components/Works.jsx').then(m => ({ default: m.WorksGrid })))
const About = lazy(() => import('./components/About.jsx'))
const Contact = lazy(() => import('./components/Contact.jsx'))
const Footer = lazy(() => import('./components/Footer.jsx'))
const Lightbox = lazy(() => import('./components/Lightbox.jsx'))

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}

// 骨架屏 — 首屏加载时显示
function MarqueeSkeleton() {
  return (
    <section className="hero-marquee-section">
      <div className="marquee-section">
        <div className="marquee-skeleton-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="marquee-skeleton-card">
              <div className="skeleton-pulse" style={{ width: '100%', height: '100%', borderRadius: 16 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('')
  const [lightboxProject, setLightboxProject] = useState(null)
  const [filter, setFilter] = useState('all')
  const [marqueeReady, setMarqueeReady] = useState(false)

  // 预加载缩略图 — 首屏渲染后立即开始
  useEffect(() => {
    const preloadThumbnails = () => {
      const thumbs = projects.slice(0, 8).map(p => p.thumb || p.img).filter(Boolean)
      thumbs.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
    }
    // 使用 requestIdleCallback 或 setTimeout 延迟预加载，不阻塞首屏渲染
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadThumbnails, { timeout: 2000 })
    } else {
      setTimeout(preloadThumbnails, 500)
    }
  }, [])

  const currentIndex = lightboxProject
    ? projects.findIndex(p => p === lightboxProject)
    : -1

  const openLightbox = useCallback((project) => setLightboxProject(project), [])
  const closeLightbox = useCallback(() => setLightboxProject(null), [])

  const goNext = useCallback(() => {
    setLightboxProject(prev => {
      if (!prev) return null
      const idx = projects.findIndex(p => p === prev)
      if (idx < projects.length - 1) return projects[idx + 1]
      return prev
    })
  }, [])

  const goPrev = useCallback(() => {
    setLightboxProject(prev => {
      if (!prev) return null
      const idx = projects.findIndex(p => p === prev)
      if (idx > 0) return projects[idx - 1]
      return prev
    })
  }, [])

  const hasPrev = lightboxProject ? currentIndex > 0 : false
  const hasNext = lightboxProject ? currentIndex < projects.length - 1 : false

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 200) {
        setActiveSection('')
        return
      }

      for (const id of ['works', 'about', 'contact']) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop - 120
          const bottom = top + el.offsetHeight
          if (window.scrollY >= top && window.scrollY < bottom) {
            setActiveSection(id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Navbar activeSection={activeSection} theme={theme} toggleTheme={toggleTheme} />

      {/* 首页：Hero + 作品轮播展示 (首屏立即加载) */}
      <Hero />
      <Suspense fallback={<MarqueeSkeleton />}>
        <HeroMarquee projects={projects} onCardClick={openLightbox} />
      </Suspense>

      {/* 第二页：关于我 */}
      <Suspense fallback={<div className="section-loading" />}>
        <About />
      </Suspense>

      {/* 作品集网格画廊 */}
      <Suspense fallback={<div className="section-loading" />}>
        <WorksGrid
          projects={projects}
          filter={filter}
          setFilter={setFilter}
          onCardClick={openLightbox}
        />
      </Suspense>

      <Suspense fallback={<div className="section-loading" />}>
        <Contact />
      </Suspense>
      <Suspense fallback={<div className="section-loading" />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <Lightbox
          project={lightboxProject}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </Suspense>
    </>
  )
}
