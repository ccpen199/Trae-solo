import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CameraPage from './pages/CameraPage';
import LoginPage from './pages/LoginPage';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ color: 'white', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>📸 写真</h1>
        <p style={{ fontSize: '1.25rem' }}>美颜拍摄修图社区</p>
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/camera')}
            style={{
              backgroundColor: 'white',
              color: '#667eea',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
