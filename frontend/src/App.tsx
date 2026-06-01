import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Repositories from './pages/Repositories.jsx'
import RepositoryDetail from './pages/RepositoryDetail.jsx'
import ArtifactDetail from './pages/ArtifactDetail.jsx'
import VersionDetail from './pages/VersionDetail.jsx'
import Upload from './pages/Upload.jsx'
import Permissions from './pages/Permissions.jsx'
import Tokens from './pages/Tokens.jsx'
import Audit from './pages/Audit.jsx'
import Retention from './pages/Retention.jsx'
import Alerts from './pages/Alerts.jsx'

const navItems = [
  { path: '/', icon: '📊', label: '总览' },
  { path: '/repositories', icon: '📦', label: '仓库管理' },
  { path: '/upload', icon: '⬆️', label: '上传校验' },
  { path: '/permissions', icon: '🔐', label: '权限控制' },
  { path: '/tokens', icon: '🎫', label: '访问令牌' },
  { path: '/retention', icon: '🧹', label: '清理策略' },
  { path: '/alerts', icon: '🚨', label: '告警中心' },
  { path: '/audit', icon: '📋', label: '审计日志' },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🏛️ 制品仓库</div>
        {navItems.map(item => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <div
              key={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        })}
      </aside>
      <div className="main">
        <header className="header">
          <span className="header-title">内部制品仓库管理系统</span>
          <input
            className="header-search"
            placeholder="搜索制品、版本..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                navigate(`/repositories?q=${encodeURIComponent(search.trim())}`)
              }
            }}
          />
          <span className="header-user">👤 admin</span>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/repositories/:id" element={<RepositoryDetail />} />
            <Route path="/artifacts/:id" element={<ArtifactDetail />} />
            <Route path="/versions/:id" element={<VersionDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/retention" element={<Retention />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}