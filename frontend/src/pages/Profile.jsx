import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    try {
      if (activeTab === 'orders') {
        const res = await userAPI.getOrders();
        setOrders(res.data || []);
      } else if (activeTab === 'favorites') {
        const res = await userAPI.getFavorites('guide');
        setFavorites(res.data || []);
      }
    } catch (err) {
      console.error('加载失败', err);
    }
  };

  const menuItems = [
    { key: 'orders', icon: '📋', name: '我的订单' },
    { key: 'favorites', icon: '❤️', name: '我的收藏' },
    { key: 'follows', icon: '👤', name: '我的关注' },
    { key: 'messages', icon: '💬', name: '消息中心' },
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-info">
              <div className="profile-avatar">
                {user?.nickname?.charAt(0) || user?.username?.charAt(0) || '?'}
              </div>
              <div className="profile-name">{user?.nickname || user?.username}</div>
            </div>
            <div className="profile-menu">
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-content">
            <h2 className="content-title">
              {menuItems.find(m => m.key === activeTab)?.name}
            </h2>

            {activeTab === 'orders' && (
              <div className="order-list">
                {orders.length > 0 ? orders.map((order) => (
                  <div key={order.id} className="order-item">
                    <img src={`https://picsum.photos/200/150?random=${order.id + 300}`} alt="" />
                    <div className="order-info">
                      <div className="order-title">{order.hotel_name || '酒店订单'}</div>
                      <div className="order-meta">
                        订单号: {order.order_no} · 入住: {order.checkin_date} · ¥{order.total_amount}
                      </div>
                      <div style={{ marginTop: '8px', color: '#ff7b00', fontWeight: 500 }}>
                        {order.status === 'pending' ? '待确认' : '已确认'}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                    暂无订单，快去预订酒店吧~
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="favorite-list">
                {favorites.length > 0 ? favorites.map((fav) => (
                  <div key={fav.id} className="favorite-item" onClick={() => navigate(`/guides/${fav.target_id}`)}>
                    <img src={`https://picsum.photos/200/150?random=${fav.id + 400}`} alt="" />
                    <div className="favorite-info">
                      <div className="favorite-title">{fav.title || '收藏的攻略'}</div>
                      <div className="favorite-meta">
                        收藏于 {fav.created_at?.split('T')[0]}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                    暂无收藏，快去收藏喜欢的攻略吧~
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'follows' || activeTab === 'messages') && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                功能开发中...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
