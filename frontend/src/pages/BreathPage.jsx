import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreathStore } from '../store';
import { breathAPI } from '../services/api';

const durations = [3, 5, 10, 15, 20];

function BreathPage() {
  const navigate = useNavigate();
  const { start } = useBreathStore();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [selectedSound, setSelectedSound] = useState('ocean');
  const [sounds, setSounds] = useState([]);

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    try {
      const response = await breathAPI.getSounds();
      setSounds(response.data.sounds);
    } catch (error) {
      console.error('获取声音失败:', error);
      setSounds([
        { id: 'ocean', name: '海浪' },
        { id: 'forest', name: '森林' },
        { id: 'stream', name: '溪流' },
        { id: 'birds', name: '鸟鸣' }
      ]);
    }
  };

  const handleStart = async () => {
    try {
      await breathAPI.start({
        duration: selectedDuration,
        breaths: 0,
        sound: selectedSound
      });
      start(selectedDuration, selectedSound);
      navigate('/breath/running', { replace: true });
    } catch (error) {
      console.error('开始呼吸失败:', error);
      start(selectedDuration, selectedSound);
      navigate('/breath/running', { replace: true });
    }
  };

  return (
    <div className="page-container fade-in">
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32 }}>呼吸</h1>

      <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: 32 }}>
        <div 
          className="breathing-animation"
          style={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: 48 }}>🌬️</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          深呼吸帮助你放松身心<br/>
          减轻焦虑，提升专注力
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>时长</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              style={{
                padding: '12px 8px',
                borderRadius: 12,
                background: selectedDuration === d ? '#10B981' : 'var(--bg-secondary)',
                color: selectedDuration === d ? 'white' : 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {d}分钟
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>背景音</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {sounds.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSound(s.id)}
              style={{
                padding: '16px 12px',
                borderRadius: 12,
                background: selectedSound === s.id ? '#10B981' : 'var(--bg-secondary)',
                color: selectedSound === s.id ? 'white' : 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-lg"
        onClick={handleStart}
        style={{ background: '#10B981', color: 'white', fontSize: 18 }}
      >
        开始呼吸
      </button>
    </div>
  );
}

export default BreathPage;
