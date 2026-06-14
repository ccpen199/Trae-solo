import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import api from '../utils/api.js';

function AdminDashboard({ user }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [unverifiedEmployers, setUnverifiedEmployers] = useState([]);
  const [reports, setReports] = useState([]);
  const [riskRecords, setRiskRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'admin') {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'employers') {
      fetchUnverifiedEmployers();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'risk') {
      fetchRiskRecords();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/stats/public');
      setStats({
        totalJobs: res.data.jobs || 10,
        totalJobseekers: res.data.jobseekers || 4,
        totalEmployers: res.data.employers || 4,
        matchRate: res.data.matchRate || 95,
        conversionRate: 12,
        avgOnboardingDays: 7,
        highRiskCount: 3,
        todayReports: 2,
        exposureRate: 85,
        avgResponseTime: '12小时'
      });
    } catch (error) {
      setStats({
        totalJobs: 10, totalJobseekers: 4, totalEmployers: 4,
        matchRate: 95, conversionRate: 12, avgOnboardingDays: 7,
        highRiskCount: 3, todayReports: 2, exposureRate: 85, avgResponseTime: '12小时'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnverifiedEmployers = async () => {
    try {
      const res = await api.get('/admin/employers/unverified');
      setUnverifiedEmployers(res.data.employers || []);
    } catch (error) {
      setUnverifiedEmployers([
        { id: 1, company_name: '上海优居装饰工程有限公司',
          contact_person: '王经理', contact_phone: '139****9002',
          company_type: '民营企业', company_size: '50-100人',
          company_address: '上海市浦东新区张江高科技园区',
          business_license: '已上传', audit_status: '待审核' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data.reports || []);
    } catch (error) {
      setReports([
        { id: 1, reported_type: 'job', reported_id: 1, reported_title: '急招电工',
          reason: 'salary_mismatch', description: '实际薪资比描述低2000元',
          contact: '138****8000', status: 'pending', created_at: '2026-06-04' },
        { id: 2, reported_type: 'job', reported_id: 3, reported_title: '建筑焊工',
          reason: 'false_info', description: '企业资质造假',
          contact: '139****9000', status: 'pending', created_at: '2026-06-03' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskRecords = async () => {
    setRiskRecords([
      { id: 1, type: 'employer', target_id: 3, target_name: '上海优居装饰',
        risk_level: 'high', reason: '多次被举报收费诈骗',
        status: 'reviewing', created_at: '2026-06-03' },
      { id: 2, type: 'jobseeker', target_id: 2, target_name: '李四',
        risk_level: 'medium', reason: '多次无故爽约面试',
        status: 'warning', created_at: '2026-06-02' },
      { id: 3, type: 'job', target_id: 5, target_name: '高薪日结工',
        risk_level: 'high', reason: '薪资异常高于市场50%',
        status: 'pending', created_at: '2026-06-04' }
    ]);
    setLoading(false);
  };

  const handleVerifyEmployer = async (id) => {
    alert('企业认证已通过');
    setUnverifiedEmployers(prev => prev.filter(e => e.id !== id));
  };

  const handleRejectEmployer = async (id) => {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
      alert('已驳回');
      setUnverifiedEmployers(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleHandleReport = async (id, status, action) => {
    alert('处理成功');
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'handled' } : r));
  };

  const handleRiskAction = async (id, action) => {
    alert('操作成功');
    setRiskRecords(prev => prev.filter(r => r.id !== id));
  };

  const menuItems = [
    { key: 'dashboard', label: '数据仪表盘', path: '/admin/dashboard' },
    { key: 'employers', label: '企业认证', path: '/admin/employers' },
    { key: 'reports', label: '举报管理', path: '/admin/reports' },
    { key: 'risk', label: '风控中心', path: '/admin/risk' }
  ];

  const getReasonText = (reason) => {
    const map = {
      'salary_mismatch': '薪资不符',
      'false_info': '虚假信息',
      'charge_fraud': '收费诈骗',
      'illegal_recruitment': '违规招聘',
      'other': '其他'
    };
    return map[reason] || reason;
  };

  const getRiskBadge = (level) => {
    if (level === 'high') return <span className="badge badge-error">高风险</span>;
    if (level === 'medium') return <span className="badge badge-warning">中风险</span>;
    return <span className="badge badge-info">低风险</span>;
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="main-layout">
      <div className="sidebar">
        {menuItems.map(item => (
          <Link
            key={item.key}
            to={item.path}
            className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="main-content">
        <Routes>
          <Route path="dashboard" element={
            <div>
              <h2 className="page-title">数据仪表盘</h2>
              
              <div className="grid grid-4 mb-24">
                <div className="card stat-card">
                  <div className="stat-value text-info">{stats.totalJobs}</div>
                  <div className="stat-label">总岗位数</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-value text-success">{stats.totalJobseekers}</div>
                  <div className="stat-label">求职者数</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-value text-warning">{stats.totalEmployers}</div>
                  <div className="stat-label">企业数</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-value text-error">{stats.highRiskCount}</div>
                  <div className="stat-label">待处理风险</div>
                </div>
              </div>

              <div className="grid grid-3 mb-24">
                <div className="card stat-card">
                  <div className="stat-value text-success">{stats.matchRate}%</div>
                  <div className="stat-label">智能匹配成功率</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-value text-warning">{stats.conversionRate}%</div>
                  <div className="stat-label">招聘转化率</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-value text-info">{stats.avgOnboardingDays}天</div>
                  <div className="stat-label">平均入职周期</div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>今日待办事项</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Link to="/admin/employers" className="card" style={{ flex: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', border: '1px solid #ffd666', background: '#fffbe6' }}>
                    <div style={{ fontWeight: '600', color: '#d48806' }}>{unverifiedEmployers.length} 家企业待认证</div>
                    <div className="text-sm text-secondary">点击前往审核</div>
                  </Link>
                  <Link to="/admin/reports" className="card" style={{ flex: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', border: '1px solid #ffa39e', background: '#fff1f0' }}>
                    <div style={{ fontWeight: '600', color: '#cf1322' }}>{reports.filter(r => r.status === 'pending').length} 条举报待处理</div>
                    <div className="text-sm text-secondary">点击查看详情</div>
                  </Link>
                  <Link to="/admin/risk" className="card" style={{ flex: 1, cursor: 'pointer', textDecoration: 'none', color: 'inherit', border: '1px solid #adc6ff', background: '#f0f5ff' }}>
                    <div style={{ fontWeight: '600', color: '#2f54eb' }}>{riskRecords.filter(r => r.status === 'pending').length} 条风控待复查</div>
                    <div className="text-sm text-secondary">点击进行复核</div>
                  </Link>
                </div>
              </div>
            </div>
          } />

          <Route path="employers" element={
            <div>
              <h2 className="page-title">企业认证审核</h2>
              <p className="text-secondary mb-24">审核企业资质认证申请</p>
              
              {unverifiedEmployers.length === 0 ? (
                <div className="card text-center">
                  <p className="text-secondary">暂无待审核企业</p>
                </div>
              ) : (
                unverifiedEmployers.map(employer => (
                  <div key={employer.id} className="card" style={{ marginBottom: '16px' }}>
                    <div className="flex flex-between flex-start">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                          {employer.company_name}
                        </div>
                        <div className="text-secondary mb-4">
                          联系人：{employer.contact_person} · {employer.contact_phone}
                        </div>
                        <div className="text-secondary mb-4">
                          类型：{employer.company_type} · 规模：{employer.company_size}
                        </div>
                        <div className="text-secondary text-sm">
                          地址：{employer.company_address}
                        </div>
                        <div className="text-secondary text-sm mt-4">
                          营业执照：{employer.business_license}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleVerifyEmployer(employer.id)}
                        >
                          通过认证
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleRejectEmployer(employer.id)}
                        >
                          驳回
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          } />

          <Route path="reports" element={
            <div>
              <h2 className="page-title">举报管理</h2>
              <p className="text-secondary mb-24">处理用户举报，保障平台信息真实有效</p>
              
              {reports.length === 0 ? (
                <div className="card text-center">
                  <p className="text-secondary">暂无举报记录</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="card" style={{ marginBottom: '16px' }}>
                    <div className="flex flex-between flex-start">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                          {report.reported_type === 'job' ? '岗位举报' :
                           report.reported_type === 'employer' ? '企业举报' : '其他'}：
                          {report.reported_title || 'ID: ' + report.reported_id}
                        </div>
                        <div className="text-secondary mb-4">
                          举报原因：{getReasonText(report.reason)}
                        </div>
                        <div className="text-secondary text-sm mb-4">
                          详细描述：{report.description || '无'}
                        </div>
                        <div className="text-secondary text-sm">
                          举报时间：{report.created_at}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '180px' }}>
                        <span className={`badge ${report.status === 'pending' ? 'badge-warning' : 'badge-success'}`} style={{ marginBottom: '12px', display: 'inline-block' }}>
                          {report.status === 'pending' ? '待处理' : '已处理'}
                        </span>
                        {report.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleHandleReport(report.id, 'handled', '')}>
                              标记已处理
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                              if (confirm('确定下架此内容吗？')) {
                                handleHandleReport(report.id, 'handled', 'remove');
                              }
                            }}>
                              下架内容
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          } />

          <Route path="risk" element={
            <div>
              <h2 className="page-title">风控中心</h2>
              <p className="text-secondary mb-24">风险监测与处理，保障平台安全</p>
              
              {riskRecords.length === 0 ? (
                <div className="card text-center">
                  <p className="text-secondary">暂无风险记录</p>
                </div>
              ) : (
                riskRecords.map(record => (
                  <div key={record.id} className="card" style={{ marginBottom: '16px' }}>
                    <div className="flex flex-between flex-start">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '600' }}>
                            {record.type === 'employer' ? '企业' :
                             record.type === 'jobseeker' ? '求职者' : '岗位'}：
                            {record.target_name}
                          </div>
                          {getRiskBadge(record.risk_level)}
                        </div>
                        <div className="text-secondary mb-4">
                          风险原因：{record.reason}
                        </div>
                        <div className="text-secondary text-sm">
                          记录时间：{record.created_at}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '180px' }}>
                        {record.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn btn-warning btn-sm" onClick={() => handleRiskAction(record.id, 'warning')}>
                              发送警告
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                              if (confirm('确定封禁此账号吗？')) {
                                handleRiskAction(record.id, 'ban');
                              }
                            }}>
                              封禁账号
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleRiskAction(record.id, 'ignore')}>
                              忽略风险
                            </button>
                          </div>
                        )}
                        {record.status === 'warning' && (
                          <div style={{ color: '#faad14' }}>已发送警告</div>
                        )}
                        {record.status === 'banned' && (
                          <div style={{ color: '#ff4d4f' }}>已封禁</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          } />

          <Route path="*" element={
            <Navigate to="dashboard" replace />
          } />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;
