import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';

const Splash = () => {
  const navigate = useNavigate();
  const token = useStore(state => state.token);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, token]);

  return (
    <div style={styles.container}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🛒</span>
      </div>
      <h1 style={styles.title}>ME 淘</h1>
      <p style={styles.subtitle}>秒杀提醒 · 物流追踪</p>
      <div style={styles.loading}>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)'
  },
  logo: {
    width: '100px',
    height: '100px',
    borderRadius: '24px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  logoIcon: {
    fontSize: '56px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.85)'
  },
  loading: {
    display: 'flex',
    marginTop: '48px',
    gap: '8px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    animation: 'bounce 1.4s infinite ease-in-out both'
  }
};

export default Splash;
