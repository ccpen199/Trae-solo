import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Input } from 'antd';
import { useAuthStore } from '@/store/auth';
import { GD_CITIES } from '@platform/shared';

const services = [
  { key: 'visa-hk', name: '港澳签注', icon: '🛂', color: '#00B42A', path: '/apply/visa' },
  { key: 'visa-tw', name: '赴台签注', icon: '🗺️', color: '#165DFF', path: '/apply/visa' },
  { key: 'idcard', name: '身份证补换领', icon: '🪪', color: '#FF7D00', path: '/apply/idcard' },
  { key: 'violation', name: '违章查询缴费', icon: '🚗', color: '#F53F3F', path: '/vehicle/violation' },
  { key: 'inspection', name: '六年免检', icon: '✅', color: '#722ED1', path: '/vehicle/inspection' },
  { key: 'ems-track', name: 'EMS轨迹', icon: '📦', color: '#14C9C9', path: '/orders' },
  { key: 'receipt', name: '电子回执', icon: '📄', color: '#F7BA1E', path: '/orders' },
  { key: 'more', name: '更多服务', icon: '➕', color: '#86909C', path: '/' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>👋 您好，{user?.realNameMasked || '用户'}</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
              广东省政务便民服务
              {user?.city && <span style={{ fontSize: 12, marginLeft: 8, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>{user.city}</span>}
            </div>
          </div>
          <Badge count={3} size="small"><BellOutlined style={{ fontSize: 22 }} /></Badge>
        </div>
        <Input prefix={<SearchOutlined />} placeholder="搜索服务 / 订单号 / 车牌号" size="large" style={{ borderRadius: 24, background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ background: '#fff', padding: '8px 16px 4px' }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>服务城市</div>
        <div>{GD_CITIES.slice(0, 7).map(c => <span key={c} className="city-chip">{c}</span>)}
          <span className="city-chip" style={{ background: '#f5f5f5', color: '#666' }}>+14</span>
        </div>
      </div>

      <div className="service-grid">
        {services.map(s => (
          <div key={s.key} className="service-item" onClick={() => navigate(s.path)}>
            <div className="service-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="service-name">{s.name}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>🔔 办事公告</span>
          <span style={{ fontSize: 12, color: '#999' }} onClick={() => navigate('/orders')}>全部 →</span>
        </div>
        {[
          { t: '关于2024年春节期间签注办理时效调整通知', tag: '官方', time: '06-10' },
          { t: '广东新增5地市开通六年免检上门取件服务', tag: '新功能', time: '06-08' },
          { t: '电子回执已全面上线，可下载PDF保存', tag: '更新', time: '06-05' },
        ].map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
            <span style={{ background: '#F53F3F', color: '#fff', fontSize: 11, padding: '1px 6px', borderRadius: 4, marginRight: 8 }}>{n.tag}</span>
            <span style={{ flex: 1, fontSize: 14, color: '#333' }}>{n.t}</span>
            <span style={{ fontSize: 12, color: '#bbb' }}>{n.time}</span>
          </div>
        ))}
      </div>

      {!user?.realNameVerified && (
        <div style={{ margin: 16, padding: 16, background: 'linear-gradient(135deg, #FFF7E8 0%, #FFEECF 100%)', borderRadius: 12 }} onClick={() => navigate('/identity-verify')}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 32, marginRight: 12 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#B8860B' }}>请完成实名认证</div>
              <div style={{ fontSize: 12, color: '#996600', marginTop: 4 }}>实名+人脸核验通过后方可办理政务事项</div>
            </div>
            <div style={{ background: '#FF7D00', color: '#fff', padding: '6px 14px', borderRadius: 16, fontSize: 13 }}>立即办理</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
