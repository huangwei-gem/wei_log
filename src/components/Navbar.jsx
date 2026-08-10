import { useState, useEffect } from 'react'

export default function Navbar({ activeSection }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={'navbar' + (scrolled ? ' scrolled' : '')}>
      <div className="container nav-container">
        <a
          href="#"
          className="logo"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >
          Wei<span className="logo-accent">.</span>
        </a>
        <nav>
          <ul className="nav-links">
            {['Works', 'About', 'Contact'].map(label => {
              const id = label.toLowerCase()
              return (
                <li key={id}>
                  <a
                    href={'#' + id}
                    className={activeSection === id ? 'active' : ''}
                    onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
                  >
                    {label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
