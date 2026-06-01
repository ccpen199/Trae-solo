import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusStore } from '../store';

function FocusRunning() {
  const navigate = useNavigate();
  const { 
    isRunning, 
    isBreak, 
    timeLeft, 
    duration, 
    pause, 
    resume, 
    stop, 
    tick,
    startBreak
  } = useFocusStore();

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft <= 0 && isRunning) {
      if (!isBreak) {
        startBreak();
      } else {
        stop();
        navigate('/focus/complete', { replace: true });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak]);

  const handleEnd = () => {
    stop();
    navigate('/focus/complete', { replace: true });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="fullscreen-modal fade-in"
      style={{ 
        background: isBreak ? 'var(--success-color)' : 'var(--bg-dark)',
        color: 'white',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 40, opacity: 0.8 }}>
        {isBreak ? '休息时间' : '专注中'}
      </h2>

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
          stroke="white"
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

      <div style={{ position: 'absolute', bottom: 60, display: 'flex', gap: 24 }}>
        <button
          onClick={() => isRunning ? pause() : resume()}
          className="btn btn-circle"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
        <button
          onClick={handleEnd}
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

export default FocusRunning;
