import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreathStore } from '../store';

function BreathRunning() {
  const navigate = useNavigate();
  const { isRunning, duration, sound, stop, start } = useBreathStore();
  const [phaseTime, setPhaseTime] = useState(4);
  const [phase, setPhase] = useState('inhale');
  const [breaths, setBreaths] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(duration * 60);

  useEffect(() => {
    let interval;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => prev - 1);
        setPhaseTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setPhase((currentPhase) => {
              if (currentPhase === 'inhale') return 'hold';
              if (currentPhase === 'hold') return 'exhale';
              setBreaths((b) => b + 1);
              return 'inhale';
            });
            return 4;
          }
          return newTime;
        });
      }, 1000);
    } else if (totalSeconds <= 0 && isRunning) {
      stop();
      useBreathStore.getState().breaths = breaths;
      navigate('/breath/complete', { replace: true });
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const phaseNames = {
    inhale: '吸气',
    hold: '屏息',
    exhale: '呼气'
  };

  const phaseColors = {
    inhale: '#10B981',
    hold: '#3B82F6',
    exhale: '#8B5CF6'
  };

  const scale = phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.2 : 1;

  return (
    <div 
      className="fullscreen-modal fade-in"
      style={{ 
        background: phaseColors[phase],
        color: 'white',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 40, opacity: 0.9 }}>
        {phaseNames[phase]}
      </h2>

      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          transition: 'transform 1s ease-in-out',
          marginBottom: 40
        }}
      >
        <span style={{ fontSize: 64 }}>🌬️</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
          {breaths}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          呼吸次数
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 60 }}>
        <button
          onClick={() => {
            stop();
            useBreathStore.getState().breaths = breaths;
            navigate('/breath/complete', { replace: true });
          }}
          style={{ 
            width: 100, 
            height: 100, 
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', 
            color: 'white',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          结束
        </button>
      </div>
    </div>
  );
}

export default BreathRunning;
