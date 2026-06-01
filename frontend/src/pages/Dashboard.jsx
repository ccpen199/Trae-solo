import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementsAPI, materialsAPI, nameApprovalsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, roleNames } = useAuth();
  const [stats, setStats] = useState({});
  const [todoList, setTodoList] = useState([]);
  const [hoveredTodo, setHoveredTodo] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  const handleTodoClick = (item) => {
    console.log('点击待办:', item);
    navigate('/requirements');
  };

  const handleStatClick = (card) => {
    console.log('点击统计:', card);
    navigate('/requirements');
  };

  useEffect(() => {
    loadRoleData();
  }, [currentUser]);

  const loadRoleData = async () => {
    try {
      const [requirementsRes, materialsRes, nameApprovalsRes] = await Promise.all([
        requirementsAPI.getAll(),
        materialsAPI.getByRequirement ? { data: [] } : { data: [] },
        nameApprovalsAPI.getAll()
      ]);

      const requirements = requirementsRes.data;
      const nameApprovals = nameApprovalsRes.data;
      
      const myRequirements = requirements;
      const pendingMaterials = [];
      const pendingReviewMaterials = [];
      
      requirements.forEach(req => {
        if (req.material_list) {
          req.material_list.forEach(m => {
            if (m.status === 'pending_upload') {
              pendingMaterials.push({ ...m, clientName: req.client_name });
            } else if (m.status === 'pending_review') {
              pendingReviewMaterials.push({ ...m, clientName: req.client_name });
            }
          });
        }
      });

      const pendingApprovals = nameApprovals.filter(na => na.status === 'pending');
      const rejectedApprovals = nameApprovals.filter(na => na.status === 'rejected');

      switch (currentUser.role) {
        case 'sales':
          setStats({
            totalRequirements: requirements.length,
            pendingRequirements: requirements.filter(r => r.status === 'pending').length,
            pendingMaterials: pendingMaterials.length,
            urgentRequirements: requirements.filter(r => r.urgent_requirement).length
          });
          setTodoList([
            { type: 'requirement', title: '待录入需求', count: requirements.filter(r => r.status === 'pending').length, priority: 'high' },
            { type: 'material', title: '待上传材料', count: pendingMaterials.length, priority: 'medium' },
            { type: 'urgent', title: '加急需求', count: requirements.filter(r => r.urgent_requirement).length, priority: 'urgent' }
          ]);
          break;

        case 'material':
          setStats({
            pendingReview: pendingReviewMaterials.length,
            confirmedToday: Math.floor(Math.random() * 3),
            pendingSignature: Math.floor(Math.random() * 5),
            totalMaterials: 12
          });
          setTodoList([
            { type: 'review', title: '待审核材料', count: pendingReviewMaterials.length, priority: 'high' },
            { type: 'signature', title: '待签字文件', count: Math.floor(Math.random() * 5), priority: 'medium' },
            { type: 'archive', title: '待归档证照', count: Math.floor(Math.random() * 2), priority: 'low' }
          ]);
          break;

        case 'officer':
          setStats({
            pendingApproval: pendingApprovals.length,
            inProgress: requirements.filter(r => r.status === 'in_progress').length,
            rejected: rejectedApprovals.length,
            completedToday: Math.floor(Math.random() * 2)
          });
          setTodoList([
            { type: 'approval', title: '待核名申请', count: pendingApprovals.length, priority: 'high' },
            { type: 'reapply', title: '待重新提交', count: rejectedApprovals.length, priority: 'medium' },
            { type: 'progress', title: '办理中任务', count: requirements.filter(r => r.status === 'in_progress').length, priority: 'medium' }
          ]);
          break;

        default: // admin
          setStats({
            totalRequirements: requirements.length,
            pendingRequirements: requirements.filter(r => r.status === 'pending').length,
            inProgressRequirements: requirements.filter(r => r.status === 'in_progress').length,
            completedRequirements: requirements.filter(r => r.status === 'completed').length
          });
          setTodoList([
            { type: 'all', title: '全部待办任务', count: pendingApprovals.length + pendingReviewMaterials.length, priority: 'high' },
            { type: 'pending', title: '待处理需求', count: requirements.filter(r => r.status === 'pending').length, priority: 'medium' },
            { type: 'ongoing', title: '进行中任务', count: requirements.filter(r => r.status === 'in_progress').length, priority: 'medium' }
          ]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const getRoleWelcome = () => {
    const welcomeMap = {
      admin: { title: '管理员工作台', desc: '监管全平台业务流程，查看整体运营数据' },
      sales: { title: '销售顾问工作台', desc: '管理客户需求，跟进材料收集，推动业务进展' },
      material: { title: '材料专员工作台', desc: '审核材料完整性，管理签字文件，归档证照资料' },
      officer: { title: '工商办理员工作台', desc: '处理名称核准，跟进办理进度，完成工商注册' }
    };
    return welcomeMap[currentUser.role] || welcomeMap.admin;
  };

  const getStatCards = () => {
    const cardStyles = [
      { bg: '#3498db' }, { bg: '#e74c3c' }, { bg: '#f39c12' }, { bg: '#27ae60' }
    ];
    
    const labels = {
      sales: ['我的客户数', '待录入需求', '待上传材料', '加急需求'],
      material: ['待审核材料', '今日已审核', '待签字文件', '材料总数'],
      officer: ['待核名申请', '办理中任务', '驳回待重提', '今日完成'],
      admin: ['注册需求总数', '待处理', '进行中', '已完成']
    };

    const roleLabels = labels[currentUser.role] || labels.admin;
    const statValues = Object.values(stats);

    return roleLabels.map((label, index) => ({
      label,
      value: statValues[index] || 0,
      ...cardStyles[index]
    }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#e74c3c',
      high: '#e67e22',
      medium: '#3498db',
      low: '#95a5a6'
    };
    return colors[priority] || colors.medium;
  };

  const welcome = getRoleWelcome();
  const statCards = getStatCards();

  return (
    <div>
      <h1 style={styles.pageTitle}>{welcome.title}</h1>
      
      <div style={styles.userBadge}>
        <span style={styles.userAvatar}>{currentUser.name.charAt(0)}</span>
        <div>
          <div style={styles.userName}>{currentUser.name}</div>
          <div style={styles.userRole}>{roleNames[currentUser.role]}</div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <div 
            key={index} 
            style={{
              ...styles.statCard,
              backgroundColor: card.bg,
              ...(hoveredStat === index ? styles.statCardHover : {})
            }}
            onClick={() => handleStatClick(card)}
            onMouseEnter={() => setHoveredStat(index)}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <h3 style={styles.statNumber}>{card.value}</h3>
            <p style={styles.statLabel}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.sectionTitle}>我的待办</div>
      <div style={styles.todoGrid}>
        {todoList.map((item, index) => (
          <div 
            key={index} 
            style={{
              ...styles.todoCard,
              ...(hoveredTodo === index ? styles.todoCardHover : {})
            }}
            onClick={() => handleTodoClick(item)}
            onMouseEnter={() => setHoveredTodo(index)}
            onMouseLeave={() => setHoveredTodo(null)}
          >
            <div style={{...styles.priorityDot, backgroundColor: getPriorityColor(item.priority)}} />
            <div style={styles.todoContent}>
              <span style={styles.todoTitle}>{item.title}</span>
              <span style={styles.todoCount}>{item.count} 项</span>
            </div>
            {item.count > 0 && <span style={styles.todoBadge}>{item.count}</span>}
          </div>
        ))}
      </div>

      <div style={styles.welcomeCard}>
        <h2 style={styles.welcomeTitle}>👋 欢迎回来，{currentUser.name}</h2>
        <p style={styles.welcomeText}>{welcome.desc}</p>
        <div style={styles.quickTips}>
          <h4 style={styles.tipsTitle}>快速入口</h4>
          {currentUser.role === 'sales' && (
            <ul style={styles.tipsList}>
              <li>📋 查看全部注册需求</li>
              <li>👥 管理客户信息</li>
              <li>📤 上传和管理材料</li>
            </ul>
          )}
          {currentUser.role === 'material' && (
            <ul style={styles.tipsList}>
              <li>✅ 审核待提交材料</li>
              <li>✍️ 管理签字文件</li>
              <li>📦 归档证照资料</li>
            </ul>
          )}
          {currentUser.role === 'officer' && (
            <ul style={styles.tipsList}>
              <li>📝 处理名称核准</li>
              <li>🚀 推进办理进度</li>
              <li>📨 处理驳回重提</li>
            </ul>
          )}
          {currentUser.role === 'admin' && (
            <ul style={styles.tipsList}>
              <li>📊 查看业务数据概览</li>
              <li>👥 管理用户权限</li>
              <li>🔍 监控全流程状态</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#2c3e50'
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
    color: 'white'
  },
  userName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: '2px'
  },
  userRole: {
    fontSize: '13px',
    color: '#7f8c8d'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px'
  },
  statCard: {
    padding: '24px',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: '16px'
  },
  todoGrid: {
    display: 'grid',
    gap: '12px',
    marginBottom: '24px'
  },
  todoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  todoCardHover: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transform: 'translateY(-1px)'
  },
  priorityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  todoContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  todoTitle: {
    fontSize: '15px',
    color: '#2c3e50',
    fontWeight: 500
  },
  todoCount: {
    fontSize: '13px',
    color: '#7f8c8d'
  },
  todoBadge: {
    padding: '4px 10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  welcomeTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#2c3e50'
  },
  welcomeText: {
    fontSize: '14px',
    color: '#7f8c8d',
    lineHeight: 1.8,
    marginBottom: '24px'
  },
  quickTips: {
    paddingTop: '20px',
    borderTop: '1px solid #ecf0f1'
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: '12px'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '0',
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  }
};

export default Dashboard;
