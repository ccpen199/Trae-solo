import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NoteDetail from './pages/NoteDetail.jsx';
import Publish from './pages/Publish.jsx';
import PoiList from './pages/PoiList.jsx';
import Admin from './pages/Admin.jsx';

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => window.location.href = '/'}>
            🌟 发现本地
          </div>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
            <Link to="/pois" className={location.pathname === '/pois' ? 'active' : ''}>商家</Link>
            <Link to="/publish" className={location.pathname === '/publish' ? 'active' : ''}>发布笔记</Link>
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>审核后台</Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/pois" element={<PoiList />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
