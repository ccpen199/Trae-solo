import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../utils/api.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    familyCount: 0,
    assessmentCount: 0,
    planCount: 0,
    followUpCount: 0,
    highRiskCount: 0,
  });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await reportApi.summary();
      const respData = response.data?.data || response.data;
      setStats({
        familyCount: respData.totalFamilies || respData.familyCount || 0,
        assessmentCount: respData.totalAssessments || respData.assessmentCount || 0,
        planCount: respData.totalPlans || respData.planCount || 0,
        followUpCount: respData.totalFollowUps || respData.followUpCount || 0,
        highRiskCount: respData.highRiskCases || respData.highRiskCount || 0,
      });
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const roleMap = {
      supervisor: '督导',
      consultant: '咨询师',
      parent: '家长',
      operator: '运营管理员',
    };
    const roleName = roleMap[user?.role] || '用户';
    const hour = new Date().getHours();
    let greeting = '您好';
    if (hour < 12) greeting = '上午好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    return `${greeting}，${user?.name || '亲爱的'}${roleName}！`;
  };

  const getQuickActions = () => {
    const actions = [];
    if (user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'operator') {
      actions.push({ label: '新增家庭档案', path: '/family-profiles', icon: '👨‍👩‍👧' });
      actions.push({ label: '新增初评', path: '/assessments', icon: '📋' });
    }
    if (user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'parent' || user?.role === 'operator') {
      actions.push({ label: '新增咨询方案', path: '/consultation-plans', icon: '📝' });
      actions.push({ label: '新增跟进记录', path: '/follow-up-records', icon: '📅' });
    }
    if (user?.role === 'supervisor' || user?.role === 'operator') {
      actions.push({ label: '查看运营报表', path: '/reports', icon: '📊' });
    }
    return actions;
  };

  const getRoleTasks = () => {
    const role = user?.role;
    const tasks = [];

    if (role === 'supervisor') {
      tasks.push({
        title: '待审核咨询方案',
        description: '查看并审核咨询师提交的咨询方案',
        path: '/consultation-plans',
        icon: '✅',
        type: 'warning',
      });
      tasks.push({
        title: '待复核初评报告',
        description: '复核初评结果并给出指导意见',
        path: '/assessments',
        icon: '📋',
        type: 'warning',
      });
      tasks.push({
        title: '高风险个案跟踪',
        description: '关注高风险家庭的咨询进展',
        path: '/reports',
        icon: '⚠️',
        type: 'danger',
      });
      tasks.push({
        title: '咨询师工作负载',
        description: '查看各位咨询师的工作量分配',
        path: '/reports',
        icon: '📊',
        type: 'info',
      });
    } else if (role === 'consultant') {
      tasks.push({
        title: '我的家庭档案',
        description: '查看和管理负责的家庭档案',
        path: '/family-profiles',
        icon: '👨‍👩‍👧',
        type: 'primary',
      });
      tasks.push({
        title: '待提交初评',
        description: '完成并提交初评报告',
        path: '/assessments',
        icon: '📋',
        type: 'primary',
      });
      tasks.push({
        title: '我的咨询方案',
        description: '制定和查看咨询方案',
        path: '/consultation-plans',
        icon: '📝',
        type: 'primary',
      });
      tasks.push({
        title: '跟进记录',
        description: '记录每次咨询内容和家长反馈',
        path: '/follow-up-records',
        icon: '📅',
        type: 'primary',
      });
    } else if (role === 'parent') {
      tasks.push({
        title: '我的咨询档案',
        description: '查看孩子的咨询档案和进展',
        path: '/family-profiles',
        icon: '👨‍👩‍👧',
        type: 'info',
      });
      tasks.push({
        title: '咨询目标',
        description: '查看当前咨询阶段的目标',
        path: '/consultation-plans',
        icon: '🎯',
        type: 'info',
      });
      tasks.push({
        title: '家庭作业',
        description: '查看和完成家庭作业',
        path: '/consultation-plans',
        icon: '📚',
        type: 'info',
      });
      tasks.push({
        title: '反馈记录',
        description: '查看每次咨询的反馈和建议',
        path: '/follow-up-records',
        icon: '💬',
        type: 'info',
      });
    } else if (role === 'operator') {
      tasks.push({
        title: '家庭档案管理',
        description: '管理所有家庭咨询档案',
        path: '/family-profiles',
        icon: '👨‍👩‍👧',
        type: 'info',
      });
      tasks.push({
        title: '运营数据统计',
        description: '查看服务进度、续费、满意度等数据',
        path: '/reports',
        icon: '📊',
        type: 'info',
      });
      tasks.push({
        title: '咨询师负载',
        description: '查看咨询师工作负载情况',
        path: '/reports',
        icon: '👥',
        type: 'info',
      });
      tasks.push({
        title: '高风险个案',
        description: '监控高风险家庭的咨询进展',
        path: '/reports',
        icon: '⚠️',
        type: 'danger',
      });
    }

    return tasks;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="welcome-section">
        <h1 className="welcome-title">{getWelcomeMessage()}</h1>
        <p className="welcome-subtitle">欢迎使用家庭教育咨询管理系统</p>
        <div className="quick-actions">
          {getQuickActions().map((action, index) => (
            <button
              key={index}
              className="btn btn-primary"
              onClick={() => navigate(action.path)}
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.familyCount}</div>
          <div className="stat-label">家庭总数</div>
        </div>
        <div className="stat-card success">
          <div className="stat-number">{stats.assessmentCount}</div>
          <div className="stat-label">评估总数</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-number">{stats.planCount}</div>
          <div className="stat-label">咨询方案数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.followUpCount}</div>
          <div className="stat-label">跟进记录数</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-number">{stats.highRiskCount}</div>
          <div className="stat-label">高风险个案</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">我的工作台</h2>
        </div>
        <div className="card-body">
          <div className="tasks-grid">
            {getRoleTasks().map((task, index) => (
              <div
                key={index}
                className={`task-card task-${task.type}`}
                onClick={() => navigate(task.path)}
              >
                <div className="task-icon">{task.icon}</div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.description}</div>
                </div>
                <div className="task-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">系统简介</h2>
        </div>
        <div className="card-body">
          <p style={{ color: '#64748b', lineHeight: '1.8' }}>
            家庭教育咨询管理系统旨在为家庭教育咨询服务提供全面的信息化管理支持。
            系统涵盖家庭档案管理、初评管理、咨询方案制定、跟进记录以及运营报表等功能模块，
            帮助咨询师和督导高效地管理咨询过程，提升服务质量。
          </p>
          <div className="mt-4">
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#1e293b' }}>主要功能</h3>
            <ul style={{ paddingLeft: '20px', color: '#64748b' }}>
              <li>家庭档案管理：记录家庭基本信息、孩子情况、家长诉求等</li>
              <li>初评管理：进行问卷评估、访谈记录、风险等级评估</li>
              <li>咨询方案：制定个性化咨询方案，设置目标和周期</li>
              <li>跟进记录：记录每次咨询内容、家长反馈和下一步计划</li>
              <li>运营报表：统计服务进度、续费情况、满意度分析等</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
