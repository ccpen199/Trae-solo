import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepStore } from '../store';
import { sleepAPI } from '../services/api';

const sleepDurations = [15, 30, 45, 60, 90];
const napDurations = [5, 10, 15, 20, 30];

function SleepPage() {
  const navigate = useNavigate();
  const { start } = useSleepStore();
  const [mode, setMode] = useState('sleep');
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [selectedSound, setSelectedSound] = useState('rain');
  const [sounds, setSounds] = useState([]);

  useEffect(() => {
    fetchSounds();
  }, []);

  useEffect(() => {
    const { isRunning, stop } = useSleepStore.getState();
    if (isRunning) {
      stop();
    }
  }, []);

  const fetchSounds = async () => {
    try {
      const response = await sleepAPI.getSounds();
      setSounds(response.data.sounds);
    } catch (error) {
      console.error('获取声音失败:', error);
      setSounds([
        { id: 'rain', name: '雨声', category: 'nature' },
        { id: 'ocean', name: '海洋', category: 'nature' },
        { id: 'forest', name: '森林', category: 'nature' }
      ]);
    }
  };

  const durations = mode === 'sleep' ? sleepDurations : napDurations;

  const handleStart = async () => {
    try {
      await sleepAPI.start({
        type: mode,
        duration: selectedDuration,
        sound: selectedSound
      });
      start(mode, selectedDuration, selectedSound);
      navigate('/sleep/running', { replace: true });
    } catch (error) {
      console.error('开始睡眠失败:', error);
      start(mode, selectedDuration, selectedSound);
      navigate('/sleep/running', { replace: true });
    }
  };

  return (
    <div className="page-container fade-in">
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32 }}>
        {mode === 'sleep' ? '睡眠' : '小憩'}
      </h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setMode('sleep')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: mode === 'sleep' ? 'var(--primary-color)' : 'var(--bg-secondary)',
              color: mode === 'sleep' ? 'white' : 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            🌙 睡眠
          </button>
          <button
            onClick={() => setMode('nap')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: mode === 'nap' ? 'var(--primary-color)' : 'var(--bg-secondary)',
              color: mode === 'nap' ? 'white' : 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            💤 小憩
          </button>
        </div>
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
                background: selectedDuration === d ? 'var(--primary-color)' : 'var(--bg-secondary)',
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
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>白噪音</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {sounds.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSound(s.id)}
              style={{
                padding: '16px 12px',
                borderRadius: 12,
                background: selectedSound === s.id ? 'var(--primary-color)' : 'var(--bg-secondary)',
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
        className="btn btn-primary btn-lg"
        onClick={handleStart}
        style={{ fontSize: 18 }}
      >
        开始{mode === 'sleep' ? '睡眠' : '小憩'}
      </button>
    </div>
  );
}

export default SleepPage;
