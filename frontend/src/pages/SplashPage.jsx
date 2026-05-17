import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

function SplashPage() {
  const navigate = useNavigate();
  const { user, isFirstVisit, setFirstVisit } = useAuthStore();
  const [countdown, setCountdown] = useState(3);
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await fetch('/api/health', { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setCheckingNetwork(false);
      } catch (error) {
        setCheckingNetwork(false);
        setNetworkError(true);
      }
    };

    checkNetwork();
  }, []);

  useEffect(() => {
    if (checkingNetwork || networkError) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkingNetwork, networkError]);

  useEffect(() => {
    if (countdown <= 0 && !checkingNetwork && !networkError) {
      if (isFirstVisit) {
        setFirstVisit(false);
        navigate('/guide');
      } else if (user) {
        navigate('/home');
      } else {
        navigate('/login');
      }
    }
  }, [countdown, checkingNetwork, networkError, isFirstVisit, user, navigate, setFirstVisit]);

  if (networkError) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.icon}>📡</div>
          <h1 style={styles.title}>网络连接失败</h1>
          <p style={styles.description}>请检查您的网络设置后重试</p>
          <button style={styles.button} onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logo}>🧘</div>
        <h1 style={styles.title}>NowHere</h1>
        <p style={styles.subtitle}>此刻，冥想</p>
        {checkingNetwork ? (
          <p style={styles.loading}>正在检查网络...</p>
        ) : (
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${((3 - countdown) / 3) * 100}%` }} />
          </div>
        )}
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  content: {
    textAlign: 'center',
    color: 'white'
  },
  logo: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '2px'
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.9,
    marginBottom: '40px'
  },
  description: {
    fontSize: '16px',
    opacity: 0.8,
    marginBottom: '30px'
  },
  loading: {
    fontSize: '14px',
    opacity: 0.8
  },
  progressBar: {
    width: '200px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    overflow: 'hidden',
    margin: '0 auto'
  },
  progressFill: {
    height: '100%',
    background: 'white',
    transition: 'width 1s ease'
  },
  button: {
    padding: '12px 40px',
    fontSize: '16px',
    borderRadius: '25px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontWeight: 600
  }
};

export default SplashPage;
