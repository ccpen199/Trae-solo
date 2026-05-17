import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <div className="app-container">
      <nav style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '18px', fontWeight: '600' }}>
          🎵 抖音听歌
        </Link>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
