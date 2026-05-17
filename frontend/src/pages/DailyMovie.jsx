import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyAPI } from '../utils/api';

function DailyMovie() {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMovie();
  }, []);

  const loadMovie = async () => {
    try {
      const res = await dailyAPI.getMovie();
      if (res.data.success) {
        setMovie(res.data.data);
      }
    } catch (error) {
      console.error('Load movie failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <button
        className="btn btn-outline"
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/')}
      >
        ← 返回
      </button>

      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: 8 }}>
          🎬 每日抖英
        </h2>
        <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
          {new Date().toLocaleDateString('zh-CN')}
        </div>

        <div
          style={{
            fontSize: 48,
            marginBottom: 16
          }}
        >
          🎥
        </div>

        <h3 style={{ marginBottom: 24 }}>{movie?.movie_name}</h3>

        <div
          style={{
            backgroundColor: '#fff0f6',
            borderRadius: 12,
            padding: 24,
            marginBottom: 16
          }}
        >
          <p style={{ fontSize: 18, fontStyle: 'italic', margin: '0 0 16px 0' }}>
            "{movie?.line}"
          </p>
          {movie?.line_translation && (
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
              {movie.line_translation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyMovie;
