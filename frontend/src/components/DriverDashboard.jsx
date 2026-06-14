
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../apiConfig';

const DriverDashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [filter, setFilter] = useState({});

  const fetchOrders = async () => {
    const params = new URLSearchParams();
    if (filter.vehicleType) params.append('vehicleType', filter.vehicleType);
    if (filter.serviceType) params.append('serviceType', filter.serviceType);
    params.append('status', 'published');
    const res = await axios.get(`${API_BASE}/api/orders?${params}`);
    setOrders(res.data);
  };

  const fetchShipments = async () => {
    const res = await axios.get(`${API_BASE}/api/shipments`);
    setShipments(res.data.filter(s => s.driver_id === user.id));
  };

  useEffect(() => {
    if (activeTab === 'available') fetchOrders();
    else fetchShipments();
  }, [activeTab, filter]);

  const handleAcceptOrder = async (orderId) => {
    const negotiatedPrice = prompt('请输入议价：');
    if (!negotiatedPrice) return;
    try {
      await axios.post(`${API_BASE}/api/shipments`, 
        { orderId, negotiatedPrice: parseFloat(negotiatedPrice) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || '接单失败');
    }
  };

  const handleUpdateStatus = async (shipmentId, status) => {
    try {
      await axios.put(`${API_BASE}/api/shipments/${shipmentId}/status`, {
        status,
        pickupTime: status === 'picked_up' ? new Date().toISOString() : undefined,
        deliveryTime: status === 'delivered' ? new Date().toISOString() : undefined
      });
      fetchShipments();
    } catch (err) {
      alert(err.response?.data?.error || '更新失败');
    }
  };

  return (
    <>
      <div className="nav">
        <div className="nav-brand">司机端</div>
        <div className="nav-links">
          <span style={{ marginRight: 20 }}>欢迎, {user.realName || user.username}</span>
          {user.verified ? (
            <span style={{ marginRight: 20, color: '#27ae60' }}>已认证</span>
          ) : (
            <span style={{ marginRight: 20, color: '#e74c3c' }}>待认证</span>
          )}
          <button className="btn btn-secondary" onClick={onLogout}>退出</button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'available' ? 'active' : ''}`} 
              onClick={() => setActiveTab('available')}
            >
              可接订单
            </div>
            <div 
              className={`tab ${activeTab === 'my' ? 'active' : ''}`} 
              onClick={() => setActiveTab('my')}
            >
              我的运单
            </div>
          </div>

          {activeTab === 'available' && (
            <>
              <div className="grid grid-2" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>车型筛选</label>
                  <select 
                    className="form-control" 
                    onChange={e => setFilter({ ...filter, vehicleType: e.target.value })}
                  >
                    <option value="">全部</option>
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
                    onChange={e => setFilter({ ...filter, serviceType: e.target.value })}
                  >
                    <option value="">全部</option>
                    <option value="特快">特快</option>
                    <option value="普快">普快</option>
                    <option value="拼车">拼车</option>
                  </select>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>货主</th>
                    <th>出发地</th>
                    <th>目的地</th>
                    <th>车型</th>
                    <th>服务类型</th>
                    <th>期望价格</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.shipper_name}</td>
                      <td>{order.source_location}</td>
                      <td>{order.destination_location}</td>
                      <td>{order.vehicle_type}</td>
                      <td>{order.service_type}</td>
                      <td>¥{order.base_price}</td>
                      <td>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                          接单议价
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'my' && (
            <table className="table">
              <thead>
                <tr>
                  <th>运单ID</th>
                  <th>订单ID</th>
                  <th>出发地</th>
                  <th>目的地</th>
                  <th>议价</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(shipment => (
                  <tr key={shipment.id}>
                    <td>{shipment.id}</td>
                    <td>{shipment.order_id}</td>
                    <td>{shipment.source_location}</td>
                    <td>{shipment.destination_location}</td>
                    <td>¥{shipment.negotiated_price}</td>
                    <td>
                      <span className={`badge badge-${shipment.status}`}>
                        {shipment.status === 'accepted' ? '已接单' :
                         shipment.status === 'picked_up' ? '已提货' :
                         shipment.status === 'in_transit' ? '运输中' : '已送达'}
                      </span>
                    </td>
                    <td>
                      {shipment.status === 'accepted' && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleUpdateStatus(shipment.id, 'picked_up')}
                        >
                          确认提货
                        </button>
                      )}
                      {shipment.status === 'picked_up' && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleUpdateStatus(shipment.id, 'in_transit')}
                        >
                          开始运输
                        </button>
                      )}
                      {shipment.status === 'in_transit' && (
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleUpdateStatus(shipment.id, 'delivered')}
                        >
                          确认送达
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default DriverDashboard;
