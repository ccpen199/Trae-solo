import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/drivers/profile');
      setProfile(res.data.driver);
      setOnline(res.data.driver.online === 1);
    } catch (err) {
      console.error('获取信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async () => {
    try {
      await api.post('/drivers/location', {
        lat: 39.9042,
        lng: 116.4074,
        online: online ? 0 : 1
      });
      setOnline(!online);
      alert(online ? '已下线' : '已上线');
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  if (profile?.status !== 'approved') {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: '500px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h2>资质审核中</h2>
          <p style={{ color: '#666', margin: '16px 0 24px' }}>
            您的司机资质正在审核中，请耐心等待。审核通过后即可接单。
          </p>
          <p style={{ color: '#999', fontSize: '14px' }}>
            当前状态：{profile?.status === 'rejected' ? '已驳回' : '审核中'}
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: '服务评分', value: profile?.service_score || '5.0', unit: '分', icon: '⭐' },
    { label: '完成订单', value: profile?.order_count || 0, unit: '单', icon: '📦' },
    { label: '今日收入', value: 0, unit: '元', icon: '💰' },
    { label: '在线时长', value: 0, unit: '小时', icon: '⏱️' }
  ];

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1677ff, #0958d9)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {profile?.name?.[0] || '司'}
            </div>
            <div>
              <h2>{profile?.name}</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {profile?.vehicle_type} · {profile?.vehicle_number}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '8px' }}>
              {online ? (
                <span style={{ color: '#52c41a' }}>● 在线</span>
              ) : (
                <span style={{ color: '#999' }}>○ 离线</span>
              )}
            </div>
            <button 
              className={`btn ${online ? 'btn-outline' : 'btn-primary'}`}
              onClick={toggleOnline}
            >
              {online ? '下线休息' : '开始接单'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1677ff' }}>
              {s.value}{s.unit}
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>快速操作</h3>
          </div>
          <div className="grid grid-2" style={{ gap: '12px' }}>
            <Link to="/orders" className="card" style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
              <div>订单大厅</div>
            </Link>
            <div className="card" style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5', cursor: 'pointer' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div>收入统计</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5', cursor: 'pointer' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <div>我的评价</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5', cursor: 'pointer' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚙️</div>
              <div>账号设置</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>最近评价</h3>
          </div>
          {profile?.recent_reviews?.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {profile.recent_reviews.map((r, i) => (
                <div key={i} style={{ padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{r.order_no}</span>
                    <span>{'⭐'.repeat(r.score)}</span>
                  </div>
                  {r.content && <p style={{ fontSize: '14px', color: '#666' }}>{r.content}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无评价
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
