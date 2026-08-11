import { useRef, useState, useEffect } from 'react'

/**
 * 视频懒加载组件 — 只有进入可视区域才加载视频源
 * 封面（poster）始终立即加载，视频本体延后加载
 */
export default function LazyVideo({ poster, videoSrc, className, onError }) {
  const containerRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0,
      },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const cls = className ? className + ' lazy-video-container' : 'lazy-video-container'

  return (
    <div ref={containerRef} className={cls} style={{ position: 'relative', background: 'var(--bg-card, #111)' }}>
      {/* Poster always loads immediately */}
      <img
        src={poster}
        alt=""
        className="lazy-video-poster"
        loading="lazy"
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* Video loads only when in viewport */}
      {shouldLoad && !hasError && (
        <video
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            zIndex: 2,
          }}
          onError={handleError}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Error fallback */}
      {hasError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          zIndex: 3,
          background: 'var(--bg-card, #111)',
        }}>
          视频加载失败
        </div>
      )}
    </div>
  )
}
