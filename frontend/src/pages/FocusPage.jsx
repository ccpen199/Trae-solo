import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusStore } from '../store';
import { focusAPI } from '../services/api';

const durations = [5, 15, 25, 45, 60];
const modes = [
  { id: 'normal', name: '普通模式', desc: '基础番茄工作法' },
  { id: 'deep', name: '高效模式', desc: '更长的专注时间' }
];

function FocusPage() {
  const navigate = useNavigate();
  const { settings, start } = useFocusStore();
  const [selectedDuration, setSelectedDuration] = useState(settings.focusDuration);
  const [selectedMode, setSelectedMode] = useState('normal');

  const handleStart = async () => {
    try {
      await focusAPI.start({
        duration: selectedDuration,
        mode: selectedMode
      });
      start(selectedDuration, selectedMode);
      navigate('/focus/running', { replace: true });
    } catch (error) {
      console.error('开始专注失败:', error);
      start(selectedDuration, selectedMode);
      navigate('/focus/running', { replace: true });
    }
  };

  return (
    <div className="page-container fade-in">
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32 }}>专注</h1>

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
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>模式</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              style={{
                padding: 16,
                borderRadius: 12,
                background: selectedMode === mode.id ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: selectedMode === mode.id ? 'white' : 'var(--text-primary)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{mode.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary btn-lg"
        onClick={handleStart}
        style={{ fontSize: 18 }}
      >
        开始专注
      </button>
    </div>
  );
}

export default FocusPage;
