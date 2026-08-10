import { useState } from 'react'

export default function Contact() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/your-form-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact">
      <div className="container">
        <div className="section-header">
          <p className="section-label">CONTACT</p>
          <h2>联系我</h2>
          <p className="section-desc">有项目合作或设计需求？欢迎联系我</p>
        </div>
        <div className="contact-content">
          <form className="contact-form" onSubmit={handleSubmit}>
            {status === 'success' && (
              <div className="form-message form-success">
                ✅ 消息已发送成功！我会尽快回复你。
              </div>
            )}
            {status === 'error' && (
              <div className="form-message form-error">
                ❌ 发送失败，请稍后重试或直接发送邮件。
              </div>
            )}
            <div className="form-row">
              <input
                type="text" name="name" placeholder="你的名字" required
                value={formData.name} onChange={handleChange}
              />
              <input
                type="email" name="email" placeholder="你的邮箱" required
                value={formData.email} onChange={handleChange}
              />
            </div>
            <input
              type="text" name="subject" placeholder="主题"
              value={formData.subject} onChange={handleChange}
            />
            <textarea
              name="message" rows="5" placeholder="你的消息" required
              value={formData.message} onChange={handleChange}
            ></textarea>
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? '发送中...' : '发送消息 →'}
            </button>
          </form>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">✉</span>
              <p>huangwei@example.com</p>
            </div>
            <div className="contact-item">
              <span className="contact-icon">◎</span>
              <p>@huangwei_ai</p>
            </div>
            <div className="contact-item">
              <span className="contact-icon">●</span>
              <p>@huangwei_design</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
