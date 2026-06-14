import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

function TaskCard({ task, showToast, onAcceptSuccess }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [accepting, setAccepting] = React.useState(false);

  const getTypeLabel = (type) => {
    const labels = {
      online: '线上',
      offline: '线下',
      hybrid: '混合'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      published: '招募中',
      in_progress: '进行中',
      completed: '已完成',
      pending: '待审核',
      rejected: '已驳回'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      published: 'badge-success',
      in_progress: 'badge-info',
      completed: 'badge-secondary',
      pending: 'badge-warning',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  const getRiskLabel = (risk) => {
    const labels = { low: '低风险', medium: '中风险', high: '高风险' };
    return labels[risk] || risk;
  };

  const getRiskBadgeClass = (risk) => {
    const classes = { low: 'badge-success', medium: 'badge-warning', high: 'badge-danger' };
    return classes[risk] || 'badge-secondary';
  };

  const getUnitLabel = (unit) => {
    const labels = {
      per_task: '元/单',
      per_hour: '元/小时',
      per_day: '元/天',
      per_order: '元/单',
      per_event: '元/场',
      per_item: '元/条',
      per_questionnaire: '元/份',
      commission: '佣金'
    };
    return labels[unit] || '元';
  };

  const isWorker = user && ['student', 'homemaker', 'parttime'].includes(user.user_type);
  const canAccept = task.status === 'published' && isAuthenticated && isWorker && !task.has_accepted && (task.accepted_count || 0) < task.total_count;

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isWorker) {
      showToast('只有工作者用户可以接单', 'error');
      return;
    }
    if (task.has_accepted) {
      showToast('您已接取此任务', 'warning');
      return;
    }
    
    try {
      setAccepting(true);
      const response = await api.post(`/tasks/${task.id}/accept`);
      showToast(response.data.message || '接单成功', 'success');
      if (onAcceptSuccess) onAcceptSuccess();
    } catch (error) {
      showToast(error.response?.data?.error || '接单失败', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const handleViewDetail = (e) => {
    e.stopPropagation();
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div className="task-card">
      <div 
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <div className="task-card-header">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-price">
            ¥{task.budget}
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>
              {getUnitLabel(task.unit)}
            </span>
          </div>
        </div>
        
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`task-type task-type-${task.task_type}`}>
            {getTypeLabel(task.task_type)}
          </span>
          <span className={`badge ${getStatusBadgeClass(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
          {task.risk_level && (
            <span className={`badge ${getRiskBadgeClass(task.risk_level)}`}>
              {getRiskLabel(task.risk_level)}
            </span>
          )}
          {task.credit_rating && (
            <span className="badge badge-info">
              信用 {task.credit_rating}
            </span>
          )}
          {task.has_accepted && (
            <span className="badge badge-warning">
              已接单
            </span>
          )}
        </div>
        
        <p style={{ 
          color: '#64748b', 
          fontSize: '14px', 
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          height: '42px',
          marginBottom: '12px'
        }}>
          {task.description}
        </p>
        
        {task.skills_required && task.skills_required.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {task.skills_required.slice(0, 3).map((skill, idx) => (
              <span key={idx} style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {skill}
              </span>
            ))}
            {task.skills_required.length > 3 && (
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                +{task.skills_required.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="task-meta">
          <span>🏢 {task.company_name || '企业'}</span>
          <span>👥 {task.accepted_count || 0}/{task.total_count}人</span>
          {task.location && <span>📍 {task.location}</span>}
        </div>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px', 
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleViewDetail}
          style={{
            flex: 1,
            padding: '8px 16px',
            border: '1px solid #667eea',
            backgroundColor: 'white',
            color: '#667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f4ff'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          查看详情
        </button>
        
        {canAccept && (
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              backgroundColor: accepting ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              background: accepting ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '6px',
              cursor: accepting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {accepting ? '接单中...' : '立即接单'}
          </button>
        )}
        
        {task.has_accepted && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/my-orders'); }}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              backgroundColor: '#f59e0b',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            履约管理
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
