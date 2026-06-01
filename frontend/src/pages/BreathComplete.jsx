import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreathStore } from '../store';

function BreathComplete() {
  const navigate = useNavigate();
  const { duration, breaths } = useBreathStore();

  const handleBack = () => {
    navigate('/breath');
  };

  return (
    <div 
      className="page-container fade-in"
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 24 }}>
        🌬️
      </div>
      
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12 }}>
        呼吸练习完成
      </h1>
      
      <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 40 }}>
        身心放松，感觉焕然一新
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
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>练习时长</div>
          <div style={{ fontSize: 36, fontWeight: 600 }}>{duration} 分钟</div>
        </div>
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>呼吸次数</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{breaths} 次</div>
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
        再次练习
      </button>
    </div>
  );
}

export default BreathComplete;
