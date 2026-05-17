import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Bell, RefreshCw } from 'lucide-react';
import api from '../utils/api';

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveRooms, setLiveRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [banners, setBanners] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setError('');
      const response = await api.get('/live');
      if (response?.data?.success) {
        const data = response.data.data;
        setBanners(data.banners || []);
        setChannels(data.channels || []);
        const rooms = data.rooms || [];
        setLiveRooms(rooms);
        setFilteredRooms(rooms);
      } else {
        setError('数据加载失败，请重试');
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载失败，点击重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      if (channels.length > 0) {
        const channelName = channels[activeChannel]?.name || '推荐';
        if (channelName !== '推荐') {
          setFilteredRooms(liveRooms.filter(room => (room?.category || '') === channelName));
        } else {
          setFilteredRooms(liveRooms);
        }
      }
    } catch (err) {
      console.error('筛选频道失败:', err);
    }
  }, [activeChannel, channels, liveRooms]);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchData();
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/?search=${encodeURIComponent(searchKeyword)}`);
      fetchData();
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <RefreshCw size={32} color="#ff4757" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#666', marginTop: '10px' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>
      <header style={{
        background: 'white',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#333' }}>
            <MapPin size={16} />
            <span style={{ fontSize: '14px' }}>北京</span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4757', margin: 0 }}>映客</h1>
          <Bell size={20} color="#666" />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f5f5f5',
          borderRadius: '20px',
          padding: '8px 16px',
          marginTop: '10px'
        }}>
          <Search size={16} color="#999" />
          <input
            type="text"
            placeholder="搜索直播间或主播"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              marginLeft: '8px',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </header>

      {error && (
        <div onClick={handleRefresh} style={{
          padding: '16px',
          textAlign: 'center',
          color: '#ff4757',
          background: '#fff5f5',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>{error}</span>
          <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {banners.length > 0 && banners[0]?.image && (
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            height: '120px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <img
              src={banners[0].image}
              alt="banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {channels.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {channels.map((channel, index) => (
              <button
                key={channel.id || index}
                onClick={() => setActiveChannel(index)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  background: activeChannel === index ? '#ff4757' : '#f0f0f0',
                  color: activeChannel === index ? 'white' : '#666',
                  cursor: 'pointer',
                  fontWeight: activeChannel === index ? 600 : 400
                }}
              >
                {channel.name || '推荐'}
              </button>
            ))}
          </div>
        )}

        {filteredRooms.length === 0 && !error ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999'
          }}>
            <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ margin: '0 0 8px' }}>暂无直播</p>
            <Link to="/create-live">
              <button style={{
                marginTop: '12px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}>
                开启直播
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {filteredRooms.map((room) => (
              <Link
                key={room?.id || Math.random()}
                to={`/live-room/${room?.id || 1}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    position: 'relative',
                    height: '120px',
                    background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Users size={12} />
                      {room?.viewers || 0}
                    </div>
                    {room?.category && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255,71,87,0.9)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {room.category}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: '0 0 8px 0'
                    }}>
                      {room?.title || '精彩直播'}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff4757, #ff6b81)'
                      }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {room?.nickname || '主播'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
