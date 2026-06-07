import { useState } from 'react';
import axios from 'axios';

export default function Card() {
  const [personId, setPersonId] = useState(1);
  const [card, setCard] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/card/${personId}`);
      if (res.data.success) {
        setCard(res.data.data);
        setMessage('');
      } else {
        setCard(null);
        setMessage(res.data.message);
      }
    } catch (e) {
      setMessage('查询失败');
    }
    setLoading(false);
  };

  const applyCard = async () => {
    try {
      const res = await axios.post('/api/card/apply', { person_id: personId });
      if (res.data.success) {
        setCard(res.data.data);
        setMessage('电子社保卡申领成功！');
      } else {
        setMessage(res.data.message);
      }
    } catch (e) {
      setMessage('申领失败');
    }
  };

  const refreshQR = async () => {
    if (!card) return;
    try {
      const res = await axios.post(`/api/card/refresh-qr/${card.id}`);
      if (res.data.success) {
        setCard({ ...card, qr_code: res.data.qr_code });
      }
    } catch (e) {}
  };

  const reportLoss = async () => {
    if (!card) return;
    if (!confirm('确认挂失该电子社保卡？')) return;
    try {
      await axios.post(`/api/card/report-loss/${card.id}`);
      setCard(null);
      setMessage('挂失成功');
    } catch (e) {
      setMessage('挂失失败');
    }
  };

  return (
    <div>
      <div className="card">
        <h2>电子社保卡</h2>
        
        <div className="form-group">
          <label>参保人ID</label>
          <input 
            type="number" 
            value={personId} 
            onChange={e => setPersonId(parseInt(e.target.value) || 1)}
          />
          <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={loadCard}>
            查询社保卡
          </button>
        </div>

        {message && (
          <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {loading && <div className="loading">加载中...</div>}

        {card ? (
          <div>
            <div className="card-preview">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>中华人民共和国社会保障卡</span>
                <span>🇨🇳</span>
              </div>
              <div className="card-number">{card.card_no}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{card.name}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {card.id_card?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
                签发日期: {new Date(card.issue_date).toLocaleDateString()}<br />
                有效期至: {new Date(card.valid_until).toLocaleDateString()}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div className="qr-code">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>📱</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {card.qr_code?.substring(0, 16)}...
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                动态二维码，60秒自动刷新
              </p>
              <button className="btn btn-secondary" onClick={refreshQR}>
                刷新二维码
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary">扫码用卡</button>
              <button className="btn btn-secondary">就医结算</button>
              <button className="btn btn-danger" onClick={reportLoss}>挂失</button>
            </div>
          </div>
        ) : !loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
            <p>您还未申领电子社保卡</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={applyCard}>
              立即申领
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>电子社保卡功能</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ padding: '1rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem' }}>🏥</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>医保结算</div>
          </div>
          <div style={{ padding: '1rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem' }}>💊</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>药店购药</div>
          </div>
          <div style={{ padding: '1rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem' }}>🚇</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>公交出行</div>
          </div>
          <div style={{ padding: '1rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem' }}>🏦</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>金融服务</div>
          </div>
        </div>
      </div>
    </div>
  );
}
