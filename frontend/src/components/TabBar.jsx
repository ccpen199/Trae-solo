import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const tabs = [
    { id: 'home', label: '电影', icon: '🎬', path: '/' },
    { id: 'cinema', label: '影院', icon: '🏛️', path: '/cinemas' },
    { id: 'user', label: '我的', icon: '👤', path: '/user' }
  ]
  
  const activeTab = tabs.find(t => t.path === location.pathname || 
    (location.pathname.startsWith('/movie') && t.id === 'home') ||
    (location.pathname.startsWith('/cinema/') && t.id === 'cinema'))?.id || 'home'

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', justifyContent: 'space-around', padding: '8px 0', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', zIndex: 100 }}>
      {tabs.map(tab => (
        <div key={tab.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px', color: activeTab === tab.id ? '#e74c3c' : '#666', cursor: 'pointer' }} onClick={() => navigate(tab.path)}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>{tab.icon}</div>
          <div style={{ fontSize: '12px' }}>{tab.label}</div>
        </div>
      ))}
    </div>
  )
}
