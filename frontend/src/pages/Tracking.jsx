import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Tracking() {
  const navigate = useNavigate();
  const [orderNo, setOrderNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuery = async () => {
    if (!orderNo.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/tracking/query?order_no=${orderNo}`);
      setResult(res.data);
    } catch (err) {
      alert('查询失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const openDemoOrders = () => {
    localStorage.setItem('token', 'local-demo-shipper');
    localStorage.setItem('userType', 'shipper');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: '演示货主',
      phone: '13900139001'
    }));
    navigate('/orders');
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '700px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>📍 物流轨迹查询</h2>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="text"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="请输入订单号"
            style={{ flex: 1, padding: '12px', fontSize: '16px' }}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 28px' }}
            onClick={handleQuery}
            disabled={loading}
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>

        {result && (
          <div className="card" style={{ background: '#f5f5f5', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>查询结果</h4>
            {result.traces && result.traces.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {result.traces.map((trace, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    padding: '12px 0', 
                    borderBottom: i < result.traces.length - 1 ? '1px solid #e0e0e0' : 'none',
                    position: 'relative',
                    paddingLeft: '28px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '16px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: i === 0 ? '#52c41a' : '#d9d9d9'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: i === 0 ? '#333' : '#666' }}>{trace.desc}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{trace.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                暂无轨迹信息
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#666', marginBottom: '12px' }}>登录后可查看所有订单的实时轨迹</p>
          <button 
            className="btn btn-outline"
            onClick={openDemoOrders}
          >
            登录查看我的订单
          </button>
        </div>
      </div>
    </div>
  );
}
