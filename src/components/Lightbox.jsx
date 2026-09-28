import { useEffect, useCallback, useRef, useState } from 'react'
import { asset } from '../asset.js'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [videoState, setVideoState] = useState('poster') // 'poster' | 'loading' | 'playing' | 'error'
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [videoSize, setVideoSize] = useState(null) // 视频真实宽高，用于贴合元素盒子
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
    setVideoSize(null)
  }, [project])

  // 键盘事件 + 滚动锁定 + 焦点管理
  useEffect(() => {
    if (!project) return

    const handler = (e) => handleKeyDownRef.current(e)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // 打开时把焦点移进对话框，关闭时还给触发它的卡片
    const opener = document.activeElement
    const focusTimer = setTimeout(() => {
      document.querySelector('.lightbox-close')?.focus()
    }, 0)

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      if (opener instanceof HTMLElement) opener.focus()
    }

    // 不预加载视频本体：原实现每次打开（含方向键翻页）都注入
    // <link rel=preload as=video>，用户还没点播放就拉完整视频。
    // 封面靠 <video poster>，它需要 preload="metadata" 才会稳定渲染。
  }, [project])

  // 点击播放
  const handlePlay = useCallback(() => {
    setVideoState('loading')
    videoStateRef.current = 'loading'

    const video = videoRef.current
    if (!video) return

    // 不调 video.load()：preload="metadata" 下元素往往已经 readyState>=3，
    // load() 会丢弃已缓冲的数据并重新发起请求，用户点完播放要再等一次下载。
    const started = video.play()
    if (started) {
      started
        .then(() => {
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
    }
  }, [])

  // 视频可播放时自动切换到 playing
  const handleCanPlay = useCallback(() => {
    if (videoStateRef.current === 'loading') {
      setVideoState('playing')
      videoStateRef.current = 'playing'
    }
  }, [])

  // 拿到视频真实宽高，用于让元素盒子贴合内容（原生控件紧跟内容，不留黑边）
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      setVideoSize({ w: v.videoWidth, h: v.videoHeight })
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
      <div className="lightbox-content" role="dialog" aria-modal="true" aria-label={project.title} onClick={(e) => e.stopPropagation()}>
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
              {/*
                使用 video 原生 poster 属性展示海报，浏览器自动管理
                不再使用自定义海报 <img>，避免 z-index 遮挡干扰原生控件
              */}
              <video
                key={project.video}
                ref={videoRef}
                className={`lightbox-video ${videoState === 'poster' ? 'poster-mode' : ''}`}
                src={asset(project.video)}
                controls={videoState !== 'poster'}
                playsInline
                preload="metadata"
                poster={asset(project.img)}
                style={videoState === 'playing' && videoSize ? {
                  width: '100%',
                  height: 'auto',
                  aspectRatio: `${videoSize.w} / ${videoSize.h}`,
                  maxHeight: '80vh',
                } : undefined}
                onClick={videoState === 'poster' ? handlePlay : undefined}
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={handleCanPlay}
                onError={handleError}
                onProgress={handleProgress}
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
            <img className="lightbox-image" src={asset(project.img)} alt={project.title} />
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

