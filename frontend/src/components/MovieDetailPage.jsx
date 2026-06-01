import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MovieDetailPage({ currentCity, showToast }) {
  const navigate = useNavigate()
  const movie = { title: '流浪地球3', rating: 9.2, overview: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。', director: '郭帆', actors: '吴京,刘德华,李雪健', runtime: 173, genres: '科幻,冒险,灾难' }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'relative', height: '240px' }}>
        <img src="https://picsum.photos/800/400?random=10" alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', display: 'flex', gap: '16px', color: 'white' }}>
          <img src="https://picsum.photos/300/400?random=1" alt={movie.title} style={{ width: '100px', height: '133px', borderRadius: '8px' }} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{movie.title}</h2>
            <div>⭐ {movie.rating}</div>
            <div>{movie.genres} | {movie.runtime}分钟</div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '16px', background: 'white', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>剧情简介</h3>
        <p style={{ color: '#666', lineHeight: 1.6 }}>{movie.overview}</p>
      </div>
      
      <div style={{ padding: '16px', background: 'white' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>演职人员</h3>
        <p style={{ color: '#666', marginBottom: '8px' }}>导演：{movie.director}</p>
        <p style={{ color: '#666' }}>主演：{movie.actors}</p>
      </div>

      <button onClick={() => navigate(-1)} style={{ margin: '16px', padding: '12px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>返回</button>
    </div>
  )
}
