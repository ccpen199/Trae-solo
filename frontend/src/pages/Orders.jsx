import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

function Orders({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [activeTab, currentUser]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let params = {};
      
      if (currentUser.role === 'consumer') {
        params.consumerId = currentUser.id;
      } else if (currentUser.role === 'guide') {
        params.responsiblePerson = currentUser.id;
      }
      
      const response = await api.getOrders(params);
      if (response.success) {
        let filteredOrders = response.data;
        
        if (activeTab !== 'all') {
          if (activeTab === 'pending') {
            filteredOrders = filteredOrders.filter(o => 
              ['camera_opened', 'pending_recognition', 'recognition_in_progress', 'recognition_completed', 
               'pending_tryon', 'tryon_in_progress', 'tryon_completed', 'shared'].includes(o.status)
            );
          } else if (activeTab === 'approval') {
            filteredOrders = filteredOrders.filter(o => o.status === 'pending_approval');
          } else if (activeTab === 'completed') {
            filteredOrders = filteredOrders.filter(o => 
              ['order_placed', 'paid', 'shipped', 'completed'].includes(o.status)
            );
          } else if (activeTab === 'cancelled') {
            filteredOrders = filteredOrders.filter(o => 
              ['cancelled', 'rejected', 'reversed'].includes(o.status)
            );
          }
        }
        
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: '全部订单' },
    { key: 'pending', label: '进行中' },
    { key: 'approval', label: '待审批' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' }
  ];

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>订单管理</h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/tryon')}
        >
          + 新建试穿订单
        </button>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {orders.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>消费者</th>
                <th>状态</th>
                <th>金额</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500 }}>{order.order_no}</td>
                  <td>{order.consumer_name || '-'}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {order.total_amount > 0 ? `¥${order.total_amount}` : '-'}
                  </td>
                  <td style={{ fontSize: 13, color: '#999' }}>
                    {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
                  </td>
                  <td>
                    <button
                      className="btn btn-default"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">
          暂无订单数据
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    camera_opened: '摄像头已打开',
    pending_recognition: '待识别',
    recognition_in_progress: '识别中',
    recognition_completed: '识别完成',
    pending_tryon: '待试穿',
    tryon_in_progress: '试穿中',
    tryon_completed: '试穿完成',
    shared: '已分享',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    order_placed: '已下单',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    reversed: '已逆向'
  };
  return labels[status] || status;
}

export default Orders;
