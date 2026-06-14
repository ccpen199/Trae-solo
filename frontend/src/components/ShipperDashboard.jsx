
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../apiConfig';

const ShipperDashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchOrders = async () => {
    const res = await axios.get(`${API_BASE}/api/orders`);
    setOrders(res.data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/orders`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowCreate(false);
      setFormData({});
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || '创建订单失败');
    }
  };

  return (
    <>
      <div className="nav">
        <div className="nav-brand">货主端</div>
        <div className="nav-links">
          <span style={{ marginRight: 20 }}>欢迎, {user.username}</span>
          <button className="btn btn-secondary" onClick={onLogout}>退出</button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2>货源订单</h2>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '发布货源'}
          </button>
          </div>
          
          {showCreate && (
            <div className="card" style={{ background: '#f8f9fa' }}>
              <h3 style={{ marginBottom: 20 }}>发布新货源</h3>
              <form onSubmit={handleCreateOrder}>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>出发地</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      onChange={e => setFormData({ ...formData, sourceLocation: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>目的地</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      onChange={e => setFormData({ ...formData, destinationLocation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>货物描述</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    onChange={e => setFormData({ ...formData, cargoDescription: e.target.value })}
                  />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>货物重量 (吨)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      onChange={e => setFormData({ ...formData, cargoWeight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>期望价格 (元)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>车型需求</label>
                    <select 
                      className="form-control" 
                      required 
                      onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="小型货车">小型货车</option>
                      <option value="中型货车">中型货车</option>
                      <option value="大型货车">大型货车</option>
                      <option value="平板车">平板车</option>
                      <option value="冷藏车">冷藏车</option>
                      <option value="危险品车">危险品车</option>
                      <option value="高栏车">高栏车</option>
                      <option value="厢式货车">厢式货车</option>
                      <option value="自卸车">自卸车</option>
                      <option value="半挂车">半挂车</option>
                      <option value="全挂车">全挂车</option>
                      <option value="轿运车">轿运车</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>服务类型</label>
                    <select 
                      className="form-control" 
                      required 
                      onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="特快">特快</option>
                      <option value="普快">普快</option>
                      <option value="拼车">拼车</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">发布</button>
              </form>
            </div>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>出发地</th>
                <th>目的地</th>
                <th>车型</th>
                <th>服务类型</th>
                <th>价格</th>
                <th>状态</th>
                <th>发布时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.source_location}</td>
                  <td>{order.destination_location}</td>
                  <td>{order.vehicle_type}</td>
                  <td>{order.service_type}</td>
                  <td>¥{order.negotiated_price || order.base_price}</td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {order.status === 'published' ? '待接单' : 
                       order.status === 'accepted' ? '已接单' :
                       order.status === 'picked_up' ? '已提货' :
                       order.status === 'in_transit' ? '运输中' : '已送达'}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ShipperDashboard;
