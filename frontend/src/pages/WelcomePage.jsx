import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/ad');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
      color: 'white',
      zIndex: 9999
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <span style={{ fontSize: '60px' }}>🛍️</span>
      </div>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '4px' }}>网易严选</h1>
      <p style={{ fontSize: '20px', opacity: 0.9 }}>好的生活，没那么贵</p>
      <div style={{
        position: 'absolute',
        bottom: '50px',
        display: 'flex',
        gap: '8px'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
      </div>
    </div>
  );
}

export default WelcomePage;
