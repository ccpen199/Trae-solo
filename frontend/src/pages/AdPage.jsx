import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const res = await api.get('/ads');
      setAds(res.data);
    } catch (e) {
      setAds([
        {
          id: 1,
          title: '好的生活，没那么贵',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
          content: '精选全球好物，品质生活从这里开始',
          duration: 3
        }
      ]);
    }
  };

  useEffect(() => {
    if (ads.length > 0) {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            navigate('/home');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [ads, navigate]);

  const skip = () => {
    navigate('/home');
  };

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'relative',
        flex: 1,
        backgroundImage: `url(${currentAd.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '20px',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          cursor: 'pointer',
          zIndex: 100
        }} onClick={skip}>
          跳过 {countdown}s
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '60px 30px 40px',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '12px', fontWeight: 'bold' }}>{currentAd.title}</h2>
          <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '30px' }}>{currentAd.content}</p>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{
              flex: 1,
              background: '#ff6b35',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '25px',
              fontSize: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: '500'
            }} onClick={() => navigate(`/ad/${currentAd.id}`)}>
              查看详情
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '25px',
              fontSize: '16px',
              textAlign: 'center',
              cursor: 'pointer'
            }} onClick={skip}>
              进入首页
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '180px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {ads.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === currentIndex ? '#ff6b35' : 'rgba(255,255,255,0.5)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdPage;
