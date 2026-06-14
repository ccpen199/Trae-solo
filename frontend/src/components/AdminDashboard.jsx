
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../apiConfig';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchStats = async () => {
    const res = await axios.get(`${API_BASE}/api/dashboard/stats`);
    setStats(res.data);
  };

  const fetchDrivers = async () => {
    const res = await axios.get(`${API_BASE}/api/drivers`);
    setDrivers(res.data);
  };

  const fetchShippers = async () => {
    const res = await axios.get(`${API_BASE}/api/shippers`);
    setShippers(res.data);
  };

  const fetchOrders = async () => {
    const res = await axios.get(`${API_BASE}/api/orders`);
    setOrders(res.data);
  };

  const fetchShipments = async () => {
    const res = await axios.get(`${API_BASE}/api/shipments`);
    setShipments(res.data);
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'drivers') fetchDrivers();
    if (activeTab === 'shippers') fetchShippers();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'shipments') fetchShipments();
  }, [activeTab]);

  const handleVerifyDriver = async (driverId) => {
    try {
      await axios.put(`${API_BASE}/api/drivers/${driverId}/verify`);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.error || '认证失败');
    }
  };

  return (
    <>
      <div className="nav">
        <div className="nav-brand">管理后台</div>
        <div className="nav-links">
          <span style={{ marginRight: 20 }}>欢迎, {user.username}</span>
          <button className="btn btn-secondary" onClick={onLogout}>退出</button>
        </div>
      </div>
      <div className="container">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
          >
            数据概览
          </div>
          <div 
            className={`tab ${activeTab === 'drivers' ? 'active' : ''}`} 
            onClick={() => setActiveTab('drivers')}
          >
            司机管理
          </div>
          <div 
            className={`tab ${activeTab === 'shippers' ? 'active' : ''}`} 
            onClick={() => setActiveTab('shippers')}
          >
            货主管理
          </div>
          <div 
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
          >
            订单管理
          </div>
          <div 
            className={`tab ${activeTab === 'shipments' ? 'active' : ''}`} 
            onClick={() => setActiveTab('shipments')}
          >
            运单管理
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-4">
            <div className="stats-card">
              <div className="stats-number">{stats.pendingOrders || 0}</div>
              <div className="stats-label">待接订单</div>
            </div>
            <div className="stats-card">
              <div className="stats-number">{stats.activeOrders || 0}</div>
              <div className="stats-label">活跃订单</div>
            </div>
            <div className="stats-card">
              <div className="stats-number">{stats.verifiedDrivers || 0}</div>
              <div className="stats-label">认证司机</div>
            </div>
            <div className="stats-card">
              <div className="stats-number">{stats.avgRating || 0}</div>
              <div className="stats-label">平均评分</div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="card">
            <h2>司机列表</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>真实姓名</th>
                  <th>电话</th>
                  <th>车牌</th>
                  <th>车型</th>
                  <th>认证状态</th>
                  <th>评分</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id}>
                    <td>{driver.id}</td>
                    <td>{driver.username}</td>
                    <td>{driver.real_name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.license_plate}</td>
                    <td>{driver.vehicle_type}</td>
                    <td>
                      {driver.verified ? (
                        <span className="badge badge-delivered">已认证</span>
                      ) : (
                        <span className="badge badge-published">待认证</span>
                      )}
                    </td>
                    <td>{driver.rating}</td>
                    <td>
                      {!driver.verified && (
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleVerifyDriver(driver.id)}
                        >
                          认证通过
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'shippers' && (
          <div className="card">
            <h2>货主列表</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>公司名称</th>
                  <th>联系人</th>
                  <th>电话</th>
                  <th>地址</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {shippers.map(shipper => (
                  <tr key={shipper.id}>
                    <td>{shipper.id}</td>
                    <td>{shipper.username}</td>
                    <td>{shipper.company_name}</td>
                    <td>{shipper.contact_person}</td>
                    <td>{shipper.phone}</td>
                    <td>{shipper.address}</td>
                    <td>{new Date(shipper.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <h2>订单列表</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>货主</th>
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
                    <td>{order.shipper_name}</td>
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
        )}

        {activeTab === 'shipments' && (
          <div className="card">
            <h2>运单列表</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>运单ID</th>
                  <th>订单ID</th>
                  <th>司机</th>
                  <th>车牌</th>
                  <th>车型</th>
                  <th>出发地</th>
                  <th>目的地</th>
                  <th>议价</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(shipment => (
                  <tr key={shipment.id}>
                    <td>{shipment.id}</td>
                    <td>{shipment.order_id}</td>
                    <td>{shipment.driver_name || '-'}</td>
                    <td>{shipment.license_plate || '-'}</td>
                    <td>{shipment.vehicle_type || '-'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
