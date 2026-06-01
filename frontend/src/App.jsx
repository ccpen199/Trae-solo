import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Dispatch from './pages/Dispatch'
import Monitoring from './pages/Monitoring'
import Signoff from './pages/Signoff'
import Audit from './pages/Audit'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <h2>冷链配送系统</h2>
          <nav>
            <NavLink to="/" end>数据概览</NavLink>
            <NavLink to="/orders">订单管理</NavLink>
            <NavLink to="/dispatch">调度中心</NavLink>
            <NavLink to="/monitoring">在途监控</NavLink>
            <NavLink to="/signoff">签收验收</NavLink>
            <NavLink to="/audit">审计追溯</NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/signoff" element={<Signoff />} />
            <Route path="/audit" element={<Audit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
