import { useEffect, useCallback, useRef, useState } from 'react'

export default function Lightbox({ project, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [videoState, setVideoState] = useState('poster') // 'poster' | 'loading' | 'playing' | 'paused' | 'error'
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)
  const [buffered, setBuffered] = useState(0) // 缓冲百分比 0-100
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideTimerRef = useRef(null)
  const videoStateRef = useRef('poster')
  const showControlsRef = useRef(true)

  // 同步状态到 ref，避免闭包过期
  videoStateRef.current = videoState
  showControlsRef.current = showControls

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
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      togglePlay()
    }
  }, [])

  const handleKeyDownRef = useRef(handleKeyDown)
  handleKeyDownRef.current = handleKeyDown

  // 时间格式化
  const formatTime = (sec) => {
    if (!isFinite(sec) || sec < 0) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // 显示/隐藏控件（自定义逻辑，不再依赖浏览器原生行为）
  const showControlsNow = useCallback(() => {
    setShowControls(true)
    showControlsRef.current = true
    clearTimeout(hideTimerRef.current)
    // 仅在播放中且鼠标静止 3 秒后才隐藏
    hideTimerRef.current = setTimeout(() => {
      if (videoStateRef.current === 'playing') {
        setShowControls(false)
        showControlsRef.current = false
      }
    }, 3000)
  }, [])

  const keepControlsVisible = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    setShowControls(true)
    showControlsRef.current = true
  }, [])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
    showControlsNow()
  }, [showControlsNow])

  // 点击播放（从海报状态开始）
  const handlePlay = useCallback(() => {
    setVideoState('loading')
    videoStateRef.current = 'loading'
    setShowControls(true)
    showControlsRef.current = true

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
            showControlsNow()
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
  }, [showControlsNow])

  // 视频可播放时自动切换到 playing
  const handleCanPlay = useCallback(() => {
    if (videoStateRef.current === 'loading') {
      setVideoState('playing')
      videoStateRef.current = 'playing'
      showControlsNow()
    }
  }, [showControlsNow])

  // 加载失败
  const handleError = useCallback(() => {
    setVideoState('error')
    videoStateRef.current = 'error'
    setShowControls(true)
    showControlsRef.current = true
  }, [])

  // 缓冲进度
  const handleProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) return
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    if (video.duration > 0) {
      setBuffered(Math.min(100, Math.round((bufferedEnd / video.duration) * 100)))
    }
  }, [])

  // 播放时间更新
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (video) setCurrentTime(video.currentTime)
  }, [])

  // 元数据加载完成
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (video && isFinite(video.duration)) setDuration(video.duration)
  }, [])

  // 原生播放事件
  const handleNativePlay = useCallback(() => {
    setVideoState('playing')
    videoStateRef.current = 'playing'
    showControlsNow()
  }, [showControlsNow])

  // 原生暂停事件
  const handleNativePause = useCallback(() => {
    if (videoStateRef.current !== 'poster' && videoStateRef.current !== 'error') {
      setVideoState('paused')
      videoStateRef.current = 'paused'
    }
    setShowControls(true)
    showControlsRef.current = true
    clearTimeout(hideTimerRef.current)
  }, [])

  // 播放结束
  const handleEnded = useCallback(() => {
    setVideoState('paused')
    videoStateRef.current = 'paused'
    setShowControls(true)
    showControlsRef.current = true
    clearTimeout(hideTimerRef.current)
  }, [])

  // 拖动进度条
  const handleSeek = useCallback((e) => {
    const video = videoRef.current
    if (!video || !isFinite(video.duration)) return
    const t = parseFloat(e.target.value)
    video.currentTime = t
    setCurrentTime(t)
  }, [])

  // 音量调节
  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current
    if (!video) return
    const v = parseFloat(e.target.value)
    video.volume = v
    video.muted = v === 0
    setVolume(v)
    setIsMuted(v === 0)
  }, [])

  // 静音切换
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
    if (video.muted) {
      setVolume(0)
    } else {
      video.volume = 1
      setVolume(1)
    }
  }, [])

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    } else {
      wrapper.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    }
  }, [])

  // 监听全屏变化
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 重置视频状态
  useEffect(() => {
    setVideoState('poster')
    videoStateRef.current = 'poster'
    setBuffered(0)
    setCurrentTime(0)
    setDuration(0)
    setShowControls(true)
    showControlsRef.current = true
    clearTimeout(hideTimerRef.current)
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

  // 清理隐藏定时器
  useEffect(() => {
    return () => clearTimeout(hideTimerRef.current)
  }, [])

  if (!project) return null

  const isVideo = project.type === 'video'
  const isPlaying = videoState === 'playing'
  const seekPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

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
            <div
              ref={wrapperRef}
              className={`lightbox-video-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
              onMouseMove={showControlsNow}
              onMouseLeave={keepControlsVisible}
            >
              {/*
                禁用浏览器原生控件 (controls={false})，改用自定义控件条。
                原生控件的 Shadow DOM 在 transform/backdrop-filter 等
                祖先元素下鼠标命中检测异常，导致控件消失、进度条不可用。
                自定义控件是普通 HTML 元素，完全可控。
              */}
              <video
                ref={videoRef}
                className="lightbox-video"
                src={project.video}
                controls={false}
                playsInline
                preload="metadata"
                poster={project.img}
                onClick={togglePlay}
                onCanPlay={handleCanPlay}
                onError={handleError}
                onProgress={handleProgress}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handleNativePlay}
                onPause={handleNativePause}
                onEnded={handleEnded}
              />

              {/* 播放按钮 — 只在海报状态显示 */}
              {videoState === 'poster' && (
                <button className="lightbox-play-btn" onClick={handlePlay} aria-label="播放">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}

              {/* 中央暂停按钮 — 暂停时显示 */}
              {videoState === 'paused' && !showControls && (
                <button className="lightbox-play-btn" onClick={togglePlay} aria-label="继续播放">
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
                  {buffered > 0 && (
                    <div className="lightbox-progress-bar">
                      <div className="lightbox-progress-fill" style={{ width: `${buffered}%` }} />
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

              {/* ===== 自定义控件条 ===== */}
              {(videoState === 'playing' || videoState === 'paused' || videoState === 'loading') && (
                <div
                  className={`video-controls ${showControls ? 'visible' : 'hidden'}`}
                  onMouseEnter={keepControlsVisible}
                  onMouseMove={(e) => {
                    // 阻止事件冒泡到 wrapper，避免 wrapper 的 onMouseMove
                    // 重新设置隐藏定时器，导致控件悬停时仍会消失
                    e.stopPropagation()
                    keepControlsVisible()
                  }}
                >
                  {/* 进度条 */}
                  <div className="video-controls-progress">
                    <div className="video-buffered" style={{ width: `${buffered}%` }} />
                    <input
                      type="range"
                      className="video-seek"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={Math.min(currentTime, duration || 0)}
                      onChange={handleSeek}
                      aria-label="播放进度"
                      style={{
                        background: `linear-gradient(to right, var(--accent) ${seekPercent}%, rgba(255,255,255,0.25) ${seekPercent}%)`,
                      }}
                    />
                  </div>

                  {/* 按钮行 */}
                  <div className="video-controls-buttons">
                    <button
                      className="video-btn"
                      onClick={togglePlay}
                      aria-label={isPlaying ? '暂停' : '播放'}
                    >
                      {isPlaying ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <span className="video-time">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="video-controls-right">
                      <button className="video-btn" onClick={toggleMute} aria-label={isMuted ? '取消静音' : '静音'}>
                        {isMuted || volume === 0 ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.94 8.94 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                          </svg>
                        )}
                      </button>

                      <input
                        type="range"
                        className="video-volume"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        aria-label="音量"
                        style={{
                          background: `linear-gradient(to right, #fff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.25) ${(isMuted ? 0 : volume) * 100}%)`,
                        }}
                      />

                      <button className="video-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? '退出全屏' : '全屏'}>
                        {isFullscreen ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
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
