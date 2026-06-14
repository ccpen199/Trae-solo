import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

function TaskDetail({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      showToast('加载任务详情失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      showToast('请先登录', 'error');
      navigate('/login');
      return;
    }
    
    if (!['student', 'homemaker', 'parttime'].includes(user.user_type)) {
      showToast('只有兼职用户可以接单', 'error');
      return;
    }
    
    try {
      setAccepting(true);
      const response = await api.post(`/tasks/${id}/accept`);
      showToast(response.data.message || '接单成功', 'success');
      navigate('/my-orders');
    } catch (error) {
      showToast(error.response?.data?.error || '接单失败', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = { online: '线上任务', offline: '线下任务', hybrid: '混合任务' };
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

  if (loading) {
    return <div className="container" style={{ padding: '60px 20px' }}><div className="empty-state">加载中...</div></div>;
  }

  if (!task) {
    return <div className="container" style={{ padding: '60px 20px' }}><div className="empty-state">任务不存在</div></div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px', padding: '8px 20px' }}
      >
        ← 返回
      </button>
      
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <span className={`task-type task-type-${task.task_type}`} style={{ marginRight: '8px' }}>
            {getTypeLabel(task.task_type)}
          </span>
          <span className={`badge ${task.status === 'published' ? 'badge-success' : 'badge-secondary'}`}>
            {getStatusLabel(task.status)}
          </span>
          {task.risk_level === 'high' && (
            <span className="badge badge-warning" style={{ marginLeft: '8px' }}>高风险</span>
          )}
        </div>
        
        <h1 style={{ marginBottom: '16px', fontSize: '28px' }}>{task.title}</h1>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px 0',
          borderTop: '1px solid #f1f5f9',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>任务佣金</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#667eea' }}>¥{task.budget}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>已接/总名额</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>{task.accepted_count || 0}/{task.total_count}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>任务分类</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{task.category}</div>
          </div>
        </div>
        
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>任务描述</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {task.description || '暂无描述'}
            </p>
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>需求技能</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {task.skills_required && task.skills_required.length > 0 ? (
                task.skills_required.map((skill, index) => (
                  <span key={index} className="badge badge-info">{skill}</span>
                ))
              ) : (
                <span style={{ color: '#94a3b8' }}>无特殊技能要求</span>
              )}
            </div>
            
            <h3 style={{ fontSize: '16px', margin: '24px 0 12px' }}>任务信息</h3>
            <div style={{ color: '#475569', fontSize: '14px', lineHeight: '2' }}>
              {task.location && <div>📍 工作地点：{task.location}</div>}
              {task.start_time && <div>🕐 开始时间：{task.start_time}</div>}
              {task.end_time && <div>⏰ 结束时间：{task.end_time}</div>}
              {task.radius && <div>📏 服务半径：{task.radius}公里</div>}
            </div>
          </div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>雇主信息</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 600
            }}>
              {task.company_name?.charAt(0) || 'E'}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                {task.company_name}
                {task.employer_verified && (
                  <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '11px' }}>已认证</span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                信用等级：{task.credit_rating || 'C'}
              </div>
              {task.contact_name && (
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  联系人：{task.contact_name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {task.status === 'published' && !task.has_accepted && (
          <button
            onClick={handleAccept}
            disabled={accepting || (task.accepted_count || 0) >= task.total_count}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          >
            {accepting ? '接单中...' : 
             (task.accepted_count || 0) >= task.total_count ? '名额已满' : '立即接单'}
          </button>
        )}
        
        {task.has_accepted && (
          <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '12px' }}>
            <span style={{ color: '#15803d', fontWeight: 500 }}>✓ 您已接取此任务</span>
            <button
              onClick={() => navigate('/my-orders')}
              className="btn btn-primary"
              style={{ marginLeft: '16px', padding: '8px 20px' }}
            >
              查看我的任务
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail;
