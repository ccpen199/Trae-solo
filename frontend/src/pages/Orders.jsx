import React, { useState, useEffect } from 'react';
import { ordersAPI, vehiclesAPI, customersAPI, storesAPI } from '../api.js';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: '', customer_id: '', pickup_store_id: '', return_store_id: '',
    pickup_date: '', return_date: '', deposit: 0, daily_rate: 0, discount: 0,
    additional_fee: 0
  });
  const [pickupForm, setPickupForm] = useState({ fuel_level: 100, mileage: 0, damages: '' });
  const [returnForm, setReturnForm] = useState({ fuel_level: 100, mileage: 0, new_damages: '', damage_fee: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, vehiclesRes, customersRes, storesRes] = await Promise.all([
        ordersAPI.getAll(),
        vehiclesAPI.getAvailable(),
        customersAPI.getAll(),
        storesAPI.getAll()
      ]);
      setOrders(ordersRes.data);
      setVehicles(vehiclesRes.data);
      setCustomers(customersRes.data);
      setStores(storesRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id == vehicleId);
    if (vehicle) {
      setFormData({ ...formData, vehicle_id: vehicleId, daily_rate: vehicle.daily_rate });
    }
  };

  const calculateTotal = () => {
    if (!formData.pickup_date || !formData.return_date || !formData.daily_rate) return 0;
    const days = Math.ceil((new Date(formData.return_date) - new Date(formData.pickup_date)) / (1000 * 60 * 60 * 24));
    return Math.max(0, days * formData.daily_rate - (formData.discount || 0) + (formData.additional_fee || 0));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.create({ ...formData, total_amount: calculateTotal() });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('创建订单失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handlePickup = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.pickup(selectedOrder.id, pickupForm);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('取车失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.return(selectedOrder.id, returnForm);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('还车失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const openPickupModal = (order) => {
    setSelectedOrder(order);
    setPickupForm({ fuel_level: 100, mileage: 0, damages: '' });
    setModalType('pickup');
    setShowModal(true);
  };

  const openReturnModal = (order) => {
    setSelectedOrder(order);
    setReturnForm({ fuel_level: 100, mileage: 0, new_damages: '', damage_fee: 0 });
    setModalType('return');
    setShowModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = { confirmed: '已确认', picked_up: '已取车', returned: '已还车', cancelled: '已取消' };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>订单管理</h1>
        <button className="btn btn-primary" onClick={() => { setModalType('create'); setShowModal(true); }}>
          + 创建订单
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>车辆</th>
                <th>取车门店</th>
                <th>还车门店</th>
                <th>取车时间</th>
                <th>还车时间</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.order_no}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.brand} {o.model} ({o.plate_number})</td>
                  <td>{o.pickup_store_name}</td>
                  <td>{o.return_store_name}</td>
                  <td>{o.pickup_date?.slice(0, 16)}</td>
                  <td>{o.return_date?.slice(0, 16)}</td>
                  <td>¥{o.total_amount}</td>
                  <td><span className={`status-badge status-${o.status}`}>{getStatusLabel(o.status)}</span></td>
                  <td>
                    <div className="action-buttons">
                      {o.status === 'confirmed' && (
                        <button className="btn btn-sm btn-success" onClick={() => openPickupModal(o)}>取车</button>
                      )}
                      {o.status === 'picked_up' && (
                        <button className="btn btn-sm btn-primary" onClick={() => openReturnModal(o)}>还车</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {modalType === 'create' ? '创建订单' : 
                 modalType === 'pickup' ? '取车检查' : '还车检查'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {modalType === 'create' && (
                <form onSubmit={handleCreateOrder}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>客户 *</label>
                      <select required value={formData.customer_id}
                        onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                        <option value="">请选择</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>车辆 *</label>
                      <select required value={formData.vehicle_id}
                        onChange={e => handleVehicleChange(e.target.value)}>
                        <option value="">请选择</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate_number}) - ¥{v.daily_rate}/天</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>取车门店 *</label>
                      <select required value={formData.pickup_store_id}
                        onChange={e => setFormData({...formData, pickup_store_id: e.target.value})}>
                        <option value="">请选择</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>还车门店 *</label>
                      <select required value={formData.return_store_id}
                        onChange={e => setFormData({...formData, return_store_id: e.target.value})}>
                        <option value="">请选择</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>取车时间 *</label>
                      <input type="datetime-local" required value={formData.pickup_date}
                        onChange={e => setFormData({...formData, pickup_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>还车时间 *</label>
                      <input type="datetime-local" required value={formData.return_date}
                        onChange={e => setFormData({...formData, return_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>押金 (¥)</label>
                      <input type="number" value={formData.deposit}
                        onChange={e => setFormData({...formData, deposit: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                      <label>优惠 (¥)</label>
                      <input type="number" value={formData.discount}
                        onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>预估总额: ¥{calculateTotal()}</label>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">创建</button>
                  </div>
                </form>
              )}

              {modalType === 'pickup' && (
                <form onSubmit={handlePickup}>
                  <p>订单: {selectedOrder?.order_no}</p>
                  <div className="form-group">
                    <label>油量 (%)</label>
                    <input type="number" min="0" max="100" value={pickupForm.fuel_level}
                      onChange={e => setPickupForm({...pickupForm, fuel_level: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>里程 (km)</label>
                    <input type="number" value={pickupForm.mileage}
                      onChange={e => setPickupForm({...pickupForm, mileage: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>已有损伤</label>
                    <textarea rows="3" value={pickupForm.damages}
                      onChange={e => setPickupForm({...pickupForm, damages: e.target.value})} />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">确认取车</button>
                  </div>
                </form>
              )}

              {modalType === 'return' && (
                <form onSubmit={handleReturn}>
                  <p>订单: {selectedOrder?.order_no}</p>
                  <div className="form-group">
                    <label>剩余油量 (%)</label>
                    <input type="number" min="0" max="100" value={returnForm.fuel_level}
                      onChange={e => setReturnForm({...returnForm, fuel_level: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>归还里程 (km)</label>
                    <input type="number" value={returnForm.mileage}
                      onChange={e => setReturnForm({...returnForm, mileage: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>新增损伤</label>
                    <textarea rows="3" value={returnForm.new_damages}
                      onChange={e => setReturnForm({...returnForm, new_damages: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>车损费用 (¥)</label>
                    <input type="number" value={returnForm.damage_fee}
                      onChange={e => setReturnForm({...returnForm, damage_fee: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">确认还车</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
