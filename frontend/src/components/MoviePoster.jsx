import React from 'react'

const palettes = [
  ['#1d4ed8', '#14b8a6'],
  ['#be123c', '#f97316'],
  ['#166534', '#84cc16'],
  ['#92400e', '#facc15'],
  ['#581c87', '#db2777'],
  ['#0f766e', '#60a5fa']
]

function hashText(text) {
  return Array.from(text || 'PinAI').reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

function movieTitle(movie, fallback) {
  return fallback || movie?.title || movie?.movie_title || '电影海报'
}

function movieMeta(movie, fallback) {
  if (fallback) return fallback
  return [movie?.country, movie?.version || movie?.versions || movie?.language].filter(Boolean).join(' · ') || 'PinAI Cinema'
}

function MoviePoster({ movie = {}, title, subtitle, height = 280, compact = false, className = '', style = {} }) {
  const name = movieTitle(movie, title)
  const [from, to] = palettes[hashText(name) % palettes.length]

  return (
    <div
      className={`movie-poster${compact ? ' movie-poster-compact' : ''}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={`${name} 海报`}
      style={{
        '--poster-from': from,
        '--poster-to': to,
        height,
        ...style
      }}
    >
      <div className="movie-poster-mark">PinAI</div>
      <div className="movie-poster-content">
        <span>{name}</span>
        {!compact && <small>{movieMeta(movie, subtitle)}</small>}
      </div>
    </div>
  )
}

export default MoviePoster
