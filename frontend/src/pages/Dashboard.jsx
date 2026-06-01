import React, { useState, useEffect } from 'react';
import { customersAPI, progressAPI, todosAPI, materialsAPI } from '../api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    pendingMaterials: 0,
    completedCases: 0
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentTodos, setRecentTodos] = useState([]);
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, progressRes, todosRes, materialsRes] = await Promise.all([
        customersAPI.getAll({ page: 1, pageSize: 10 }),
        progressAPI.getStats(),
        todosAPI.getAll({ status: 'pending' }),
        materialsAPI.getAll({ status: 'submitted' })
      ]);

      const customers = customersRes.data.data || [];
      setRecentCustomers(customers);
      setRecentTodos(todosRes.data.slice(0, 5));
      setPendingMaterials(materialsRes.data.slice(0, 5));
      
      setStats({
        totalCustomers: customersRes.data.total || customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        pendingMaterials: (materialsRes.data || []).length,
        completedCases: customers.filter(c => c.status === 'closed').length
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  const getProblemTypeText = (type) => {
    const map = {
      overdue: '逾期记录',
      misinformation: '信息不实',
      unauthorized: '非本人操作',
      other: '其他'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>正在加载数据...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="value">{stats.totalCustomers}</div>
          <div className="label">客户总数</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#17a2b8' }}>{stats.activeCustomers}</div>
          <div className="label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#ffc107' }}>{stats.pendingMaterials}</div>
          <div className="label">待审核材料</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#28a745' }}>{stats.completedCases}</div>
          <div className="label">已结案</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3>最新客户</h3>
          {recentCustomers.length === 0 ? (
            <div className="empty-state">暂无客户数据</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>客户编号</th>
                  <th>姓名</th>
                  <th>问题类型</th>
                  <th>涉及机构</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map(c => (
                  <tr key={c.id}>
                    <td>{c.customer_no}</td>
                    <td>{c.name}</td>
                    <td>{getProblemTypeText(c.credit_problem_type)}</td>
                    <td>{c.involved_institutions || '-'}</td>
                    <td>
                      <span className={`status-badge ${c.status === 'active' ? 'status-processing' : 'status-active'}`}>
                        {c.status === 'active' ? '进行中' : '已结案'}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>待办事项</h3>
          {recentTodos.length === 0 ? (
            <div className="empty-state">暂无待办事项</div>
          ) : (
            <div>
              {recentTodos.map(todo => (
                <div key={todo.id} style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #eee',
                  background: todo.type === 'followup' ? '#fff8e1' : '#fafafa'
                }}>
                  <div style={{ fontWeight: 500 }}>{todo.title}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                    {todo.customer_name && `${todo.customer_name} - `}
                    {todo.type === 'followup' ? '跟进提醒' : todo.type === 'material' ? '材料补正' : todo.type === 'rejected' ? '异议驳回处理' : '其他'}
                  </div>
                  {todo.due_date && (
                    <div style={{ fontSize: '11px', color: '#dc3545', marginTop: 2 }}>
                      截止: {new Date(todo.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>待审核材料</h3>
        {pendingMaterials.length === 0 ? (
          <div className="empty-state">暂无待审核材料</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>客户编号</th>
                <th>客户姓名</th>
                <th>材料类型</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {pendingMaterials.map(m => (
                <tr key={m.id}>
                  <td>{m.customer_no || '-'}</td>
                  <td>{m.customer_name || '-'}</td>
                  <td>{m.material_name}</td>
                  <td>{m.submitted_at ? new Date(m.submitted_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
