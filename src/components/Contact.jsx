export default function Contact() {
  return (
    <section id="contact">
      <div className="container">
        <div className="section-header">
          <p className="section-label">CONTACT</p>
          <h2>联系我</h2>
          <p className="section-desc">有项目合作或设计需求？欢迎联系</p>
        </div>
        <div className="contact-content">
          <div className="contact-info-grid">
            <div className="contact-card">
              <span className="contact-card-icon">✉</span>
              <h3>邮箱</h3>
              <a href="mailto:3579628804@qq.com">3579628804@qq.com</a>
            </div>
            <div className="contact-card">
              <span className="contact-card-icon">📞</span>
              <h3>电话</h3>
              <a href="tel:13246874710">13246874710</a>
            </div>
            <div className="contact-card">
              <span className="contact-card-icon">👤</span>
              <h3>姓名</h3>
              <p>黄维</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
