import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

function Processing() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const statusMap = {
    ordered: { label: '已下单', badge: 'badge-warning', next: 'lens_arrived', nextLabel: '镜片到货' },
    lens_arrived: { label: '镜片到货', badge: 'badge-info', next: 'processing', nextLabel: '开始加工' },
    processing: { label: '加工中', badge: 'badge-primary', next: 'quality_check', nextLabel: '质量检查' },
    quality_check: { label: '质检中', badge: 'badge-info', next: 'ready', nextLabel: '完成待取' },
    ready: { label: '待取镜', badge: 'badge-success', next: 'completed', nextLabel: '确认取镜' },
    completed: { label: '已完成', badge: 'badge-success' },
    cancelled: { label: '已取消', badge: 'badge-error' },
  };

  const tabList = [
    { key: 'all', label: '全部' },
    { key: 'ordered', label: '待处理' },
    { key: 'processing', label: '加工中' },
    { key: 'ready', label: '待取镜' },
    { key: 'completed', label: '已完成' },
  ];

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    const params = {};
    if (activeTab !== 'all') params.status = activeTab;
    const res = await api.get('/orders', { params: { ...params, pageSize: 100 } });
    setOrders(res.data.data);
  };

  const updateStatus = async (orderId, newStatus) => {
    const processor = prompt('请输入处理人姓名：');
    if (!processor) return;

    const notes = prompt('请输入备注（可选）：');

    await api.put(`/orders/${orderId}/status`, {
      status: newStatus,
      processor,
      notes: notes || ''
    });
    alert('状态已更新');
    loadOrders();
  };

  const isDelayed = (order) => {
    if (!order.delivery_date) return false;
    if (order.status === 'completed') return false;
    return new Date(order.delivery_date) < new Date();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>加工管理</h2>
      </div>

      <div className="tabs">
        {tabList.map(tab => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>商品</th>
              <th>状态</th>
              <th>交付日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ background: isDelayed(o) ? '#fff2f0' : '' }}>
                <td>
                  <Link to={`/orders/${o.id}`} style={{ color: '#1890ff' }}>
                    {o.order_no}
                  </Link>
                </td>
                <td>{o.customer_name}</td>
                <td>
                  {o.frame_price > 0 && <div>镜架 ¥{o.frame_price}</div>}
                  {o.lens_price > 0 && <div>镜片 ¥{o.lens_price}</div>}
                </td>
                <td>
                  <span className={`badge ${statusMap[o.status]?.badge || 'badge-info'}`}>
                    {statusMap[o.status]?.label || o.status}
                  </span>
                  {isDelayed(o) && <span className="badge badge-error" style={{ marginLeft: 8 }}>已延期</span>}
                </td>
                <td>
                  {o.delivery_date?.split('T')[0] || '-'}
                </td>
                <td>
                  {statusMap[o.status]?.next && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => updateStatus(o.id, statusMap[o.status].next)}
                    >
                      {statusMap[o.status].nextLabel}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无订单
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">加工流程说明</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['已下单', '镜片到货', '加工中', '质检中', '待取镜', '已完成'].map((step, i) => (
            <React.Fragment key={step}>
              <span className="badge badge-primary">{step}</span>
              {i < 5 && <span>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Processing;
