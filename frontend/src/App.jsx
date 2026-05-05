import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ECurrencyPage from './pages/ECurrencyPage'
import GoldCoinsPage from './pages/GoldCoinsPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">PMS积分激励系统</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">首页</Link>
              <Link to="/e-currency" className="nav-link">E币明细</Link>
              <Link to="/gold-coins" className="nav-link">金币明细</Link>
            </nav>
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/e-currency" element={<ECurrencyPage />} />
            <Route path="/gold-coins" element={<GoldCoinsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
