import React, { useState, useEffect } from 'react';
import { getAuditPlans, getReports, getSuppliers } from '../api.js';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    totalReports: 0,
    totalSuppliers: 0
  });
  const [recentPlans, setRecentPlans] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, reportsRes, suppliersRes] = await Promise.all([
        getAuditPlans(),
        getReports(),
        getSuppliers()
      ]);
      
      const plans = plansRes.data;
      const completed = plans.filter(p => p.status === 'completed').length;
      
      setStats({
        totalPlans: plans.length,
        completedPlans: completed,
        totalReports: reportsRes.data.length,
        totalSuppliers: suppliersRes.data.length
      });
      
      setRecentPlans(plans.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      scheduled: { text: '已排期', class: 'tag-info' },
      in_progress: { text: '进行中', class: 'tag-warning' },
      completed: { text: '已完成', class: 'tag-success' },
      cancelled: { text: '已取消', class: 'tag-default' }
    };
    const s = statusMap[status] || statusMap.scheduled;
    return <span className={`tag ${s.class}`}>{s.text}</span>;
  };

  return (
    <div>
      <h2 className="page-title">数据概览</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1890ff' }}>{stats.totalPlans}</div>
          <div className="stat-label">验厂计划总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats.completedPlans}</div>
          <div className="stat-label">已完成验厂</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#722ed1' }}>{stats.totalReports}</div>
          <div className="stat-label">生成报告数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#fa8c16' }}>{stats.totalSuppliers}</div>
          <div className="stat-label">合作供应商</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>最近验厂计划</h3>
        <table className="table">
          <thead>
            <tr>
              <th>供应商</th>
              <th>工厂</th>
              <th>审核类型</th>
              <th>审核员</th>
              <th>审核日期</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {recentPlans.map(plan => (
              <tr key={plan.id}>
                <td>{plan.supplier_name}</td>
                <td>{plan.factory_name}</td>
                <td>{plan.audit_type}</td>
                <td>{plan.auditor_name}</td>
                <td>{plan.audit_date}</td>
                <td>{getStatusTag(plan.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
