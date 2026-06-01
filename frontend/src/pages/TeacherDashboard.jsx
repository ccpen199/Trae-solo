import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feeItems, setFeeItems] = useState([]);
  const [reports, setReports] = useState({ feeItems: [] });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'students') {
        const res = await axios.get('/api/students');
        setStudents(res.data);
      } else if (activeTab === 'orders') {
        const res = await axios.get('/api/orders');
        setOrders(res.data);
      } else if (activeTab === 'fee-items') {
        const res = await axios.get('/api/fee-items?status=published');
        setFeeItems(res.data);
      } else if (activeTab === 'reports') {
        const res = await axios.get('/api/reports/summary');
        setReports(res.data);
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: '草稿', published: '已发布', pending: '待审核',
      paid: '已缴费', unpaid: '未缴费', refunded: '已退款',
      partial_refunded: '部分退款'
    };
    return labels[status] || status;
  };

  const getUnpaidStudents = () => {
    return orders.filter(o => o.status === 'unpaid');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>校园缴费系统 - 班主任工作台</h1>
        <div className="user-info">
          <span>欢迎，{user.name}</span>
          <button className="btn btn-default" onClick={onLogout}>退出</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="tabs">
          <button className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>学生名单</button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>缴费情况</button>
          <button className={`tab ${activeTab === 'fee-items' ? 'active' : ''}`} onClick={() => setActiveTab('fee-items')}>收费项目</button>
          <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>班级统计</button>
        </div>

        {activeTab === 'students' && (
          <div className="card">
            <h3>学生名单</h3>
            <table>
              <thead>
                <tr>
                  <th>学号</th><th>姓名</th><th>年级</th><th>班级</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.student_no}</td>
                    <td>{s.name}</td>
                    <td>{s.grade}</td>
                    <td>{s.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className="card" style={{ background: '#fff7e6' }}>
              <h3 style={{ color: '#fa8c16' }}>⚠️ 催缴提醒 - 未缴费学生 ({getUnpaidStudents().length}人)</h3>
              <table>
                <thead>
                  <tr>
                    <th>学生</th><th>收费项目</th><th>应缴金额</th><th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {getUnpaidStudents().map(order => (
                    <tr key={order.id}>
                      <td>{order.student_name}</td>
                      <td>{order.fee_item_name}</td>
                      <td>¥{order.final_amount}</td>
                      <td><span className={`status-badge status-${order.status}`}>{getStatusLabel(order.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>全部缴费订单</h3>
              <table>
                <thead>
                  <tr>
                    <th>订单号</th><th>学生</th><th>收费项目</th><th>年级班级</th><th>应缴金额</th><th>实缴金额</th><th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.order_no}</td>
                      <td>{order.student_name}</td>
                      <td>{order.fee_item_name}</td>
                      <td>{order.grade}{order.class}</td>
                      <td>¥{order.final_amount}</td>
                      <td>¥{order.paid_amount || 0}</td>
                      <td><span className={`status-badge status-${order.status}`}>{getStatusLabel(order.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fee-items' && (
          <div className="card">
            <h3>收费项目列表</h3>
            <table>
              <thead>
                <tr>
                  <th>项目名称</th><th>年级</th><th>金额</th><th>截止日期</th><th>说明</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.grade}{item.class}</td>
                    <td>¥{item.amount}</td>
                    <td>{item.due_date}</td>
                    <td>{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="label">学生总数</div>
                <div className="value">{students.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">收费项目</div>
                <div className="value">{feeItems.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">已缴费订单</div>
                <div className="value">{orders.filter(o => o.status === 'paid').length}</div>
              </div>
              <div className="stat-card">
                <div className="label">未缴费订单</div>
                <div className="value">{orders.filter(o => o.status === 'unpaid').length}</div>
              </div>
            </div>

            <div className="card">
              <h3>缴费统计</h3>
              <table>
                <thead>
                  <tr>
                    <th>收费项目</th><th>总人数</th><th>已缴费</th><th>未缴费</th><th>已退款</th><th>应缴总额</th><th>实缴总额</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.feeItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
