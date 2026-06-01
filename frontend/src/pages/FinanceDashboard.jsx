import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FinanceDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('fee-items');
  const [feeItems, setFeeItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [reports, setReports] = useState({ feeItems: [] });
  const [classReports, setClassReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  const [newFeeItem, setNewFeeItem] = useState({
    name: '', description: '', amount: '', grade: '一年级', class: '', due_date: ''
  });
  const [newDiscount, setNewDiscount] = useState({
    fee_item_id: '', student_id: '', reason: '', proof_material: '', amount: ''
  });
  const [newRefund, setNewRefund] = useState({
    order_id: '', amount: '', reason: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'fee-items') {
        const res = await axios.get('/api/fee-items');
        setFeeItems(res.data);
      } else if (activeTab === 'orders') {
        const res = await axios.get('/api/orders');
        setOrders(res.data);
      } else if (activeTab === 'discounts') {
        const res = await axios.get('/api/discounts');
        setDiscounts(res.data);
        const [studentsRes, feeRes] = await Promise.all([
          axios.get('/api/students'),
          axios.get('/api/fee-items?status=published')
        ]);
        setStudents(studentsRes.data);
        setFeeItems(feeRes.data);
      } else if (activeTab === 'refunds') {
        const res = await axios.get('/api/refunds');
        setRefunds(res.data);
        const ordersRes = await axios.get('/api/orders?status=paid');
        setOrders(ordersRes.data);
      } else if (activeTab === 'reports') {
        const [summaryRes, classRes] = await Promise.all([
          axios.get('/api/reports/summary'),
          axios.get('/api/reports/class-summary')
        ]);
        setReports(summaryRes.data);
        setClassReports(classRes.data);
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const createFeeItem = async () => {
    try {
      await axios.post('/api/fee-items', { ...newFeeItem, created_by: user.id });
      setShowFeeForm(false);
      setNewFeeItem({ name: '', description: '', amount: '', grade: '一年级', class: '', due_date: '' });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  const reviewFeeItem = async (id, status) => {
    try {
      await axios.post(`/api/fee-items/${id}/review`, { reviewed_by: user.id, status });
      loadData();
    } catch (err) {
      alert('审核失败');
    }
  };

  const createDiscount = async () => {
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

  const approveDiscount = async (id, status) => {
    try {
      await axios.post(`/api/discounts/${id}/approve`, { approver_id: user.id, status });
      loadData();
    } catch (err) {
      alert('审批失败');
    }
  };

  const createRefund = async () => {
    try {
      await axios.post('/api/refunds', { ...newRefund, applicant_id: user.id });
      setShowRefundForm(false);
      setNewRefund({ order_id: '', amount: '', reason: '' });
      loadData();
    } catch (err) {
      alert('申请失败');
    }
  };

  const approveRefund = async (id, status) => {
    try {
      await axios.post(`/api/refunds/${id}/approve`, { approver_id: user.id, status });
      loadData();
    } catch (err) {
      alert('审批失败');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: '草稿', published: '已发布', pending: '待审核',
      paid: '已缴费', unpaid: '未缴费', refunded: '已退款',
      partial_refunded: '部分退款', approved: '已通过', rejected: '已拒绝'
    };
    return labels[status] || status;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>校园缴费系统 - 财务工作台</h1>
        <div className="user-info">
          <span>欢迎，{user.name}</span>
          <button className="btn btn-default" onClick={onLogout}>退出</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="tabs">
          <button className={`tab ${activeTab === 'fee-items' ? 'active' : ''}`} onClick={() => setActiveTab('fee-items')}>收费项目</button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>缴费订单</button>
          <button className={`tab ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => setActiveTab('discounts')}>减免申请</button>
          <button className={`tab ${activeTab === 'refunds' ? 'active' : ''}`} onClick={() => setActiveTab('refunds')}>退款管理</button>
          <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>对账报表</button>
        </div>

        {activeTab === 'fee-items' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => setShowFeeForm(true)} style={{ width: 'auto' }}>+ 新建收费项目</button>
            </div>

            {showFeeForm && (
              <div className="card">
                <h3>新建收费项目</h3>
                <div className="form-row">
                  <div className="form-group-full">
                    <label>项目名称</label>
                    <input value={newFeeItem.name} onChange={(e) => setNewFeeItem({...newFeeItem, name: e.target.value})} placeholder="如：2024年春季学费" />
                  </div>
                  <div className="form-group-full">
                    <label>金额（元）</label>
                    <input type="number" value={newFeeItem.amount} onChange={(e) => setNewFeeItem({...newFeeItem, amount: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group-full">
                    <label>适用年级</label>
                    <select value={newFeeItem.grade} onChange={(e) => setNewFeeItem({...newFeeItem, grade: e.target.value})}>
                      <option>一年级</option><option>二年级</option><option>三年级</option>
                      <option>四年级</option><option>五年级</option><option>六年级</option>
                    </select>
                  </div>
                  <div className="form-group-full">
                    <label>班级（可选）</label>
                    <input value={newFeeItem.class} onChange={(e) => setNewFeeItem({...newFeeItem, class: e.target.value})} placeholder="如：1班" />
                  </div>
                  <div className="form-group-full">
                    <label>缴费截止日期</label>
                    <input type="date" value={newFeeItem.due_date} onChange={(e) => setNewFeeItem({...newFeeItem, due_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group-full">
                  <label>收费说明</label>
                  <textarea value={newFeeItem.description} onChange={(e) => setNewFeeItem({...newFeeItem, description: e.target.value})} placeholder="请输入收费说明..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={createFeeItem} style={{ width: 'auto' }}>保存草稿</button>
                  <button className="btn btn-default" onClick={() => setShowFeeForm(false)} style={{ width: 'auto' }}>取消</button>
                </div>
              </div>
            )}

            <div className="card">
              <h3>收费项目列表</h3>
              <table>
                <thead>
                  <tr>
                    <th>项目名称</th><th>年级</th><th>金额</th><th>截止日期</th><th>创建人</th><th>状态</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.grade}{item.class}</td>
                      <td>¥{item.amount}</td>
                      <td>{item.due_date}</td>
                      <td>{item.creator_name}</td>
                      <td><span className={`status-badge status-${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      <td>
                        {item.status === 'draft' && (
                          <div className="action-buttons">
                            <button className="btn btn-success" onClick={() => reviewFeeItem(item.id, 'published')} style={{ padding: '6px 12px', fontSize: '12px' }}>审核发布</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <h3>缴费订单列表</h3>
            <table>
              <thead>
                <tr>
                  <th>订单号</th><th>收费项目</th><th>学生</th><th>年级班级</th><th>应缴金额</th><th>实缴金额</th><th>状态</th><th>支付时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_no}</td>
                    <td>{order.fee_item_name}</td>
                    <td>{order.student_name}</td>
                    <td>{order.grade}{order.class}</td>
                    <td>¥{order.final_amount}</td>
                    <td>¥{order.paid_amount || 0}</td>
                    <td><span className={`status-badge status-${order.status}`}>{getStatusLabel(order.status)}</span></td>
                    <td>{order.paid_at || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>
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
                    <input value={newDiscount.proof_material} onChange={(e) => setNewDiscount({...newDiscount, proof_material: e.target.value})} placeholder="材料编号或链接" />
                  </div>
                </div>
                <div className="form-group-full">
                  <label>减免原因</label>
                  <textarea value={newDiscount.reason} onChange={(e) => setNewDiscount({...newDiscount, reason: e.target.value})} placeholder="请说明减免原因..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={createDiscount} style={{ width: 'auto' }}>提交申请</button>
                  <button className="btn btn-default" onClick={() => setShowDiscountForm(false)} style={{ width: 'auto' }}>取消</button>
                </div>
              </div>
            )}

            <div className="card">
              <h3>减免申请列表</h3>
              <table>
                <thead>
                  <tr>
                    <th>收费项目</th><th>学生</th><th>减免金额</th><th>原因</th><th>申请人</th><th>状态</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map(d => (
                    <tr key={d.id}>
                      <td>{d.fee_item_name}</td>
                      <td>{d.student_name}</td>
                      <td>¥{parseFloat(d.amount) || 0}</td>
                      <td>{d.reason}</td>
                      <td>{d.applicant_name}</td>
                      <td><span className={`status-badge status-${d.status}`}>{getStatusLabel(d.status)}</span></td>
                      <td>
                        {d.status === 'pending' && (
                          <div className="action-buttons">
                            <button className="btn btn-success" onClick={() => approveDiscount(d.id, 'approved')} style={{ padding: '6px 12px', fontSize: '12px' }}>通过</button>
                            <button className="btn btn-danger" onClick={() => approveDiscount(d.id, 'rejected')} style={{ padding: '6px 12px', fontSize: '12px' }}>拒绝</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => setShowRefundForm(true)} style={{ width: 'auto' }}>+ 申请退款</button>
            </div>

            {showRefundForm && (
              <div className="card">
                <h3>退款申请</h3>
                <div className="form-row">
                  <div className="form-group-full">
                    <label>订单</label>
                    <select value={newRefund.order_id} onChange={(e) => setNewRefund({...newRefund, order_id: e.target.value})}>
                      <option value="">请选择订单</option>
                      {orders.filter(o => o.status === 'paid').map(o => (
                        <option key={o.id} value={o.id}>{o.order_no} - {o.student_name} - ¥{o.paid_amount}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-full">
                    <label>退款金额</label>
                    <input type="number" value={newRefund.amount} onChange={(e) => setNewRefund({...newRefund, amount: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group-full">
                  <label>退款原因</label>
                  <textarea value={newRefund.reason} onChange={(e) => setNewRefund({...newRefund, reason: e.target.value})} placeholder="请说明退款原因..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={createRefund} style={{ width: 'auto' }}>提交申请</button>
                  <button className="btn btn-default" onClick={() => setShowRefundForm(false)} style={{ width: 'auto' }}>取消</button>
                </div>
              </div>
            )}

            <div className="card">
              <h3>退款申请列表</h3>
              <table>
                <thead>
                  <tr>
                    <th>订单号</th><th>学生</th><th>收费项目</th><th>退款金额</th><th>原因</th><th>申请人</th><th>状态</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => (
                    <tr key={r.id}>
                      <td>{r.order_no}</td>
                      <td>{r.student_name}</td>
                      <td>{r.fee_item_name}</td>
                      <td>¥{r.amount}</td>
                      <td>{r.reason}</td>
                      <td>{r.applicant_name}</td>
                      <td><span className={`status-badge status-${r.status}`}>{getStatusLabel(r.status)}</span></td>
                      <td>
                        {r.status === 'pending' && (
                          <div className="action-buttons">
                            <button className="btn btn-success" onClick={() => approveRefund(r.id, 'approved')} style={{ padding: '6px 12px', fontSize: '12px' }}>通过</button>
                            <button className="btn btn-danger" onClick={() => approveRefund(r.id, 'rejected')} style={{ padding: '6px 12px', fontSize: '12px' }}>拒绝</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="card">
              <h3>按收费项目统计</h3>
              <table>
                <thead>
                  <tr>
                    <th>收费项目</th><th>年级</th><th>总人数</th><th>已缴费</th><th>未缴费</th><th>已退款</th><th>应缴总额</th><th>实缴总额</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.feeItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.grade}</td>
                      <td>{item.total_orders}</td>
                      <td>{item.paid_count}</td>
                      <td>{item.unpaid_count}</td>
                      <td>{item.refund_count}</td>
                      <td>¥{item.total_amount || 0}</td>
                      <td>¥{item.paid_amount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>按班级统计</h3>
              <table>
                <thead>
                  <tr>
                    <th>年级</th><th>班级</th><th>学生数</th><th>总订单数</th><th>已缴费</th><th>未缴费</th><th>应缴总额</th><th>实缴总额</th>
                  </tr>
                </thead>
                <tbody>
                  {classReports.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.grade}</td>
                      <td>{c.class}</td>
                      <td>{c.student_count}</td>
                      <td>{c.total_orders}</td>
                      <td>{c.paid_count}</td>
                      <td>{c.unpaid_count}</td>
                      <td>¥{c.total_amount || 0}</td>
                      <td>¥{c.paid_amount || 0}</td>
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

export default FinanceDashboard;
