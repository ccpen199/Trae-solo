import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepStore } from '../store';

function SleepComplete() {
  const navigate = useNavigate();
  const { duration, type } = useSleepStore();

  const handleBack = () => {
    navigate('/sleep');
  };

  return (
    <div 
      className="page-container fade-in"
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 24 }}>
        {type === 'sleep' ? '🌙' : '💤'}
      </div>
      
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12 }}>
        {type === 'sleep' ? '睡眠结束' : '小憩结束'}
      </h1>
      
      <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 40 }}>
        本次{type === 'sleep' ? '睡眠' : '小憩'}时长 {duration} 分钟
      </p>

      <div 
        className="card" 
        style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: 24, 
          marginBottom: 40,
          minWidth: 280
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>总时长</div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{duration} 分钟</div>
        </div>
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>类型</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {type === 'sleep' ? '睡眠' : '小憩'}
          </div>
        </div>
      </div>

      <button
        onClick={handleBack}
        className="btn btn-primary"
        style={{ 
          padding: '14px 48px', 
          fontSize: 16,
          background: 'rgba(255,255,255,0.2)',
          color: 'white'
        }}
      >
        返回
      </button>
    </div>
  );
}

export default SleepComplete;
