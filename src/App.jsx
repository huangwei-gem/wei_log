import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Works from './components/Works.jsx'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

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
  const [activeSection, setActiveSection] = useState('works')

  useEffect(() => {
    const handleScroll = () => {
      for (const id of ['works', 'about', 'contact']) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop - 100
          const bottom = top + el.offsetHeight
          if (window.scrollY >= top && window.scrollY < bottom) {
            setActiveSection(id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Navbar activeSection={activeSection} theme={theme} toggleTheme={toggleTheme} />
      <Hero />
      <Works />
      <About />
      <Contact />
      <Footer />
    </>
  )
}
