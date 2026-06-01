import React, { useState, useEffect } from 'react';
import { dashboard, orders, drivers } from '../api';

function DispatchBoard() {
  const [boardData, setBoardData] = useState({ pendingOrders: [], activeOrders: [], availableResources: [] });
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverList, setDriverList] = useState([]);

  useEffect(() => {
    loadBoardData();
    loadDrivers();
  }, []);

  const loadBoardData = async () => {
    try {
      const res = await dashboard.getDispatchBoard();
      setBoardData(res.data);
    } catch (error) {
      console.error('加载调度看板失败:', error);
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

  const openDispatchModal = (order) => {
    setSelectedOrder(order);
    setShowDispatchModal(true);
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      const selectedDriver = driverList.find(d => d.id === parseInt(e.target.driver_id.value));
      await orders.dispatch(selectedOrder.id, {
        driver_id: parseInt(e.target.driver_id.value),
        vehicle_id: selectedDriver.vehicle_id
      });
      setShowDispatchModal(false);
      loadBoardData();
      loadDrivers();
    } catch (error) {
      alert('派单失败: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🎯 调度看板</h2>
      
      <div className="dispatch-board">
        <div className="board-column">
          <h3>📋 待派单 ({boardData.pendingOrders.length})</h3>
          {boardData.pendingOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>暂无待派单</div>
          ) : (
            boardData.pendingOrders.map(order => (
              <div key={order.id} className="order-card" onClick={() => openDispatchModal(order)}>
                <div className="order-no">{order.order_no}</div>
                <div className="order-info">客户: {order.customer_name}</div>
                <div className="order-info">箱型: {order.container_type} / {order.container_count}</div>
                <div className="order-info">提柜: {order.pickup_location}</div>
                <div className="order-info" style={{ color: '#ef4444' }}>截港: {new Date(order.cut_off_time).toLocaleString('zh-CN')}</div>
                <button className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>派单</button>
              </div>
            ))
          )}
        </div>

        <div className="board-column">
          <h3>🚚 执行中 ({boardData.activeOrders.length})</h3>
          {boardData.activeOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>暂无执行中订单</div>
          ) : (
            boardData.activeOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-no">{order.order_no}</div>
                <div className="order-info">司机: {order.driver_name}</div>
                <div className="order-info">车牌: {order.plate_number}</div>
                <div className="order-info">箱型: {order.container_type}</div>
                <span className={`badge badge-${order.status}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                  {order.status === 'dispatched' ? '已派单' : '进港中'}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="board-column">
          <h3>✅ 可用资源 ({boardData.availableResources.length})</h3>
          {boardData.availableResources.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>暂无可用资源</div>
          ) : (
            boardData.availableResources.map(resource => (
              <div key={resource.driver_id} className="order-card" style={{ cursor: 'default' }}>
                <div className="order-no">🚗 {resource.driver_name}</div>
                <div className="order-info">车牌: {resource.plate_number}</div>
                <div className="order-info">车型: {resource.vehicle_type}</div>
                <div className="order-info">资质: {resource.qualifications}</div>
                <span className="badge badge-available" style={{ marginTop: '0.5rem', display: 'inline-block' }}>可用</span>
              </div>
            ))
          )}
        </div>
      </div>

      {showDispatchModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDispatchModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>派单 - {selectedOrder.order_no}</h2>
              <button className="modal-close" onClick={() => setShowDispatchModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p><strong>客户:</strong> {selectedOrder.customer_name}</p>
              <p><strong>箱型/数量:</strong> {selectedOrder.container_type} / {selectedOrder.container_count}</p>
              <p><strong>截港时间:</strong> {new Date(selectedOrder.cut_off_time).toLocaleString('zh-CN')}</p>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="form-group">
                <label>选择司机/车辆</label>
                <select name="driver_id" required>
                  <option value="">请选择司机</option>
                  {driverList.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.plate_number} ({d.qualifications})</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowDispatchModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认派单</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DispatchBoard;
