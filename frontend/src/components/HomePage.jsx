import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage({ currentCity, showToast }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('showing')
  
  const movies = [
    { id: 1, title: '流浪地球3', rating: 9.2 },
    { id: 2, title: '热辣滚烫', rating: 8.5 },
    { id: 3, title: '封神第三部', rating: 8.8 },
    { id: 4, title: '红海行动2', rating: 8.6 },
    { id: 5, title: '唐人街探案4', rating: 8.3 },
    { id: 6, title: '复仇者联盟5', rating: 8.9 }
  ]

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/city-select')}>
            <span>📍</span>
            <span>{currentCity.name}</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>电影</h1>
          <div style={{ width: '60px' }}></div>
        </div>
        
        <div style={{ display: 'flex', marginTop: '16px', borderBottom: '1px solid #eee' }}>
          <div style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'showing' ? 'bold' : 'normal', color: activeTab === 'showing' ? '#e74c3c' : '#666', borderBottom: activeTab === 'showing' ? '3px solid #e74c3c' : 'none' }} onClick={() => setActiveTab('showing')}>正在热映</div>
          <div style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', color: activeTab === 'upcoming' ? '#e74c3c' : '#666', borderBottom: activeTab === 'upcoming' ? '3px solid #e74c3c' : 'none' }} onClick={() => setActiveTab('upcoming')}>即将上映</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' }}>
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => navigate(`/movie/${movie.id}`)}>
            <img src={`https://picsum.photos/300/400?random=${idx + 1}`} alt={movie.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</div>
              <div style={{ color: '#f39c12', fontWeight: 'bold' }}>⭐ {movie.rating}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
            style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }} 
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            <img 
              src={`https://picsum.photos/300/400?random=${idx + 1}`} 
              alt={movie.title} 
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} 
            />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</div>
              <div style={{ color: '#f39c12', fontWeight: 'bold' }}>⭐ {movie.rating}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
