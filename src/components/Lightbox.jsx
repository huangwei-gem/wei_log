import { useEffect, useCallback, useRef, useState } from 'react'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [videoState, setVideoState] = useState('poster') // 'poster' | 'loading' | 'playing' | 'error'
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const loadStartRef = useRef(null)

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

  const handleKeyDownRef = useRef(handleKeyDown)
  handleKeyDownRef.current = handleKeyDown

  // Reset video state when project changes
  useEffect(() => {
    setVideoState('poster')
    setProgress(0)
    loadStartRef.current = null
  }, [project])

  useEffect(() => {
    if (!project) return

    const handler = (e) => handleKeyDownRef.current(e)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // 预加载视频元数据
    if (project.type === 'video' && project.video) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'video'
      link.href = project.video
      document.head.appendChild(link)
      // 在页面隐藏时清理
      return () => {
        document.removeEventListener('keydown', handler)
        document.body.style.overflow = ''
        document.body.style.touchAction = ''
        if (link.parentNode) link.parentNode.removeChild(link)
      }
    }

    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [project])

  const handlePlay = useCallback(() => {
    setVideoState('loading')
    // 给浏览器一点时间显示加载状态
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load() // 开始加载
        videoRef.current.play().then(() => {
          setVideoState('playing')
        }).catch(() => {
          // 自动播放可能被阻止，显示播放按钮让用户手动点击
          setVideoState('poster')
        })
      }
    }, 100)
  }, [])

  const handleCanPlay = useCallback(() => {
    if (videoState === 'loading') {
      setVideoState('playing')
    }
  }, [videoState])

  const handleError = useCallback(() => {
    setVideoState('error')
  }, [])

  // 进度更新
  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const buffered = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      const duration = videoRef.current.duration
      if (duration > 0) {
        setProgress(Math.min(100, Math.round((buffered / duration) * 100)))
      }
    }
  }, [])

  if (!project) return null

  const isVideo = project.type === 'video'

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
            <div className="lightbox-video-wrapper">
              {/* 海报图 */}
              <img
                className="lightbox-poster"
                src={project.img}
                alt={project.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: '#000',
                  opacity: videoState === 'playing' ? 0 : 1,
                  transition: 'opacity 0.5s ease',
                  zIndex: 1,
                }}
              />

              {/* 视频元素 */}
              <video
                ref={videoRef}
                className="lightbox-video"
                src={project.video}
                controls={videoState === 'playing'}
                playsInline
                preload="metadata"
                poster={project.img}
                onCanPlay={handleCanPlay}
                onError={handleError}
                onProgress={handleProgress}
                style={{ zIndex: 2 }}
              />

              {/* 播放按钮覆盖层 */}
              {videoState === 'poster' && (
                <button className="lightbox-play-btn" onClick={handlePlay} aria-label="播放">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}

              {/* 加载中 */}
              {videoState === 'loading' && (
                <div className="lightbox-loading">
                  <div className="lightbox-spinner" />
                  <p>正在加载视频...</p>
                  {progress > 0 && (
                    <div className="lightbox-progress-bar">
                      <div className="lightbox-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              )}

              {/* 加载失败 */}
              {videoState === 'error' && (
                <div className="lightbox-loading">
                  <p style={{ color: '#ef4444' }}>视频加载失败</p>
                  <button className="btn btn-primary" style={{ marginTop: 12, padding: '8px 20px' }} onClick={handlePlay}>
                    重试
                  </button>
                </div>
              )}
            </div>
          ) : (
            <img className="lightbox-image" src={project.img} alt={project.title} />
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
