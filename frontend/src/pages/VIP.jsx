import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const plans = [
  { id: 'monthly', name: '月卡', price: 18, originalPrice: 25, duration: '30天', popular: false },
  { id: 'quarterly', name: '季卡', price: 45, originalPrice: 75, duration: '90天', popular: true },
  { id: 'yearly', name: '年卡', price: 168, originalPrice: 300, duration: '365天', popular: false, extra: '赠送误删找回' }
];

const benefits = [
  { icon: '💾', title: '10GB 超大空间', desc: '普通用户仅 500MB' },
  { icon: '📜', title: '历史版本恢复', desc: '无限次查看和恢复' },
  { icon: '🧠', title: '思维导图样式', desc: '更多精美样式模板' },
  { icon: '🔐', title: '加密分享链接', desc: '支持密码和有效期设置' },
  { icon: '🔍', title: 'OCR 图片搜索', desc: '识别图片中的文字' },
  { icon: '💎', title: '专属客服支持', desc: '优先处理您的问题' }
];

export default function VIP() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const orderRes = await api.post('/vip/order', { planId: selectedPlan });
      await api.post(`/vip/pay/${orderRes.data.orderId}`);
      showToast('开通成功！感谢您的支持', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isVip = user?.vip_type > 0 && (!user?.vip_expire_at || user?.vip_expire_at > Date.now());

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
        padding: '40px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>👑</div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>有道云笔记会员</h1>
        <p style={{ opacity: 0.9, fontSize: '14px' }}>解锁全部高级功能</p>
        {isVip && (
          <div style={{ marginTop: '16px', padding: '8px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'inline-block' }}>
            ✨ 您已是尊贵的会员用户
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>会员权益</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {benefits.map((item, idx) => (
            <div key={idx} style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>选择套餐</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: `2px solid ${selectedPlan === plan.id ? '#1890ff' : '#e8e8e8'}`,
                borderRadius: '8px',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ff4d4f',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '8px'
                }}>
                  推荐
                </div>
              )}
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>{plan.name}</div>
              <div style={{ color: '#ff4d4f', fontWeight: '600' }}>
                <span style={{ fontSize: '12px' }}>¥</span>
                <span style={{ fontSize: '20px' }}>{plan.price}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>¥{plan.originalPrice}</div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{plan.duration}</div>
              {plan.extra && (
                <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '4px' }}>{plan.extra}</div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '处理中...' : isVip ? '续费会员' : '立即开通'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '12px' }}>
          开通即表示同意《会员服务协议》
        </p>
      </div>
    </div>
  );
}
