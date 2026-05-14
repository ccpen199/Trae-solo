
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRide, getRides } from '../api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [city, setCity] = useState('');
  const [serviceType, setServiceType] = useState('fast');
  const [networkOffline, setNetworkOffline] = useState(!navigator.onLine);
  const [locationGranted, setLocationGranted] = useState(false);
  const [gpsOpened, setGpsOpened] = useState(false);
  const [toast, setToast] = useState('');
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setNetworkOffline(false);
    const handleOffline = () => setNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    checkLocation();
    if (user) {
      getRides(user.userId).then(res => setRides(res.rides || []));
    }
  }, [user]);

  const checkLocation = () => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          setLocationGranted(true);
          getLocation();
        } else if (result.state === 'denied') {
          showToast('需要定位权限才能提供服务');
        }
      });
    }
  };

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsOpened(true);
          setStartLocation('当前位置');
        },
        () => {
          showToast('获取定位失败');
        }
      );
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRequestRide = async () => {
    if (!user) return;

    if (networkOffline) {
      showToast('当前网络异常');
      return;
    }

    if (!startLocation || !endLocation) {
      showToast('请填写起点和终点');
      return;
    }

    const res = await createRide({
      userId: user.userId,
      startLocation,
      endLocation,
      city: city || '北京',
      serviceType
    });

    if (res.success) {
      showToast('约车成功');
      navigate('/ride');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.cityBtn} onClick={() => navigate('/profile')}>
          <span style={styles.icon}>👤</span>
        </button>
        <span style={styles.headerTitle}>{city || '北京'}</span>
        <button style={styles.msgBtn} onClick={() => navigate('/messages')}>
          <span style={styles.icon}>💬</span>
        </button>
      </div>

      <div style={styles.mapArea}>
        <div style={styles.mapPlaceholder}>
        </div>
      </div>

      <div style={styles.formArea}>
        <div style={styles.inputRow}>
          <div style={styles.dot}></div>
          <input
            style={styles.input}
            placeholder="请输入上车地点"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            onClick={() => {
              if (!user) navigate('/login');
              if (networkOffline && !city) showToast('请先选择城市');
            }}
          />
        </div>
        <div style={styles.inputRow}>
          <div style={styles.dotOrange}></div>
          <input
            style={styles.input}
            placeholder="请输入目的地"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            onClick={() => {
              if (!user) navigate('/login');
              if (networkOffline) showToast('当前网络异常');
            }}
          />
        </div>

        <div style={styles.serviceTypes}>
          <button
            style={{ ...styles.serviceBtn, ...(serviceType === 'fast' ? styles.serviceBtnActive : {}) }}
            onClick={() => setServiceType('fast')}
          >
            快车
          </button>
          <button
            style={{ ...styles.serviceBtn, ...(serviceType === 'premium' ? styles.serviceBtnActive : {}) }}
            onClick={() => setServiceType('premium')}
          >
            专车
          </button>
          <button
            style={{ ...styles.serviceBtn, ...(serviceType === 'taxi' ? styles.serviceBtnActive : {}) }}
            onClick={() => setServiceType('taxi')}
          >
            出租车
          </button>
        </div>

        <button style={styles.requestBtn} onClick={handleRequestRide}>
          立即叫车
        </button>

        {rides.length > 0 && (
          <div style={styles.history}>
            <h3 style={styles.historyTitle}>历史订单</h3>
            {rides.slice(0, 3).map((ride) => (
              <div key={ride.id} style={styles.rideItem}>
                <div>{ride.startLocation || ride.start_location} → {ride.endLocation || ride.end_location}</div>
                <div style={styles.rideTime}>{new Date(ride.createdAt || ride.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cityBtn: {
    background: 'none',
    fontSize: '24px'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const
  },
  msgBtn: {
    background: 'none',
    fontSize: '24px'
  },
  icon: {
    fontSize: '24px'
  },
  mapArea: {
    flex: 1,
    background: '#e8e8e8',
    minHeight: '200px'
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: '200px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  formArea: {
    padding: '20px',
    background: '#fff'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px'
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#333',
    flexShrink: 0
  },
  dotOrange: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#ff6600',
    flexShrink: 0
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px'
  },
  serviceTypes: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  serviceBtn: {
    flex: 1,
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px'
  },
  serviceBtnActive: {
    background: '#fff3e6',
    color: '#ff6600',
    border: '1px solid #ff6600'
  },
  requestBtn: {
    width: '100%',
    padding: '16px',
    background: '#ff6600',
    color: '#fff',
    fontSize: '18px',
    borderRadius: '8px',
    fontWeight: 'bold' as const
  },
  history: {
    marginTop: '24px'
  },
  historyTitle: {
    fontSize: '16px',
    marginBottom: '12px',
    color: '#333'
  },
  rideItem: {
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
    color: '#666'
  },
  rideTime: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  toast: {
    position: 'fixed' as const,
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px'
  }
};
