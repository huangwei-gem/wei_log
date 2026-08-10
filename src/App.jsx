import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import { HeroMarquee, WorksGrid } from './components/Works.jsx'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Lightbox from './components/Lightbox.jsx'
import { projects } from './data.js'

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

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('')
  const [lightboxProject, setLightboxProject] = useState(null)
  const [filter, setFilter] = useState('all')

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

      {/* 首页：Hero + 作品轮播展示 */}
      <Hero />
      <HeroMarquee projects={projects} onCardClick={openLightbox} />

      {/* 第二页：关于我 */}
      <About />

      {/* 作品集网格画廊 */}
      <WorksGrid
        projects={projects}
        filter={filter}
        setFilter={setFilter}
        onCardClick={openLightbox}
      />

      <Contact />
      <Footer />

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
