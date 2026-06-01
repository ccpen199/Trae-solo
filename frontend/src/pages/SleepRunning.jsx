import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepStore } from '../store';

function SleepRunning() {
  const navigate = useNavigate();
  const { isRunning, timeLeft, duration, type, sound, stop, tick } = useSleepStore();

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft <= 0 && isRunning) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleComplete = () => {
    stop();
    navigate('/sleep/complete', { replace: true });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const soundNames = {
    rain: '雨声',
    ocean: '海浪',
    forest: '森林',
    thunder: '雷声',
    wind: '风声',
    fire: '篝火',
    meditation: '冥想',
    piano: '钢琴'
  };

  return (
    <div 
      className="fullscreen-modal fade-in"
      style={{ 
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12, opacity: 0.8 }}>
        {type === 'sleep' ? '睡眠中' : '小憩中'}
      </h2>

      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 40 }}>
        正在播放: {soundNames[sound] || sound}
      </p>

      <svg width="260" height="260" className="progress-ring">
        <circle
          cx="130"
          cy="130"
          r="120"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <circle
          className="progress-ring-circle"
          cx="130"
          cy="130"
          r="120"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      <div 
        className="timer-display" 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          marginTop: 20
        }}
      >
        {formatTime(timeLeft)}
      </div>

      <div style={{ position: 'absolute', bottom: 60 }}>
        <button
          onClick={handleComplete}
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

export default SleepRunning;
