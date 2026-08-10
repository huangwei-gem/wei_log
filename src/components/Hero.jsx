export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-greeting">你好，我是</p>
            <h1 className="hero-name">黄维 <span className="hero-name-en">Wei</span></h1>
            <p className="hero-tagline">AI 视觉创作者 / 设计师</p>
            <p className="hero-desc">
              专注于 AI 视频生成、视觉设计和创意内容制作。
              <br />这里展示我的精选 AI 作品与设计项目。
            </p>
            <div className="hero-actions">
              <a href="#works" className="btn btn-primary"
                onClick={(e) => { e.preventDefault(); document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' }) }}>
                浏览作品
              </a>
              <a href="#contact" className="btn btn-outline"
                onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                联系我
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <div className="hero-placeholder">
                <span>🎨</span>
                <p>你的头像</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="scroll-indicator">
        <span>向下滚动</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}
