import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Hotels from './pages/Hotels'
import Mappings from './pages/Mappings'
import Collections from './pages/Collections'
import Comparison from './pages/Comparison'
import Strategies from './pages/Strategies'
import Reports from './pages/Reports'

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🏨 价格比价系统</h2>
        <nav>
          <NavLink to="/">📊 数据概览</NavLink>
          <NavLink to="/hotels">🏢 酒店房型</NavLink>
          <NavLink to="/mappings">🔗 映射管理</NavLink>
          <NavLink to="/collections">📡 价格采集</NavLink>
          <NavLink to="/comparison">⚖️ 比价分析</NavLink>
          <NavLink to="/strategies">📈 价格策略</NavLink>
          <NavLink to="/reports">📋 报表中心</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/mappings" element={<Mappings />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
