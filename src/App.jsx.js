import React from 'https://esm.sh/react@18.3.1'

const { useState, useEffect, useRef } = React

// ========= 数据 =========
const projects = [
  { title: 'Brand Identity', desc: '品牌视觉识别系统设计', cat: 'brand', type: 'image', img: 'https://picsum.photos/seed/work1/600/400' },
  { title: 'Motion Reel 2025', desc: '动态设计作品合集', cat: 'motion', type: 'video', img: 'https://picsum.photos/seed/work2/600/400', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: 'Travel App UI', desc: '旅行应用界面设计', cat: 'uiux', type: 'image', img: 'https://picsum.photos/seed/work3/600/400' },
  { title: 'Digital Illustration', desc: '数字插画系列', cat: 'art', type: 'image', img: 'https://picsum.photos/seed/work4/600/400' },
  { title: 'Packaging Design', desc: '产品包装设计', cat: 'brand', type: 'image', img: 'https://picsum.photos/seed/work5/600/400' },
  { title: 'Animation Showcase', desc: '动画作品展示', cat: 'motion', type: 'video', img: 'https://picsum.photos/seed/work6/600/400', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
]

// ========= 组件 =========

function Navbar({ activeSection, setActiveSection }) {
  return React.createElement('header', { className: 'navbar' },
    React.createElement('div', { className: 'container nav-container' },
      React.createElement('a', { href: '#', className: 'logo', onClick: e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) } }, 'Portfolio'),
      React.createElement('nav', null,
        React.createElement('ul', { className: 'nav-links' },
          ['Works', 'About', 'Contact'].map(label => {
            const id = label.toLowerCase()
            return React.createElement('li', { key: id },
              React.createElement('a', {
                href: '#' + id,
                className: activeSection === id ? 'active' : '',
                onClick: e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
              }, label)
            )
          })
        )
      )
    )
  )
}

function Hero() {
  return React.createElement('section', { className: 'hero' },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'hero-content' },
        React.createElement('div', { className: 'hero-text' },
          React.createElement('p', { className: 'hero-greeting' }, "HELLO, I'M"),
          React.createElement('h1', { className: 'hero-name' }, 'Your Name'),
          React.createElement('p', { className: 'hero-tagline' }, 'Designer & Creative Developer'),
          React.createElement('p', { className: 'hero-desc' }, '视觉设计师，专注于品牌设计、UI/UX 和动态视觉。\n这里展示我的精选设计作品。'),
          React.createElement('div', { className: 'hero-actions' },
            React.createElement('a', { href: '#works', className: 'btn btn-primary', onClick: e => { e.preventDefault(); document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' }) } }, 'View My Work'),
            React.createElement('a', { href: '#contact', className: 'btn btn-outline', onClick: e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) } }, 'Get in Touch')
          )
        ),
        React.createElement('div', { className: 'hero-visual' },
          React.createElement('div', { className: 'hero-image-wrapper' },
            React.createElement('div', { className: 'hero-placeholder' },
              React.createElement('span', null, '📷'),
              React.createElement('p', null, 'Your Photo')
            )
          )
        )
      )
    ),
    React.createElement('div', { className: 'scroll-indicator' },
      React.createElement('span', null, 'Scroll'),
      React.createElement('div', { className: 'scroll-line' })
    )
  )
}

function WorkCard({ project }) {
  const videoRef = useRef(null)
  return React.createElement('div', {
    className: 'work-card',
    onMouseEnter: () => videoRef.current?.play(),
    onMouseLeave: () => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 } }
  },
    React.createElement('div', { className: 'work-thumb' },
      project.type === 'video'
        ? React.createElement(React.Fragment, null,
            React.createElement('video', { ref: videoRef, muted: true, loop: true, playsInline: true, preload: 'metadata', poster: project.img },
              React.createElement('source', { src: project.video, type: 'video/mp4' })
            ),
            React.createElement('div', { className: 'play-badge' }, '🎬')
          )
        : React.createElement('img', { src: project.img, alt: project.title, loading: 'lazy' }),
      React.createElement('div', { className: 'work-overlay' },
        React.createElement('span', null, 'View Project →')
      )
    ),
    React.createElement('div', { className: 'work-info' },
      React.createElement('h3', null, project.title),
      React.createElement('p', null, project.desc)
    )
  )
}

function Works() {
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

  return React.createElement('section', { id: 'works', ref },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'section-header' },
        React.createElement('p', { className: 'section-label' }, 'PORTFOLIO'),
        React.createElement('h2', null, 'Featured Works'),
        React.createElement('p', { className: 'section-desc' }, '精选设计作品 — 点击查看详情')
      ),
      React.createElement('div', { className: 'filter-bar' },
        [{ key: 'all', label: 'All' }, { key: 'brand', label: 'Brand' }, { key: 'uiux', label: 'UI/UX' }, { key: 'motion', label: 'Motion' }, { key: 'art', label: 'Art' }].map(c =>
          React.createElement('button', {
            key: c.key,
            className: 'filter-btn' + (filter === c.key ? ' active' : ''),
            onClick: () => setFilter(c.key)
          }, c.label)
        )
      ),
      React.createElement('div', { className: 'works-grid' + (visible ? ' visible' : '') },
        filtered.map((p, i) => React.createElement(WorkCard, { key: i, project: p }))
      )
    )
  )
}

function About() {
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return React.createElement('section', { id: 'about', className: 'about' },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'section-header' },
        React.createElement('p', { className: 'section-label' }, 'ABOUT'),
        React.createElement('h2', null, 'About Me')
      ),
      React.createElement('div', { className: 'about-content fade-in', ref },
        React.createElement('div', { className: 'about-image' },
          React.createElement('div', { className: 'about-placeholder' },
            React.createElement('span', null, '📸'),
            React.createElement('p', null, 'Your Photo')
          )
        ),
        React.createElement('div', { className: 'about-text' },
          React.createElement('h3', null, '你好，我是设计师'),
          React.createElement('p', null, '我是一名视觉设计师，热爱通过设计讲述故事。从品牌识别到数字界面，再到动态影像，我享受将创意转化为视觉语言的过程。'),
          React.createElement('p', null, '擅长工具：Figma、Adobe Creative Suite、Blender、After Effects。目前专注于品牌设计与 UI/UX 方向。'),
          React.createElement('div', { className: 'about-stats' },
            [{ num: '3+', label: 'Years Exp.' }, { num: '20+', label: 'Projects' }, { num: '10+', label: 'Clients' }].map(s =>
              React.createElement('div', { className: 'stat', key: s.label },
                React.createElement('span', { className: 'stat-num' }, s.num),
                React.createElement('span', { className: 'stat-label' }, s.label)
              )
            )
          )
        )
      )
    )
  )
}

function Contact() {
  return React.createElement('section', { id: 'contact' },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'section-header' },
        React.createElement('p', { className: 'section-label' }, 'CONTACT'),
        React.createElement('h2', null, 'Get in Touch'),
        React.createElement('p', { className: 'section-desc' }, '有项目合作或设计需求？欢迎联系我')
      ),
      React.createElement('div', { className: 'contact-content' },
        React.createElement('form', { className: 'contact-form', onSubmit: e => e.preventDefault() },
          React.createElement('div', { className: 'form-row' },
            React.createElement('input', { type: 'text', placeholder: 'Your Name', required: true }),
            React.createElement('input', { type: 'email', placeholder: 'Your Email', required: true })
          ),
          React.createElement('input', { type: 'text', placeholder: 'Subject' }),
          React.createElement('textarea', { rows: 5, placeholder: 'Your Message', required: true }),
          React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, 'Send Message →')
        ),
        React.createElement('div', { className: 'contact-info' },
          [{ icon: '✉', text: 'hello@your-email.com' }, { icon: '◎', text: '@your_instagram' }, { icon: '●', text: '@your_behance' }].map((item, i) =>
            React.createElement('div', { className: 'contact-item', key: i },
              React.createElement('span', { className: 'contact-icon' }, item.icon),
              React.createElement('p', null, item.text)
            )
          )
        )
      )
    )
  )
}

function Footer() {
  return React.createElement('footer', { className: 'footer' },
    React.createElement('div', { className: 'container' },
      React.createElement('p', null, '© 2025 Your Name. All rights reserved.'),
      React.createElement('div', { className: 'footer-links' },
        ['Instagram', 'Behance', 'Dribbble', 'GitHub'].map(l =>
          React.createElement('a', { href: '#', key: l }, l)
        )
      )
    )
  )
}

// ========= App =========
export default function App() {
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
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return React.createElement(React.Fragment, null,
    React.createElement(Navbar, { activeSection, setActiveSection }),
    React.createElement(Hero, null),
    React.createElement(Works, null),
    React.createElement(About, null),
    React.createElement(Contact, null),
    React.createElement(Footer, null)
  )
}
