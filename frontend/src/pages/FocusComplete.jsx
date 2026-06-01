import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusStore } from '../store';

function FocusComplete() {
  const navigate = useNavigate();
  const { duration, mode } = useFocusStore();

  const handleBack = () => {
    navigate('/focus');
  };

  const focusMinutes = Math.floor(duration / 60);

  return (
    <div 
      className="page-container fade-in"
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 24 }}>
        ✨
      </div>
      
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12 }}>
        专注完成
      </h1>
      
      <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 40 }}>
        太棒了！你完成了一次专注
      </p>

      <div 
        className="card" 
        style={{ 
          background: 'rgba(255,255,255,0.15)', 
          padding: 24, 
          marginBottom: 40,
          minWidth: 280
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>专注时长</div>
          <div style={{ fontSize: 36, fontWeight: 600 }}>{focusMinutes} 分钟</div>
        </div>
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>模式</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {mode === 'deep' ? '高效模式' : '普通模式'}
          </div>
        </div>
      </div>

      <button
        onClick={handleBack}
        className="btn btn-primary"
        style={{ 
          padding: '14px 48px', 
          fontSize: 16,
          background: 'rgba(255,255,255,0.25)',
          color: 'white'
        }}
      >
        继续专注
      </button>
    </div>
  );
}

export default FocusComplete;
