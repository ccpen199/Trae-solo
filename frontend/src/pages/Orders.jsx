import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ORDER_STATUS_MAP = {
  pending: '待支付',
  parking: '停车中',
  charging: '充电中',
  completed: '已完成',
  paid: '已支付',
  cancelled: '已取消',
  active: '进行中'
};

const PAYMENT_METHOD_MAP = {
  wechat: '微信支付',
  alipay: '支付宝',
  balance: '余额支付',
  unionpay: '银联支付'
};

function Orders() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [combinedOrders, setCombinedOrders] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === 'combined') {
        const res = await api.getCombinedOrders();
        setCombinedOrders(res.data.data);
      } else {
        const res = await api.getOrders({ type: activeTab });
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusName = (status) => ORDER_STATUS_MAP[status] || status;
  const getPaymentName = (method) => PAYMENT_METHOD_MAP[method] || method || '-';

  const getStatusClass = (status) => {
    const map = {
      pending: 'status-pending',
      parking: 'status-available',
      charging: 'status-available',
      completed: 'status-paid',
      paid: 'status-paid',
      cancelled: 'status-offline',
      active: 'status-available'
    };
    return map[status] || 'status-pending';
  };

  return (
    <div>
      <div className="page-header">
        <h1>订单管理</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>全部订单</div>
        <div className={`tab ${activeTab === 'parking' ? 'active' : ''}`} onClick={() => setActiveTab('parking')}>停车订单</div>
        <div className={`tab ${activeTab === 'charging' ? 'active' : ''}`} onClick={() => setActiveTab('charging')}>充电订单</div>
        <div className={`tab ${activeTab === 'combined' ? 'active' : ''}`} onClick={() => setActiveTab('combined')}>合并订单</div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'combined' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>车牌号</th>
                  <th>停车费</th>
                  <th>充电费</th>
                  <th>总金额</th>
                  <th>优惠</th>
                  <th>实付</th>
                  <th>支付方式</th>
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {combinedOrders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr onClick={() => setExpandedRow(expandedRow === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
                      <td>{o.order_no}</td>
                      <td>{o.user_name || '-'}</td>
                      <td>{o.plate_number || '-'}</td>
                      <td>¥{(o.parking_amount || 0).toFixed(2)}</td>
                      <td>¥{(o.charging_amount || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold' }}>¥{(o.total_amount || 0).toFixed(2)}</td>
                      <td style={{ color: '#52c41a' }}>-¥{(o.total_discount || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold', color: '#1890ff' }}>¥{(o.actual_amount || 0).toFixed(2)}</td>
                      <td>{getPaymentName(o.payment_method)}</td>
                      <td><span className={`status-badge ${getStatusClass(o.status)}`}>{getStatusName(o.status)}</span></td>
                      <td>{o.created_at}</td>
                    </tr>
                    {expandedRow === o.id && (
                      <tr>
                        <td colSpan="11" style={{ background: '#fafafa', padding: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '8px' }}>
                              <h4 style={{ marginBottom: '8px' }}>🅿️ 停车费明细</h4>
                              <p>停车费：¥{(o.parking_amount || 0).toFixed(2)}</p>
                              <p>时长：{o.parking_duration || '-'}分钟</p>
                            </div>
                            <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '8px' }}>
                              <h4 style={{ marginBottom: '8px' }}>⚡ 充电费明细</h4>
                              <p>充电费：¥{(o.charging_amount || 0).toFixed(2)}</p>
                              <p>充电量：{o.charging_energy || '-'}度</p>
                            </div>
                            <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '8px' }}>
                              <h4 style={{ marginBottom: '8px' }}>💰 优惠明细</h4>
                              <p>减免金额：¥{(o.total_discount || 0).toFixed(2)}</p>
                              <p>超时占位费：¥{(o.overtime_fee || 0).toFixed(2)}</p>
                              <p>会员权益：{o.member_benefit || '无'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {combinedOrders.length === 0 && (
                  <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无合并订单</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>类型</th>
                  <th>场站</th>
                  <th>车位/枪号</th>
                  <th>车牌号</th>
                  <th>时长</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_no}</td>
                    <td>
                      <span className="badge badge-primary">
                        {o.order_type === 'parking' ? '停车' : '充电'}
                      </span>
                    </td>
                    <td>{o.station_name}</td>
                    <td>{o.spot_number || o.gun_number}</td>
                    <td>{o.plate_number || '-'}</td>
                    <td>{o.duration ? o.duration + '分钟' : '-'}</td>
                    <td>¥{(o.amount || 0).toFixed(2)}</td>
                    <td><span className={`status-badge ${getStatusClass(o.status)}`}>{getStatusName(o.status)}</span></td>
                    <td>{o.created_at}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
