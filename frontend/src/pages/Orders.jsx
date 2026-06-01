import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, skuApi } from '../api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [skus, setSkus] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    address: '',
    temperature_zone: 'cold',
    time_slot: '上午 09:00-12:00',
    route: 'A线',
    priority: 0,
    items: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, skusRes] = await Promise.all([
        orderApi.getAll(),
        skuApi.getAll()
      ]);
      setOrders(ordersRes.data);
      setSkus(skusRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleCreateOrder = async () => {
    if (newOrder.items.length === 0) {
      alert('请添加商品');
      return;
    }
    try {
      await orderApi.create(newOrder);
      setShowCreateModal(false);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        address: '',
        temperature_zone: 'cold',
        time_slot: '上午 09:00-12:00',
        route: 'A线',
        priority: 0,
        items: []
      });
      loadData();
    } catch (err) {
      alert('创建订单失败');
    }
  };

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { sku_id: '', quantity: 1 }]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const items = [...newOrder.items];
    items[index][field] = field === 'quantity' ? parseFloat(value) : value;
    setNewOrder({ ...newOrder, items });
  };

  const removeOrderItem = (index) => {
    const items = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      picking: 'badge-picking',
      picked: 'badge-picking',
      reviewing: 'badge-pending',
      delivering: 'badge-picking',
      out_for_delivery: 'badge-picking',
      completed: 'badge-success',
      delivery_failed: 'badge-danger',
      after_sale: 'badge-warning',
      closed: 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      picking: '拣货中',
      picked: '已拣货',
      reviewing: '复核中',
      delivering: '配送中',
      out_for_delivery: '配送中',
      completed: '已完成',
      delivery_failed: '配送失败',
      after_sale: '售后中',
      closed: '已关闭'
    };
    return texts[status] || status;
  };

  const getTempTag = (zone) => {
    const tags = {
      cold: 'tag-cold',
      frozen: 'tag-frozen',
      normal: 'tag-normal'
    };
    return tags[zone] || 'tag-normal';
  };

  const getTempText = (zone) => {
    const texts = {
      cold: '冷藏',
      frozen: '冷冻',
      normal: '常温'
    };
    return texts[zone] || zone;
  };

  return (
    <div>
      <h1 className="page-title">订单管理</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>订单列表</h3>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>新建订单</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>电话</th>
              <th>温区</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.order_no}</td>
                <td>{order.customer_name}</td>
                <td>{order.customer_phone}</td>
                <td><span className={`tag ${getTempTag(order.temperature_zone)}`}>{getTempText(order.temperature_zone)}</span></td>
                <td>¥{order.total_amount.toFixed(2)}</td>
                <td><span className={`badge ${getStatusBadge(order.status)}`}>{getStatusText(order.status)}</span></td>
                <td>{new Date(order.created_at).toLocaleString('zh-CN')}</td>
                <td><Link to={`/orders/${order.id}`} className="btn btn-primary">详情</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3>新建订单</h3>
            <div className="form-row">
              <div className="form-group">
              <label>客户姓名</label>
              <input type="text" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>客户电话</label>
              <input type="text" value={newOrder.customer_phone} onChange={e => setNewOrder({...newOrder, customer_phone: e.target.value})} />
            </div>
            </div>
            <div className="form-group">
              <label>配送地址</label>
              <input type="text" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>温区</label>
                <select value={newOrder.temperature_zone} onChange={e => setNewOrder({...newOrder, temperature_zone: e.target.value})}>
                  <option value="cold">冷藏</option>
                  <option value="frozen">冷冻</option>
                  <option value="normal">常温</option>
                </select>
              </div>
              <div className="form-group">
                <label>时段</label>
                <select value={newOrder.time_slot} onChange={e => setNewOrder({...newOrder, time_slot: e.target.value})}>
                  <option>上午 09:00-12:00</option>
                  <option>下午 14:00-18:00</option>
                  <option>晚间 18:00-21:00</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>路线</label>
                <select value={newOrder.route} onChange={e => setNewOrder({...newOrder, route: e.target.value})}>
                  <option>A线</option>
                  <option>B线</option>
                  <option>C线</option>
                </select>
              </div>
              <div className="form-group">
                <label>优先级</label>
                <select value={newOrder.priority} onChange={e => setNewOrder({...newOrder, priority: parseInt(e.target.value)})}>
                  <option value={0}>普通</option>
                  <option value={1}>优先</option>
                  <option value={2}>紧急</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>商品列表</label>
                <button className="btn btn-primary" onClick={addOrderItem}>添加商品</button>
              </div>
              {newOrder.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select style={{ flex: 2 }} value={item.sku_id} onChange={e => updateOrderItem(index, 'sku_id', e.target.value)}>
                    <option value="">选择商品</option>
                    {skus.map(sku => (
                      <option key={sku.id} value={sku.id}>{sku.sku_code} - {sku.name} (¥{sku.price}/{sku.unit})</option>
                    ))}
                  </select>
                  <input type="number" style={{ flex: 1 }} placeholder="数量" value={item.quantity} onChange={e => updateOrderItem(index, 'quantity', e.target.value)} />
                  <button className="btn btn-danger" onClick={() => removeOrderItem(index)}>删除</button>
                </div>
              ))}
            </div>
            
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateOrder}>创建订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
