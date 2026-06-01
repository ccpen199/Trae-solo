import React, { useState, useEffect } from 'react';
import { orders, customers, drivers } from '../api';

function Orders() {
  const [orderList, setOrderList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    container_type: '20GP',
    container_count: 1,
    pickup_location: '',
    loading_address: '',
    port: '',
    cut_off_time: '',
    contact_person: '',
    contact_phone: '',
    special_requirements: ''
  });

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadDrivers();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await orders.getAll();
      setOrderList(res.data);
    } catch (error) {
      console.error('加载订单失败:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await customers.getAll();
      setCustomerList(res.data);
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await drivers.getAvailable();
      setDriverList(res.data);
    } catch (error) {
      console.error('加载司机失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orders.create(formData);
      setShowModal(false);
      loadOrders();
      setFormData({
        customer_id: '',
        container_type: '20GP',
        container_count: 1,
        pickup_location: '',
        loading_address: '',
        port: '',
        cut_off_time: '',
        contact_person: '',
        contact_phone: '',
        special_requirements: ''
      });
    } catch (error) {
      alert('创建订单失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const viewOrder = async (order) => {
    try {
      const res = await orders.get(order.id);
      setSelectedOrder(res.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('加载订单详情失败:', error);
    }
  };

  const handleAction = async (action) => {
    try {
      await orders.action(selectedOrder.id, { action, location: '当前位置' });
      const res = await orders.get(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      const selectedDriver = driverList.find(d => d.id === parseInt(e.target.driver_id.value));
      await orders.dispatch(selectedOrder.id, {
        driver_id: parseInt(e.target.driver_id.value),
        vehicle_id: selectedDriver.vehicle_id
      });
      setShowDetailModal(false);
      loadOrders();
      loadDrivers();
    } catch (error) {
      alert('派单失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusMap = {
    pending: '待派单',
    dispatched: '已派单',
    in_port: '进港中',
    completed: '已完成'
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <h2>📦 订单管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建订单
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>箱型/数量</th>
              <th>提柜地点</th>
              <th>截港时间</th>
              <th>司机/车牌</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orderList.map(order => (
              <tr key={order.id}>
                <td><strong>{order.order_no}</strong></td>
                <td>{order.customer_name || '-'}</td>
                <td>{order.container_type} / {order.container_count}</td>
                <td>{order.pickup_location || '-'}</td>
                <td>{order.cut_off_time ? new Date(order.cut_off_time).toLocaleString('zh-CN') : '-'}</td>
                <td>{order.driver_name || '-'} / {order.plate_number || '-'}</td>
                <td><span className={`badge badge-${order.status}`}>{statusMap[order.status]}</span></td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => viewOrder(order)}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orderList.length === 0 && <div className="empty-state">暂无订单</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建订单</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>客户</label>
                  <select value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} required>
                    <option value="">请选择客户</option>
                    {customerList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>箱型</label>
                  <select value={formData.container_type} onChange={e => setFormData({...formData, container_type: e.target.value})}>
                    <option value="20GP">20GP</option>
                    <option value="40GP">40GP</option>
                    <option value="40HQ">40HQ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>箱量</label>
                  <input type="number" min="1" value={formData.container_count} onChange={e => setFormData({...formData, container_count: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>提柜地点</label>
                  <input type="text" value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>装货地址</label>
                  <input type="text" value={formData.loading_address} onChange={e => setFormData({...formData, loading_address: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>目的港</label>
                  <input type="text" value={formData.port} onChange={e => setFormData({...formData, port: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>截港时间</label>
                  <input type="datetime-local" value={formData.cut_off_time} onChange={e => setFormData({...formData, cut_off_time: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>联系人</label>
                  <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input type="text" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>特殊要求</label>
                <textarea rows="3" value={formData.special_requirements} onChange={e => setFormData({...formData, special_requirements: e.target.value})}></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建订单</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>订单详情 - {selectedOrder.order_no}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">状态</span>
              <span className="detail-value"><span className={`badge badge-${selectedOrder.status}`}>{statusMap[selectedOrder.status]}</span></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">客户</span>
              <span className="detail-value">{selectedOrder.customer_name || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">箱型/数量</span>
              <span className="detail-value">{selectedOrder.container_type} / {selectedOrder.container_count}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">提柜地点</span>
              <span className="detail-value">{selectedOrder.pickup_location || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">装货地址</span>
              <span className="detail-value">{selectedOrder.loading_address || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">目的港</span>
              <span className="detail-value">{selectedOrder.port || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">截港时间</span>
              <span className="detail-value">{selectedOrder.cut_off_time ? new Date(selectedOrder.cut_off_time).toLocaleString('zh-CN') : '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">司机/车牌</span>
              <span className="detail-value">{selectedOrder.driver_name || '-'} / {selectedOrder.plate_number || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">联系人/电话</span>
              <span className="detail-value">{selectedOrder.contact_person || '-'} / {selectedOrder.contact_phone || '-'}</span>
            </div>

            {selectedOrder.status === 'pending' && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>派单</h4>
                <form onSubmit={handleDispatch}>
                  <div className="form-group">
                    <label>选择司机</label>
                    <select name="driver_id" required>
                      <option value="">请选择司机</option>
                      {driverList.map(d => (
                        <option key={d.id} value={d.id}>{d.name} - {d.plate_number} ({d.qualifications})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">确认派单</button>
                  </div>
                </form>
              </div>
            )}

            {(selectedOrder.status === 'dispatched' || selectedOrder.status === 'in_port') && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>执行操作</h4>
                <div className="action-buttons">
                  {selectedOrder.status === 'dispatched' && (
                    <>
                      <button className="btn btn-primary" onClick={() => handleAction('arrived')}>到场确认</button>
                      <button className="btn btn-primary" onClick={() => handleAction('picked_up')}>提柜确认</button>
                      <button className="btn btn-primary" onClick={() => handleAction('loaded')}>装货完成</button>
                    </>
                  )}
                  <button className="btn btn-success" onClick={() => handleAction('entered_port')}>进港确认</button>
                  <button className="btn btn-success" onClick={() => handleAction('returned')}>还柜确认</button>
                  <button className="btn btn-warning" onClick={() => handleAction('completed')}>完成订单</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>执行时间线</h4>
              {(!selectedOrder.timelines || selectedOrder.timelines.length === 0) ? (
                <p style={{ color: '#6b7280' }}>暂无执行记录</p>
              ) : (
                <div className="timeline">
                  {selectedOrder.timelines.map(item => (
                    <div key={item.id} className="timeline-item">
                      <div className="action">{item.action}</div>
                      <div className="time">{new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                      {item.location && <div className="location">📍 {item.location}</div>}
                      {item.remarks && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.remarks}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
