import { useEffect, useCallback } from 'react'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && hasPrev) onPrev()
    if (e.key === 'ArrowRight' && hasNext) onNext()
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!project) return null

  const isVideo = project.type === 'video'
  const src = isVideo ? project.video : project.img

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="lightbox-btn lightbox-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>

        {/* Prev / Next */}
        {hasPrev && (
          <button className="lightbox-btn lightbox-prev" onClick={onPrev} aria-label="上一个">
            ‹
          </button>
        )}
        {hasNext && (
          <button className="lightbox-btn lightbox-next" onClick={onNext} aria-label="下一个">
            ›
          </button>
        )}

        {/* Media */}
        <div className="lightbox-media">
          {isVideo ? (
            <video
              className="lightbox-video"
              src={src}
              controls
              autoPlay
              playsInline
              poster={project.img}
            />
          ) : (
            <img
              className="lightbox-image"
              src={src}
              alt={project.title}
            />
          )}
        </div>

        {/* Info */}
        <div className="lightbox-info">
          <h3 className="lightbox-title">{project.title}</h3>
          <p className="lightbox-desc">{project.desc}</p>
        </div>
      </div>
    </div>
  )
}
