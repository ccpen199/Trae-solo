import React, { useState, useEffect } from 'react';
import api from '../api';

function Medication({ user }) {
  const [medications, setMedications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medications');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({});
  const [elderlyList, setElderlyList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medsRes, ordersRes, lowStockRes, elderlyRes] = await Promise.all([
        api.get('/medication/medications'),
        api.get('/medication/orders'),
        api.get('/medication/low-stock'),
        api.get('/elderly')
      ]);
      setMedications(medsRes.data);
      setOrders(ordersRes.data);
      setLowStock(lowStockRes.data);
      setElderlyList(elderlyRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medication/orders', orderForm);
      setShowOrderModal(false);
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>用药管理</h2>
        {['admin', 'nurse'].includes(user.role) && (
          <button
            onClick={() => setShowOrderModal(true)}
            style={{
              padding: '10px 20px',
              background: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 开具医嘱
          </button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div style={{
          background: '#fff3e0',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffcc80'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: 'bold', color: '#e65100' }}>库存预警 - {lowStock.length}种药品库存不足</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lowStock.map((med) => (
              <span key={med.id} style={{
                padding: '4px 10px',
                background: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid #ffcc80'
              }}>
                {med.name} (剩余: {med.stock_quantity}{med.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          <button
            onClick={() => setActiveTab('medications')}
            style={{
              padding: '14px 24px',
              border: 'none',
              background: activeTab === 'medications' ? '#f5f5f5' : 'transparent',
              color: activeTab === 'medications' ? '#2196f3' : '#666',
              cursor: 'pointer',
              borderBottom: activeTab === 'medications' ? '2px solid #2196f3' : '2px solid transparent',
              fontSize: '14px'
            }}
          >
            药品库存
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '14px 24px',
              border: 'none',
              background: activeTab === 'orders' ? '#f5f5f5' : 'transparent',
              color: activeTab === 'orders' ? '#2196f3' : '#666',
              cursor: 'pointer',
              borderBottom: activeTab === 'orders' ? '2px solid #2196f3' : '2px solid transparent',
              fontSize: '14px'
            }}
          >
            用药医嘱
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {activeTab === 'medications' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>药品名称</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>规格</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>生产厂家</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>库存</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>预警线</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>
                      💊 {med.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{med.specification}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{med.manufacturer}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <span style={{
                        color: med.stock_quantity <= med.warning_threshold ? '#f44336' : '#4caf50',
                        fontWeight: 'bold'
                      }}>
                        {med.stock_quantity} {med.unit}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{med.warning_threshold} {med.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'orders' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>老人</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>药品</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>剂量</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>频率</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{order.elderly_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{order.medication_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{order.dosage}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{order.frequency}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: order.is_active ? '#e8f5e9' : '#f5f5f5',
                        color: order.is_active ? '#2e7d32' : '#999',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {order.is_active ? '生效中' : '已停用'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>开具用药医嘱</h3>
            <form onSubmit={handleOrderSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>老人</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setOrderForm({ ...orderForm, elderly_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {elderlyList.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>药品</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setOrderForm({ ...orderForm, medication_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} - {m.specification}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>剂量</label>
                  <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="如：1片"
                    onChange={(e) => setOrderForm({ ...orderForm, dosage: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>频率</label>
                  <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="如：每日2次"
                    onChange={(e) => setOrderForm({ ...orderForm, frequency: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>备注</label>
                <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="服用说明等"
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowOrderModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medication;
