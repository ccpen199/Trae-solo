import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Payment() {
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [personId, setPersonId] = useState(1);
  const [orderInfo, setOrderInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pay');

  useEffect(() => {
    axios.get('/api/payment/insurance-types')
      .then(res => {
        if (res.data.success) {
          setInsuranceTypes(res.data.data);
        }
      })
      .catch(() => {});
    loadOrders();
  }, []);

  const loadOrders = () => {
    axios.get(`/api/payment/orders/${personId}`)
      .then(res => {
        if (res.data.success) {
          setOrders(res.data.data);
        }
      })
      .catch(() => {});
  };

  const createOrder = async () => {
    if (!selectedType || !selectedGrade) {
      setMessage('请选择险种和缴费档位');
      return;
    }
    const type = insuranceTypes.find(t => t.code === selectedType);
    const grade = type.grades.find(g => g.code === selectedGrade);

    try {
      const res = await axios.post('/api/payment/create', {
        person_id: personId,
        insurance_type: selectedType,
        year_grade: selectedGrade,
        amount: grade.amount
      });
      if (res.data.success) {
        setOrderInfo(res.data);
        setMessage('');
      }
    } catch (e) {
      setMessage('订单创建失败');
    }
  };

  const payOrder = async () => {
    if (!orderInfo) return;
    try {
      const res = await axios.post('/api/payment/pay', {
        order_no: orderInfo.order_no,
        payment_method: 'wechat'
      });
      if (res.data.success) {
        setMessage('支付成功！');
        setOrderInfo(null);
        setSelectedType('');
        setSelectedGrade('');
        loadOrders();
      }
    } catch (e) {
      setMessage('支付失败');
    }
  };

  return (
    <div>
      <div className="card">
        <h2>社保缴费服务</h2>
        
        <div className="tabs">
          <div className={`tab ${activeTab === 'pay' ? 'active' : ''}`} onClick={() => setActiveTab('pay')}>
            在线缴费
          </div>
          <div className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            缴费记录
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {activeTab === 'pay' && (
          <div>
            <div className="form-group">
              <label>险种类型</label>
              <select value={selectedType} onChange={e => {
                setSelectedType(e.target.value);
                setSelectedGrade('');
                setOrderInfo(null);
              }}>
                <option value="">请选择险种</option>
                {insuranceTypes.map(t => (
                  <option key={t.code} value={t.code}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="form-group">
                <label>缴费档位</label>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  {insuranceTypes.find(t => t.code === selectedType)?.grades.map(g => (
                    <div
                      key={g.code}
                      style={{
                        padding: '1rem',
                        border: selectedGrade === g.code ? '2px solid #1e3c72' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: selectedGrade === g.code ? '#f0f7ff' : 'white'
                      }}
                      onClick={() => setSelectedGrade(g.code)}
                    >
                      <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                      <div style={{ fontSize: '1.5rem', color: '#1e3c72', margin: '0.5rem 0' }}>¥{g.amount}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>政府补贴 ¥{Math.round(g.amount * 0.3)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderInfo && (
              <div className="card" style={{ background: '#f8f9fa' }}>
                <h3>订单信息</h3>
                <p>订单号: {orderInfo.order_no}</p>
                <p>应缴金额: ¥{orderInfo.amount}</p>
                <p>财政补贴: ¥{orderInfo.government_subsidy}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3c72' }}>
                  实缴金额: ¥{orderInfo.total_amount}
                </p>
                <button className="btn btn-success" onClick={payOrder}>
                  立即支付
                </button>
              </div>
            )}

            {!orderInfo && (
              <button 
                className="btn btn-primary" 
                onClick={createOrder}
                disabled={!selectedType || !selectedGrade}
              >
                生成缴费订单
              </button>
            )}

            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
              对接各地税务/医保局标准接口，缴费数据实时同步
            </p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {orders.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>险种</th>
                    <th>档位</th>
                    <th>金额</th>
                    <th>补贴</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>{o.order_no}</td>
                      <td>{o.insurance_type === 'pension' ? '养老保险' : '医疗保险'}</td>
                      <td>{o.year_grade}</td>
                      <td>¥{o.amount}</td>
                      <td>¥{o.government_subsidy}</td>
                      <td>
                        <span className={`badge badge-${o.status === 'paid' ? 'success' : 'warning'}`}>
                          {o.status === 'paid' ? '已支付' : '待支付'}
                        </span>
                      </td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="loading">暂无缴费记录</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
