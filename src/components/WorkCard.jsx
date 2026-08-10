import { projects, filterCategories } from '../data.js'
import { useState, useRef, useEffect } from 'react'

export default function WorkCard({ project }) {
  const videoRef = useRef(null)
  const handleClick = () => {
    const url = project.type === 'video' ? project.video : project.img
    if (url) window.open(url, '_blank')
  }
  return (
    <div className="work-card" onClick={handleClick}
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
        <div className="work-overlay"><span>查看作品 →</span></div>
      </div>
      <div className="work-info">
        <h3>{project.title}</h3>
        <p>{project.desc}</p>
      </div>
    </div>
  )
}
