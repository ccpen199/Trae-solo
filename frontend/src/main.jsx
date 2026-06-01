import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import ParkingLots from './pages/ParkingLots.jsx';
import SpotStatus from './pages/SpotStatus.jsx';
import Guidance from './pages/Guidance.jsx';
import EntryExit from './pages/EntryExit.jsx';
import Admin from './pages/Admin.jsx';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53449/api';
export { API_BASE };

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🚗 城市停车诱导系统</h1>
        <nav className="nav">
          <Link to="/">运营看板</Link>
          <Link to="/parking-lots">停车场</Link>
          <Link to="/spots">车位状态</Link>
          <Link to="/guidance">诱导推荐</Link>
          <Link to="/entry-exit">入离场</Link>
          <Link to="/admin">管理后台</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parking-lots" element={<ParkingLots />} />
          <Route path="/spots" element={<SpotStatus />} />
          <Route path="/guidance" element={<Guidance />} />
          <Route path="/entry-exit" element={<EntryExit />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
