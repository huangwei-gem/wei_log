import { useEffect, useRef } from 'react'

export default function About() {
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
          <h2>关于我</h2>
        </div>
        <div className="about-content fade-in" ref={ref}>
          <div className="about-image">
            <div className="about-placeholder"><span>🎨</span><p>你的照片</p></div>
          </div>
          <div className="about-text">
            <h3>你好，我是黄伟</h3>
            <p>我是一名 AI 视觉创作者与设计师，热衷于探索 AI 技术与视觉艺术的融合。从 AI 视频生成、角色设计到电商视觉设计，我享受将创意想法转化为令人惊叹的视觉作品。</p>
            <p>擅长工具：Stable Diffusion、ComfyUI、Runway、剪映、Figma、Adobe Creative Suite。目前专注于 AI 视频内容创作与品牌视觉设计方向。</p>
            <div className="about-stats">
              {[{ num: '3+', label: '年经验' }, { num: '20+', label: '项目' }, { num: '10+', label: '客户' }].map(s => (
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
