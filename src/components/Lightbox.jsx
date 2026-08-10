import { useEffect, useCallback, useRef } from 'react'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  // 使用 ref 保存回调，避免 handleKeyDown 变化导致 effect 重新执行
  const onCloseRef = useRef(onClose)
  const onPrevRef = useRef(onPrev)
  const onNextRef = useRef(onNext)
  const hasPrevRef = useRef(hasPrev)
  const hasNextRef = useRef(hasNext)

  onCloseRef.current = onClose
  onPrevRef.current = onPrev
  onNextRef.current = onNext
  hasPrevRef.current = hasPrev
  hasNextRef.current = hasNext

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onCloseRef.current()
    if (e.key === 'ArrowLeft' && hasPrevRef.current) onPrevRef.current()
    if (e.key === 'ArrowRight' && hasNextRef.current) onNextRef.current()
  }, [])

  // 用 ref 固定 handleKeyDown，避免依赖变化
  const handleKeyDownRef = useRef(handleKeyDown)
  handleKeyDownRef.current = handleKeyDown

  useEffect(() => {
    if (!project) return

    const handler = (e) => handleKeyDownRef.current(e)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [project]) // 只依赖 project，避免 handleKeyDown 变化导致溢出滚动状态被重置

  if (!project) return null

  const isVideo = project.type === 'video'
  const src = isVideo ? project.video : project.img

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-btn lightbox-close" onClick={onClose} aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {hasPrev && (
          <button className="lightbox-btn lightbox-prev" onClick={onPrev} aria-label="上一个">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        {hasNext && (
          <button className="lightbox-btn lightbox-next" onClick={onNext} aria-label="下一个">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        )}

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

        <div className="lightbox-info">
          <h3 className="lightbox-title">{project.title}</h3>
          <p className="lightbox-desc">{project.desc}</p>
        </div>
      </div>
    </div>
  )
}
