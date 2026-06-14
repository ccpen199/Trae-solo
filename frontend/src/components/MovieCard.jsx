import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  const [copyrightChecked, setCopyrightChecked] = useState(movie.copyright_verified !== undefined ? movie.copyright_verified : null);

  const getImageUrl = () => {
    if (movie.poster_url) return movie.poster_url;
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`movie poster for ${movie.title}, cinematic, professional`)}&image_size=portrait_4_3`;
  };

  const rating = movie.rating !== undefined ? movie.rating : movie.vote_average;
  const year = movie.year !== undefined ? movie.year : movie.release_year;
  const voteCount = movie.vote_count !== undefined ? movie.vote_count : 0;

  return (
    <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={getImageUrl()}
            alt={movie.title}
            className="card-img"
            style={{ aspectRatio: '2/3' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPu+lkTwvdGV4dD48L3N2Zz4=';
            }}
          />
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'flex-end'
          }}>
            {movie.content_rating && (
              <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                {movie.content_rating}
              </span>
            )}
            {copyrightChecked !== null && (
              <span className={`badge ${copyrightChecked ? 'badge-positive' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {copyrightChecked ? '✓ 版权合规' : '⚠️ 校验中'}
              </span>
            )}
          </div>
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            display: 'flex',
            gap: '4px'
          }}>
            {movie.imdb_id && (
              <span className="badge badge-rating" style={{ fontSize: '10px', padding: '2px 6px' }}>
                IMDb
              </span>
            )}
            {movie.tmdb_id && (
              <span className="badge badge-positive" style={{ fontSize: '10px', padding: '2px 6px' }}>
                TMDB
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '12px 16px 16px' }}>
          <h4 style={{
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {movie.title}
          </h4>
          {movie.original_title && movie.original_title !== movie.title && (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {movie.original_title}
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            marginBottom: '4px'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {year || 'N/A'}
            </span>
            <span className="badge badge-rating">
              ⭐ {rating ? Number(rating).toFixed(1) : 'N/A'}
            </span>
          </div>
          {voteCount > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              👥 {voteCount >= 10000 ? `${(voteCount / 10000).toFixed(1)}万` : voteCount.toLocaleString()} 评价
            </div>
          )}
          {movie.director && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              🎬 导演: {movie.director}
            </div>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {movie.genres.slice(0, 3).map((genre, i) => (
                <span key={i} className="tag" style={{ fontSize: '11px', padding: '2px 8px', marginRight: '4px', marginBottom: '4px' }}>
                  {genre}
                </span>
              ))}
            </div>
          )}
          {(movie.countries && movie.countries.length > 0) && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              🌍 {movie.countries.join('/')}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
