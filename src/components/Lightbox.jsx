import { useEffect, useCallback, useRef, useState } from 'react'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [videoState, setVideoState] = useState('poster') // 'poster' | 'loading' | 'playing' | 'error'
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const videoStateRef = useRef('poster')

  // 同步 videoState 到 ref，避免闭包过期
  videoStateRef.current = videoState

  // 使用 ref 保存回调，避免变化导致 effect 重新执行
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

  // 重置视频状态
  useEffect(() => {
    setVideoState('poster')
    videoStateRef.current = 'poster'
    setProgress(0)
  }, [project])

  // 键盘事件 + 滚动锁定 + 视频预加载
  useEffect(() => {
    if (!project) return

    const handler = (e) => handleKeyDownRef.current(e)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // 预加载视频资源
    if (project.type === 'video' && project.video) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'video'
      link.href = project.video
      document.head.appendChild(link)

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

  // 点击播放
  const handlePlay = useCallback(() => {
    setVideoState('loading')
    videoStateRef.current = 'loading'

    // 下一帧开始加载，让 UI 先渲染 loading 状态
    requestAnimationFrame(() => {
      const video = videoRef.current
      if (!video) return

      video.load() // 开始加载
      video.play()
        .then(() => {
          // 播放成功
          if (videoStateRef.current === 'loading') {
            setVideoState('playing')
            videoStateRef.current = 'playing'
          }
        })
        .catch((err) => {
          // 播放被阻止（如用户未交互）
          if (err.name === 'NotAllowedError') {
            setVideoState('poster')
            videoStateRef.current = 'poster'
          } else {
            setVideoState('error')
            videoStateRef.current = 'error'
          }
        })
    })
  }, [])

  // 视频可播放时自动切换到 playing
  const handleCanPlay = useCallback(() => {
    if (videoStateRef.current === 'loading') {
      setVideoState('playing')
      videoStateRef.current = 'playing'
    }
  }, [])

  // 加载失败
  const handleError = useCallback(() => {
    setVideoState('error')
    videoStateRef.current = 'error'
  }, [])

  // 缓冲进度
  const handleProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) return
    const buffered = video.buffered.end(video.buffered.length - 1)
    if (video.duration > 0) {
      setProgress(Math.min(100, Math.round((buffered / video.duration) * 100)))
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
              {/* 海报图 — 始终显示，播放后淡出 */}
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

              {/* 播放按钮 — 只在海报状态显示 */}
              {videoState === 'poster' && (
                <button className="lightbox-play-btn" onClick={handlePlay} aria-label="播放">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}

              {/* 加载中 */}
              {videoState === 'loading' && (
                <div className="lightbox-loading" style={{ zIndex: 6 }}>
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
                <div className="lightbox-loading" style={{ zIndex: 6 }}>
                  <p style={{ color: '#ef4444' }}>视频加载失败</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 12, padding: '8px 20px', fontSize: '0.85rem' }}
                    onClick={handlePlay}
                  >
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
