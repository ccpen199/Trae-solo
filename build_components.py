import os

frontend_dir = '/Users/chen/Documents/trae_projects/local_projects/may-4852/frontend/src'
components_dir = os.path.join(frontend_dir, 'components')
os.makedirs(components_dir, exist_ok=True)

# SplashScreen
splash_code = '''import React from 'react'

export default function SplashScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: 'white' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>hiyou</h1>
      <p style={{ fontSize: '16px', opacity: 0.9 }}>发现好电影，遇见好时光</p>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'SplashScreen.jsx'), 'w', encoding='utf-8') as f:
    f.write(splash_code)
print('Created SplashScreen.jsx')

# OnboardingPage
onboarding_code = '''import React from 'react'

export default function OnboardingPage({ onComplete }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '32px' }}>🎬</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>海量影片</h2>
        <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6 }}>热映大片、即将上映、经典佳作，应有尽有</p>
      </div>
      
      <div style={{ padding: '32px' }}>
        <button 
          onClick={() => { localStorage.setItem('hasSeenOnboarding', 'true'); onComplete() }} 
          style={{ width: '100%', padding: '14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          开始体验
        </button>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'OnboardingPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(onboarding_code)
print('Created OnboardingPage.jsx')

# HomePage
home_code = '''import React, { useState } from 'react'
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
          <div 
            style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'showing' ? 'bold' : 'normal', color: activeTab === 'showing' ? '#e74c3c' : '#666', borderBottom: activeTab === 'showing' ? '3px solid #e74c3c' : 'none' }} 
            onClick={() => setActiveTab('showing')}
          >
            正在热映
          </div>
          <div 
            style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', color: activeTab === 'upcoming' ? '#e74c3c' : '#666', borderBottom: activeTab === 'upcoming' ? '3px solid #e74c3c' : 'none' }} 
            onClick={() => setActiveTab('upcoming')}
          >
            即将上映
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' }}>
        {movies.map((movie, idx) => (
          <div 
            key={movie.id} 
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
'''
with open(os.path.join(components_dir, 'HomePage.jsx'), 'w', encoding='utf-8') as f:
    f.write(home_code)
print('Created HomePage.jsx')

# MovieDetailPage
movie_detail_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MovieDetailPage({ currentCity, showToast }) {
  const navigate = useNavigate()
  const movie = { 
    title: '流浪地球3', 
    rating: 9.2, 
    overview: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。', 
    director: '郭帆', 
    actors: '吴京,刘德华,李雪健', 
    runtime: 173, 
    genres: '科幻,冒险,灾难' 
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'relative', height: '240px' }}>
        <img 
          src="https://picsum.photos/800/400?random=10" 
          alt={movie.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', display: 'flex', gap: '16px', color: 'white' }}>
          <img 
            src="https://picsum.photos/300/400?random=1" 
            alt={movie.title} 
            style={{ width: '100px', height: '133px', borderRadius: '8px' }} 
          />
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

      <button 
        onClick={() => navigate(-1)} 
        style={{ margin: '16px', padding: '12px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        返回
      </button>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'MovieDetailPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(movie_detail_code)
print('Created MovieDetailPage.jsx')

# CinemaPage
cinema_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CinemaPage({ currentCity }) {
  const navigate = useNavigate()
  const cinemas = [
    { id: 1, name: '万达影城(CBD店)', address: '朝阳区建国路88号SOHO现代城', rating: 4.8 },
    { id: 2, name: '博纳国际影城(悠唐店)', address: '朝阳区三丰北里2号悠唐购物中心', rating: 4.6 },
    { id: 3, name: 'CGV影城(国贸店)', address: '朝阳区建国门外大街1号国贸商城', rating: 4.7 }
  ]

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>影院</h1>
      </div>
      
      <div style={{ padding: '16px' }}>
        {cinemas.map(cinema => (
          <div 
            key={cinema.id} 
            style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }} 
            onClick={() => navigate(`/cinema/${cinema.id}`)}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{cinema.name}</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>📍 {cinema.address}</p>
            <div style={{ color: '#f39c12', fontWeight: 'bold' }}>⭐ {cinema.rating}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'CinemaPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(cinema_code)
print('Created CinemaPage.jsx')

# CinemaDetailPage
cinema_detail_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CinemaDetailPage({ currentCity }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <h1>影院详情</h1>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginTop: '20px', padding: '12px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        返回
      </button>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'CinemaDetailPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(cinema_detail_code)
print('Created CinemaDetailPage.jsx')

# UserPage
user_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function UserPage({ isLoggedIn, onLogout }) {
  const navigate = useNavigate()
  
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>欢迎来到 hiyou</h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>登录后享受更多专属服务</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/login')} 
            style={{ padding: '12px 32px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
          >
            登录
          </button>
          <button 
            onClick={() => navigate('/register')} 
            style={{ padding: '12px 32px', background: 'white', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
          >
            注册
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', padding: '40px 20px', color: 'white' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '16px' }}>👤</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>用户</h2>
      </div>
      
      <div style={{ background: 'white', margin: '16px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }} 
          onClick={() => navigate('/favorites')}
        >
          <span style={{ fontSize: '20px', marginRight: '12px' }}>❤️</span>
          <span>我的收藏</span>
        </div>
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }} 
          onClick={() => navigate('/settings')}
        >
          <span style={{ fontSize: '20px', marginRight: '12px' }}>⚙️</span>
          <span>设置</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px' }}>
        <button 
          onClick={onLogout} 
          style={{ padding: '12px 32px', background: 'white', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer' }}
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'UserPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(user_code)
print('Created UserPage.jsx')

# LoginPage
login_code = '''import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ phone: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('token', 'test-token-123')
    onLogin()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '60px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', color: '#e74c3c', marginBottom: '8px' }}>🎬 hiyou</h1>
        <p style={{ color: '#666' }}>发现好电影，遇见好时光</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>手机号</label>
          <input
            type="tel"
            placeholder="请输入手机号"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>密码</label>
          <input
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: '14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          登录
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        还没有账号？<a onClick={() => navigate('/register')} style={{ color: '#e74c3c', cursor: 'pointer', marginLeft: '4px' }}>立即注册</a>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ padding: '8px 24px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
        >
          稍后再说
        </button>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'LoginPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(login_code)
print('Created LoginPage.jsx')

# RegisterPage
register_code = '''import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ phone: '', password: '', nickname: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('token', 'test-token-123')
    onLogin()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '60px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', color: '#e74c3c', marginBottom: '8px' }}>🎬 hiyou</h1>
        <p style={{ color: '#666' }}>发现好电影，遇见好时光</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>昵称</label>
          <input
            type="text"
            placeholder="请输入昵称"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>手机号</label>
          <input
            type="tel"
            placeholder="请输入手机号"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>密码</label>
          <input
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: '14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          注册
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        已有账号？<a onClick={() => navigate('/login')} style={{ color: '#e74c3c', cursor: 'pointer', marginLeft: '4px' }}>立即登录</a>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'RegisterPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(register_code)
print('Created RegisterPage.jsx')

# CitySelectPage
city_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CitySelectPage({ currentCity, onCityChange }) {
  const navigate = useNavigate()
  const hotCities = [
    { id: 1, name: '北京' },
    { id: 2, name: '上海' },
    { id: 3, name: '广州' },
    { id: 4, name: '深圳' }
  ]

  const handleSelect = (city) => {
    onCityChange(city)
    navigate('/')
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>选择城市</h1>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '12px' }}>热门城市</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {hotCities.map(city => (
            <div 
              key={city.id} 
              style={{ padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', cursor: 'pointer' }} 
              onClick={() => handleSelect(city)}
            >
              {city.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'CitySelectPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(city_code)
print('Created CitySelectPage.jsx')

# SettingsPage
settings_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()
  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>设置</h1>
      </div>
      
      <div style={{ background: 'white', margin: '16px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {['消息通知', '关于我们', '清理缓存'].map((item, i) => (
          <div 
            key={i} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < 2 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer' }}
          >
            <span>{item}</span>
            <span style={{ color: '#ccc' }}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'SettingsPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(settings_code)
print('Created SettingsPage.jsx')

# FavoritesPage
favorites_code = '''import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function FavoritesPage() {
  const navigate = useNavigate()
  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>我的收藏</h1>
      </div>
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', opacity: 0.5, marginBottom: '16px' }}>🎬</div>
        <p style={{ color: '#999' }}>暂无收藏的电影</p>
        <button 
          onClick={() => navigate('/')} 
          style={{ marginTop: '24px', padding: '10px 32px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          去发现好电影
        </button>
      </div>
    </div>
  )
}
'''
with open(os.path.join(components_dir, 'FavoritesPage.jsx'), 'w', encoding='utf-8') as f:
    f.write(favorites_code)
print('Created FavoritesPage.jsx')

# App.jsx
app_code = '''import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import SplashScreen from './components/SplashScreen'
import OnboardingPage from './components/OnboardingPage'
import HomePage from './components/HomePage'
import MovieDetailPage from './components/MovieDetailPage'
import CinemaPage from './components/CinemaPage'
import CinemaDetailPage from './components/CinemaDetailPage'
import UserPage from './components/UserPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import CitySelectPage from './components/CitySelectPage'
import SettingsPage from './components/SettingsPage'
import FavoritesPage from './components/FavoritesPage'

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentCity, setCurrentCity] = useState({ id: 1, name: '北京' })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
      
      const token = localStorage.getItem('token')
      if (token) {
        setIsLoggedIn(true)
      }
      
      const savedCity = localStorage.getItem('currentCity')
      if (savedCity) {
        try {
          setCurrentCity(JSON.parse(savedCity))
        } catch (e) {
          console.error('Failed to parse saved city')
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const showToastFunc = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    showToastFunc('登录成功')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    showToastFunc('已退出登录')
  }

  const handleCityChange = (city) => {
    setCurrentCity(city)
    localStorage.setItem('currentCity', JSON.stringify(city))
    showToastFunc(`已切换到${city.name}`)
  }

  if (showSplash) {
    return <SplashScreen />
  }

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', background: '#333', color: 'white', borderRadius: '8px', zIndex: 1000 }}>
          {toast}
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage currentCity={currentCity} showToast={showToastFunc} />} />
        <Route path="/movie/:id" element={<MovieDetailPage currentCity={currentCity} showToast={showToastFunc} />} />
        <Route path="/cinemas" element={<CinemaPage currentCity={currentCity} />} />
        <Route path="/cinema/:id" element={<CinemaDetailPage currentCity={currentCity} />} />
        <Route path="/user" element={<UserPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
        <Route path="/city-select" element={<CitySelectPage currentCity={currentCity} onCityChange={handleCityChange} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
'''
with open(os.path.join(frontend_dir, 'App.jsx'), 'w', encoding='utf-8') as f:
    f.write(app_code)
print('Created App.jsx')

print('All components created successfully!')
