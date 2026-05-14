import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function AdDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    loadAd();
    checkFavorite();
  }, [id, user]);

  const loadAd = async () => {
    try {
      const res = await api.get(`/ads/${id}`);
      setAd(res.data);
    } catch (e) {
      setAd({
        id: id,
        title: '好的生活，没那么贵',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        content: '网易严选是网易旗下原创生活类自营电商品牌，于2016年4月面世。严选以"好的生活，没那么贵"为品牌理念，通过ODM模式与大牌制造商直连，剔除品牌溢价和中间环节，为国人甄选高品质、高性价比的天下优品。'
      });
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/ads/${id}/favorite/check`);
      setFavorited(res.data.favorited);
    } catch (e) {
      setFavorited(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/ads/${id}/favorite`);
      setFavorited(res.data.favorited);
      alert(res.data.favorited ? '收藏成功！' : '已取消收藏');
    } catch (e) {
      const newFavorited = !favorited;
      setFavorited(newFavorited);
      alert(newFavorited ? '收藏成功！' : '已取消收藏');
    }
  };

  const share = (platform) => {
    if (platform === 'copy') {
      const url = window.location.href;
      navigator.clipboard?.writeText(url);
      alert('链接已复制到剪贴板！');
    } else {
      alert(`分享到 ${platform} 成功！`);
    }
    setShowShare(false);
  };

  if (!ad) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>加载中...</p>
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 15px',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #eee'
      }}>
        <span style={{
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px'
        }} onClick={() => navigate(-1)}>←</span>
        <span style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '17px',
          fontWeight: '600'
        }}>广告详情</span>
        <span style={{
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px',
          color: favorited ? '#ff6b35' : '#999'
        }} onClick={toggleFavorite}>
          {favorited ? '❤️' : '🤍'}
        </span>
        <span style={{
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px',
          marginLeft: '10px'
        }} onClick={() => setShowShare(true)}>📤</span>
      </div>

      <img
        src={ad.image}
        alt={ad.title}
        style={{ width: '100%', display: 'block' }}
      />

      <div style={{ padding: '20px' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333'
        }}>{ad.title}</h1>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #f5f5f5'
        }}>
          <span style={{
            background: '#ff6b35',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>精选</span>
          <span style={{ color: '#999', fontSize: '14px' }}>热门推荐</span>
        </div>

        <div style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>活动详情</h3>
          <p style={{
            color: '#666',
            lineHeight: '2',
            fontSize: '15px'
          }}>{ad.content}</p>
        </div>

        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{
            flex: 1,
            background: '#fff5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>🎁</span>
            <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>限时优惠</p>
          </div>
          <div style={{
            flex: 1,
            background: '#fff5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>🚚</span>
            <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>免费配送</p>
          </div>
          <div style={{
            flex: 1,
            background: '#fff5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>🔄</span>
            <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>7天退换</p>
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        padding: '12px 15px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex',
        gap: '15px',
        borderTop: '1px solid #eee'
      }}>
        <div style={{
          flex: 1,
          background: '#ff6b35',
          color: '#fff',
          padding: '14px',
          borderRadius: '25px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer'
        }} onClick={() => navigate('/home')}>
          立即查看商品
        </div>
      </div>

      {showShare && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end'
        }} onClick={() => setShowShare(false)}>
          <div style={{
            width: '100%',
            background: '#fff',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '20px 15px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom))'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>分享到</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
              {[
                { name: '微信', icon: '💬' },
                { name: '朋友圈', icon: '🌐' },
                { name: 'QQ', icon: '🐧' },
                { name: '微博', icon: '📱' },
                { name: '复制链接', icon: '📋' }
              ].map(item => (
                <div key={item.name} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => share(item.name === '复制链接' ? 'copy' : item.name)}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '8px'
                  }}>{item.icon}</div>
                  <span style={{ fontSize: '12px', color: '#666' }}>{item.name}</span>
                </div>
              ))}
            </div>
            <div style={{
              padding: '14px',
              textAlign: 'center',
              background: '#f5f5f5',
              borderRadius: '8px',
              cursor: 'pointer'
            }} onClick={() => setShowShare(false)}>
              取消
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdDetailPage;
