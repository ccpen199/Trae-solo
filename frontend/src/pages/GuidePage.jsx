import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

function GuidePage() {
  const navigate = useNavigate();
  const { setFirstVisit } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '🧘',
      title: '欢迎来到 NowHere',
      description: '开启您的冥想之旅，探索内心的平静与力量'
    },
    {
      icon: '📅',
      title: '定制您的计划',
      description: '选择适合您的冥想课程，建立每日练习习惯'
    },
    {
      icon: '📊',
      title: '追踪每一步',
      description: '记录您的练习进度，见证成长的每一刻'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setFirstVisit(false);
      navigate('/login');
    }
  };

  const handleSkip = () => {
    setFirstVisit(false);
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>{steps[currentStep].icon}</div>
        <h1 style={styles.title}>{steps[currentStep].title}</h1>
        <p style={styles.description}>{steps[currentStep].description}</p>
        
        <div style={styles.dots}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                ...styles.dot,
                ...(index === currentStep ? styles.dotActive : {})
              }}
            />
          ))}
        </div>
        
        <div style={styles.buttons}>
          <button style={styles.skipButton} onClick={handleSkip}>
            跳过
          </button>
          <button style={styles.nextButton} onClick={handleNext}>
            {currentStep === steps.length - 1 ? '开始' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  content: {
    textAlign: 'center',
    color: 'white',
    maxWidth: '400px',
    width: '100%'
  },
  icon: {
    fontSize: '100px',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '16px'
  },
  description: {
    fontSize: '16px',
    opacity: 0.9,
    lineHeight: 1.6,
    marginBottom: '40px'
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '40px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.4)',
    transition: 'all 0.3s ease'
  },
  dotActive: {
    width: '24px',
    borderRadius: '4px',
    background: 'white'
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  skipButton: {
    padding: '14px 32px',
    fontSize: '16px',
    borderRadius: '25px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 500
  },
  nextButton: {
    padding: '14px 32px',
    fontSize: '16px',
    borderRadius: '25px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontWeight: 600
  }
};

export default GuidePage;
