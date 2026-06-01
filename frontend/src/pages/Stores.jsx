import React, { useState, useEffect } from 'react';
import api from '../api';
import dayjs from 'dayjs';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [storeTemplates, setStoreTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '', name: '', address: '', manager_id: '', phone: ''
  });

  useEffect(() => {
    loadStores();
    loadEmployees();
  }, []);

  const loadStores = async () => {
    const res = await api.get('/stores');
    setStores(res.data);
  };

  const loadEmployees = async () => {
    const res = await api.get('/employees', { params: { position: '店长' } });
    setEmployees(res.data);
  };

  const openCreateModal = async () => {
    const res = await api.get('/stores/templates');
    setStoreTemplates(res.data);
    if (res.data.length > 0) {
      setFormData({
        code: res.data[0].code,
        name: res.data[0].name,
        address: res.data[0].default_address,
        manager_id: employees.length > 0 ? employees[0].id : '',
        phone: employees.length > 0 ? employees[0].phone : ''
      });
    } else {
      setFormData({
        code: '', name: '', address: '', manager_id: '', phone: ''
      });
    }
    setShowModal(true);
  };

  const onCodeChange = async (code) => {
    const template = storeTemplates.find(t => t.code === code);
    if (template) {
      setFormData({
        ...formData,
        code: template.code,
        name: template.name,
        address: template.default_address
      });
    }
  };

  const loadStoreDetail = async (storeId) => {
    setSelectedStore(storeId);
    const [invRes, calRes] = await Promise.all([
      api.get(`/stores/${storeId}/inventory`),
      api.get(`/stores/${storeId}/calendar`)
    ]);
    setInventory(invRes.data);
    setCalendar(calRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/stores', formData);
    setShowModal(false);
    loadStores();
  };

  const saveCalendar = async () => {
    await api.put(`/stores/${selectedStore}/calendar`, { calendar });
    alert('配送日历已保存');
  };

  return (
    <div>
      <div className="page-header">
        <h1>门店管理</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>新增门店</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <div className="card">
          <h3>门店列表</h3>
          <div style={{ marginTop: '15px' }}>
            {stores.map(s => (
              <div 
                key={s.id}
                onClick={() => loadStoreDetail(s.id)}
                style={{
                  padding: '12px',
                  border: selectedStore === s.id ? '2px solid #3498db' : '1px solid #eee',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selectedStore === s.id ? '#e8f4fd' : 'white'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{s.code} | {s.manager}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          {selectedStore ? (
            <>
              <div className="card">
                <h3>配送日历</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '15px' }}>
                  {calendar.map((c, idx) => (
                    <div key={idx} className="card" style={{ padding: '10px', margin: 0 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{weekDays[c.day_of_week]}</div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px' }}>
                          <input 
                            type="checkbox"
                            checked={c.is_delivery_day === 1}
                            onChange={(e) => {
                              const newCal = [...calendar];
                              newCal[idx] = { ...c, is_delivery_day: e.target.checked ? 1 : 0 };
                              setCalendar(newCal);
                            }}
                          />
                          配送日
                        </label>
                      </div>
                      {c.is_delivery_day === 1 && (
                        <input 
                          type="time"
                          value={c.cut_off_time}
                          onChange={(e) => {
                            const newCal = [...calendar];
                            newCal[idx] = { ...c, cut_off_time: e.target.value };
                            setCalendar(newCal);
                          }}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary mt-20" onClick={saveCalendar}>保存日历</button>
              </div>
              
              <div className="card">
                <h3>库存状况</h3>
                <table style={{ marginTop: '15px' }}>
                  <thead>
                    <tr>
                      <th>商品</th>
                      <th>分类</th>
                      <th>规格</th>
                      <th>当前库存</th>
                      <th>安全库存</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(i => (
                      <tr key={i.id}>
                        <td>{i.product_name}</td>
                        <td>{i.category}</td>
                        <td>{i.spec}</td>
                        <td className={i.quantity <= i.safety_stock ? 'text-warning' : 'text-success'}>
                          {i.quantity}
                        </td>
                        <td>{i.safety_stock}</td>
                        <td>
                          {i.quantity <= i.safety_stock ? (
                            <span className="badge badge-pending">库存不足</span>
                          ) : (
                            <span className="badge badge-active">正常</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ color: '#999' }}>请选择门店查看详情</div>
            </div>
          )}
        </div>
      </div>
      
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新增门店</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>门店编码</label>
                  <select 
                    value={formData.code} 
                    onChange={(e) => onCodeChange(e.target.value)}
                    disabled={storeTemplates.length === 0}
                  >
                    <option value="">请选择编码</option>
                    {storeTemplates.map(t => (
                      <option key={t.code} value={t.code}>{t.code}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>门店名称</label>
                  <input value={formData.name} readOnly style={{ background: '#f5f5f5' }} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>店长</label>
                  <select value={formData.manager_id} onChange={(e) => setFormData({...formData, manager_id: e.target.value})} required>
                    <option value="">请选择店长</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="店长手机号" />
                </div>
              </div>
              <div className="form-group">
                <label>门店地址</label>
                <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="门店详细地址" />
              </div>
              {storeTemplates.length === 0 && (
                <div style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '14px' }}>
                  暂无可用的门店编码，所有预定义门店已开通
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={storeTemplates.length === 0}>保存门店</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
