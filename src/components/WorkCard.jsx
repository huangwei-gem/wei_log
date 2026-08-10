export default function WorkCard({ project, onClick }) {
  const isVideo = project.type === 'video'

  return (
    <div className="work-card" onClick={() => onClick(project)}>
      <div className="work-card-thumb">
        {isVideo ? (
          <>
            <video
              muted
              loop
              playsInline
              preload="metadata"
              poster={project.img || undefined}
              className="work-card-media"
            >
              <source src={project.video} type="video/mp4" />
            </video>
            <span className="work-card-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : (
          <img
            className="work-card-media"
            src={project.img}
            alt={project.title}
            loading="lazy"
          />
        )}

        {/* Hover overlay — 参考 upma.cn 风格 */}
        <div className="work-card-overlay">
          <div className="work-card-overlay-content">
            <h3 className="work-card-overlay-title">{project.title}</h3>
            <div className="work-card-overlay-divider"></div>
            <p className="work-card-overlay-desc">{project.desc}</p>
            <span className="work-card-overlay-action">
              {isVideo ? '播放视频' : '查看作品'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
