import { useState, useEffect, useRef } from 'react'

// ========= 数据 =========
const projects = [
  // AI 短剧
  { title: '故事板', desc: 'AI 短剧故事板设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/故事板.jpg' },
  { title: '女角色 1', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/女1_merge.png' },
  { title: '女角色 2', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/女2_merge.png' },
  { title: '女角色 3', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/女3_merge.png' },
  { title: '男角色 1', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/男1_merge.png' },
  { title: '男角色 2', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/男2_merge.png' },
  { title: '男角色 3', desc: 'AI 短剧角色设计', cat: 'ai-drama', type: 'image', img: '/portfolios/AI短剧/男3_merge.png' },

  // AI 视频作品集
  { title: '40s 微笑', desc: 'AI 视频短片', cat: 'ai-video', type: 'video', img: '/portfolios/AI视频作品集/40s微笑.mp4', video: '/portfolios/AI视频作品集/40s微笑.mp4' },
  { title: '意外的重逢', desc: 'AI 视频作品', cat: 'ai-video', type: 'video', img: '', video: '/portfolios/AI视频作品集/意外的重逢.mp4' },

  // 电商
  { title: '商品主图一键生成', desc: 'AI 电商商品主图设计', cat: 'ecommerce', type: 'image', img: '/portfolios/电商/商品主图一键生成.png' },
  { title: '电商详情页', desc: '电商产品详情页设计', cat: 'ecommerce', type: 'image', img: '/portfolios/电商/电商详情页.png' },

  // 生活
  { title: '人物剪影', desc: '生活摄影 - 人物剪影', cat: 'life', type: 'image', img: '/portfolios/生活/人物剪影.jpg' },
  { title: '朋友圈照片', desc: '生活摄影记录', cat: 'life', type: 'image', img: '/portfolios/生活/朋友圈照片.png' },
]

const filterCategories = [
  { key: 'all', label: 'All' },
  { key: 'ai-drama', label: 'AI短剧' },
  { key: 'ai-video', label: 'AI视频' },
  { key: 'ecommerce', label: '电商' },
  { key: 'life', label: '生活' },
]

// ========= 组件 =========

function Navbar({ activeSection }) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          Portfolio
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

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-greeting">HELLO, I'M</p>
            <h1 className="hero-name">Your Name</h1>
            <p className="hero-tagline">Designer &amp; Creative Developer</p>
            <p className="hero-desc">
              视觉设计师，专注于品牌设计、UI/UX 和动态视觉。<br />这里展示我的精选设计作品。
            </p>
            <div className="hero-actions">
              <a href="#works" className="btn btn-primary"
                onClick={(e) => { e.preventDefault(); document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' }) }}>
                View My Work
              </a>
              <a href="#contact" className="btn btn-outline"
                onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Get in Touch
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <div className="hero-placeholder">
                <span>📷</span>
                <p>Your Photo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="scroll-indicator">
        <span>Scroll</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}

function WorkCard({ project }) {
  const videoRef = useRef(null)
  return (
    <div className="work-card"
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 } }}>
      <div className="work-thumb">
        {project.type === 'video' ? (
          <>
            <video ref={videoRef} muted loop playsInline preload="metadata" poster={project.img || undefined}>
              <source src={project.video} type="video/mp4" />
            </video>
            <div className="play-badge">🎬</div>
          </>
        ) : project.type === 'placeholder' ? (
          <div className="work-thumb-placeholder">
            <span className="placeholder-icon">🎥</span>
            <p className="placeholder-text">视频较大，暂未上传</p>
          </div>
        ) : (
          <img src={project.img} alt={project.title} loading="lazy" />
        )}
        <div className="work-overlay"><span>View Project →</span></div>
      </div>
      <div className="work-info">
        <h3>{project.title}</h3>
        <p>{project.desc}</p>
      </div>
    </div>
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

  return (
    <section id="works">
      <div className="container">
        <div className="section-header">
          <p className="section-label">WORKS</p>
          <h2>My Portfolio</h2>
          <p className="section-desc">我的精选作品集</p>
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

  return (
    <section id="about" className="about">
      <div className="container">
        <div className="section-header">
          <p className="section-label">ABOUT</p>
          <h2>About Me</h2>
        </div>
        <div className="about-content fade-in" ref={ref}>
          <div className="about-image">
            <div className="about-placeholder"><span>📸</span><p>Your Photo</p></div>
          </div>
          <div className="about-text">
            <h3>你好，我是设计师</h3>
            <p>我是一名视觉设计师，热爱通过设计讲述故事。从品牌识别到数字界面，再到动态影像，我享受将创意转化为视觉语言的过程。</p>
            <p>擅长工具：Figma、Adobe Creative Suite、Blender、After Effects。目前专注于品牌设计与 UI/UX 方向。</p>
            <div className="about-stats">
              {[{ num: '3+', label: 'Years Exp.' }, { num: '20+', label: 'Projects' }, { num: '10+', label: 'Clients' }].map(s => (
                <div className="stat" key={s.label}>
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact">
      <div className="container">
        <div className="section-header">
          <p className="section-label">CONTACT</p>
          <h2>Get in Touch</h2>
          <p className="section-desc">有项目合作或设计需求？欢迎联系我</p>
        </div>
        <div className="contact-content">
          <form className="contact-form" onSubmit={e => e.preventDefault()}>
            <div className="form-row">
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Your Email" required />
            </div>
            <input type="text" placeholder="Subject" />
            <textarea rows="5" placeholder="Your Message" required></textarea>
            <button type="submit" className="btn btn-primary">Send Message →</button>
          </form>
          <div className="contact-info">
            {[{ icon: '✉', text: 'hello@your-email.com' }, { icon: '◎', text: '@your_instagram' }, { icon: '●', text: '@your_behance' }].map((item, i) => (
              <div className="contact-item" key={i}>
                <span className="contact-icon">{item.icon}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2025 Your Name. All rights reserved.</p>
        <div className="footer-links">
          {['Instagram', 'Behance', 'Dribbble', 'GitHub'].map(l => <a href="#" key={l}>{l}</a>)}
        </div>
      </div>
    </footer>
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

  return (
    <>
      <Navbar activeSection={activeSection} />
      <Hero />
      <Works />
      <About />
      <Contact />
      <Footer />
    </>
  )
}
