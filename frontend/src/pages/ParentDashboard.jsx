import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ParentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [children, setChildren] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [feeItems, setFeeItems] = useState([]);

  const [newDiscount, setNewDiscount] = useState({
    fee_item_id: '', student_id: '', reason: '', proof_material: '', amount: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const studentsRes = await axios.get('/api/students');
      const myChildren = studentsRes.data.filter(s => s.parent_id === user.id);
      setChildren(myChildren);

      if (activeTab === 'orders') {
        const res = await axios.get(`/api/orders?parent_id=${user.id}`);
        setOrders(res.data);
      } else if (activeTab === 'discounts') {
        const res = await axios.get('/api/discounts');
        setDiscounts(res.data.filter(d => myChildren.some(c => c.id === d.student_id)));
        const feeRes = await axios.get('/api/fee-items?status=published');
        setFeeItems(feeRes.data);
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const payOrder = async (orderId) => {
    try {
      await axios.post(`/api/orders/${orderId}/pay`, { channel: 'alipay' });
      alert('支付成功！');
      loadData();
    } catch (err) {
      alert('支付失败');
    }
  };

  const applyDiscount = async () => {
    if (!newDiscount.fee_item_id) {
      alert('请选择收费项目');
      return;
    }
    if (!newDiscount.student_id) {
      alert('请选择学生');
      return;
    }
    if (!newDiscount.amount || parseFloat(newDiscount.amount) <= 0) {
      alert('请输入有效的减免金额');
      return;
    }
    if (!newDiscount.reason) {
      alert('请填写减免原因');
      return;
    }
    try {
      await axios.post('/api/discounts', { ...newDiscount, applicant_id: user.id });
      setShowDiscountForm(false);
      setNewDiscount({ fee_item_id: '', student_id: '', reason: '', proof_material: '', amount: '' });
      loadData();
    } catch (err) {
      alert('申请失败');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      paid: '已缴费', unpaid: '未缴费', refunded: '已退款',
      partial_refunded: '部分退款', pending: '待审核',
      approved: '已通过', rejected: '已拒绝'
    };
    return labels[status] || status;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>校园缴费系统 - 家长中心</h1>
        <div className="user-info">
          <span>欢迎，{user.name}</span>
          <button className="btn btn-default" onClick={onLogout}>退出</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="tabs">
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>我的订单</button>
          <button className={`tab ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => setActiveTab('discounts')}>减免申请</button>
        </div>

        {activeTab === 'orders' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="label">孩子人数</div>
                <div className="value">{children.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">待缴费</div>
                <div className="value">{orders.filter(o => o.status === 'unpaid').length}</div>
              </div>
              <div className="stat-card">
                <div className="label">已缴费</div>
                <div className="value">{orders.filter(o => o.status === 'paid').length}</div>
              </div>
              <div className="stat-card">
                <div className="label">累计已缴</div>
                <div className="value">¥{orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.paid_amount), 0)}</div>
              </div>
            </div>

            <div className="card">
              <h3>缴费订单</h3>
              <table>
                <thead>
                  <tr>
                    <th>订单号</th><th>收费项目</th><th>学生</th><th>原价</th><th>减免</th><th>应缴</th><th>实缴</th><th>状态</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.order_no}</td>
                      <td>{order.fee_item_name}</td>
                      <td>{order.student_name}</td>
                      <td>¥{order.original_amount}</td>
                      <td>¥{order.discount_amount || 0}</td>
                      <td>¥{order.final_amount}</td>
                      <td>¥{order.paid_amount || 0}</td>
                      <td><span className={`status-badge status-${order.status}`}>{getStatusLabel(order.status)}</span></td>
                      <td>
                        {order.status === 'unpaid' && (
                          <button className="btn btn-success" onClick={() => payOrder(order.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>立即缴费</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => setShowDiscountForm(true)} style={{ width: 'auto' }}>+ 申请减免</button>
            </div>

            {showDiscountForm && (
              <div className="card">
                <h3>减免申请</h3>
                <div className="form-row">
                  <div className="form-group-full">
                    <label>收费项目</label>
                    <select value={newDiscount.fee_item_id} onChange={(e) => setNewDiscount({...newDiscount, fee_item_id: e.target.value})}>
                      <option value="">请选择</option>
                      {feeItems.filter(f => f.status === 'published').map(item => (
                        <option key={item.id} value={item.id}>{item.name} - ¥{item.amount}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-full">
                    <label>学生</label>
                    <select value={newDiscount.student_id} onChange={(e) => setNewDiscount({...newDiscount, student_id: e.target.value})}>
                      <option value="">请选择</option>
                      {children.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group-full">
                    <label>减免金额</label>
                    <input type="number" value={newDiscount.amount} onChange={(e) => setNewDiscount({...newDiscount, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="form-group-full">
                    <label>证明材料</label>
                    <input value={newDiscount.proof_material} onChange={(e) => setNewDiscount({...newDiscount, proof_material: e.target.value})} placeholder="材料说明" />
                  </div>
                </div>
                <div className="form-group-full">
                  <label>减免原因</label>
                  <textarea value={newDiscount.reason} onChange={(e) => setNewDiscount({...newDiscount, reason: e.target.value})} placeholder="请说明减免原因..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={applyDiscount} style={{ width: 'auto' }}>提交申请</button>
                  <button className="btn btn-default" onClick={() => setShowDiscountForm(false)} style={{ width: 'auto' }}>取消</button>
                </div>
              </div>
            )}

            <div className="card">
              <h3>我的减免申请</h3>
              <table>
                <thead>
                  <tr>
                    <th>收费项目</th><th>学生</th><th>减免金额</th><th>原因</th><th>状态</th><th>审批人</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map(d => (
                    <tr key={d.id}>
                      <td>{d.fee_item_name}</td>
                      <td>{d.student_name}</td>
                      <td>¥{parseFloat(d.amount) || 0}</td>
                      <td>{d.reason}</td>
                      <td><span className={`status-badge status-${d.status}`}>{getStatusLabel(d.status)}</span></td>
                      <td>{d.approver_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentDashboard;
