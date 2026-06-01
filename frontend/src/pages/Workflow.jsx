import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import { workflow, users } from '../api';
import PromptModal from '../components/Modal';

function Workflow() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', assignee: '', type: '' });
  const [userList, setUserList] = useState([]);
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', placeholder: '', callback: null });

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, [filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await workflow.list(filters);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const res = await users.list();
      setUserList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      speaker_confusion: '说话人混淆',
      missing_transcript: '转写缺段',
      over_generalization: '总结过度概括',
      insufficient_evidence: '证据不足'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: '待处理',
      in_progress: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  const handleUpdateStatus = (id, status) => {
    if (status === 'closed') {
      setPromptModal({
        isOpen: true,
        title: '关闭任务',
        placeholder: '请输入关闭原因...',
        callback: async (resolution) => {
          try {
            await workflow.update(id, { status, resolution });
            loadTasks();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    } else {
      (async () => {
        try {
          await workflow.update(id, { status });
          loadTasks();
        } catch (err) {
          alert(err.message);
        }
      })();
    }
  };

  const handleAssign = async (id, assignee) => {
    try {
      await workflow.update(id, { assignee });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="stat-card" style={{ padding: '12px 20px' }}>
            <div className="stat-value" style={{ fontSize: '24px' }}>
              {tasks.filter(t => t.status === 'open').length}
            </div>
            <div className="stat-label">待处理</div>
          </div>
          <div className="stat-card" style={{ padding: '12px 20px' }}>
            <div className="stat-value" style={{ fontSize: '24px' }}>
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="stat-label">处理中</div>
          </div>
          <div className="stat-card" style={{ padding: '12px 20px' }}>
            <div className="stat-value" style={{ fontSize: '24px' }}>
              {tasks.filter(t => t.status === 'resolved').length}
            </div>
            <div className="stat-label">已解决</div>
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>状态</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="open">待处理</option>
            <option value="in_progress">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div className="filter-group">
          <label>任务类型</label>
          <select 
            value={filters.type} 
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">全部类型</option>
            <option value="speaker_confusion">说话人混淆</option>
            <option value="missing_transcript">转写缺段</option>
            <option value="over_generalization">总结过度概括</option>
            <option value="insufficient_evidence">证据不足</option>
          </select>
        </div>
        <div className="filter-group">
          <label>负责人</label>
          <select 
            value={filters.assignee} 
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
          >
            <option value="">全部</option>
            {userList.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">暂无工作流任务</div>
            <div>系统运行正常，所有问题已处理</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map(task => (
            <div key={task.id} className={`workflow-card ${task.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}>
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); navigate(`/interviews/${task.interview_id}`); }}
                        style={{ color: '#2b6cb0' }}
                      >
                        {task.interview_title}
                      </a>
                    </h4>
                    <span className={`badge badge-${task.status}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    <span className="badge badge-medium">
                      {getTypeLabel(task.type)}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '8px' }}>
                    {task.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#718096' }}>
                    {task.description}
                  </p>
                  {task.suggested_action && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px 14px', 
                      background: '#ebf8ff', 
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#2b6cb0'
                    }}>
                      💡 建议动作: {task.suggested_action}
                    </div>
                  )}
                  {task.resolution && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px 14px', 
                      background: '#f0fff4', 
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#276749'
                    }}>
                      ✅ 关闭原因: {task.resolution}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '24px' }}>
                  <select 
                    className="btn btn-sm btn-secondary"
                    value={task.assignee || ''}
                    onChange={(e) => handleAssign(task.id, e.target.value || null)}
                    style={{ minWidth: '120px' }}
                  >
                    <option value="">分配负责人</option>
                    {userList.map(u => (
                      <option key={u.id} value={u.id} selected={u.id === task.assignee}>{u.name}</option>
                    ))}
                  </select>
                  {task.status === 'open' && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                    >
                      <Clock size={12} /> 开始处理
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleUpdateStatus(task.id, 'resolved')}
                    >
                      <CheckCircle size={12} /> 标记解决
                    </button>
                  )}
                  {task.status === 'resolved' && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleUpdateStatus(task.id, 'closed')}
                    >
                      关闭任务
                    </button>
                  )}
                </div>
              </div>
              <div className="workflow-meta">
                <span>
                  <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  负责人: {task.assignee_name || '未分配'}
                </span>
                <span>
                  创建时间: {new Date(task.created_at * 1000).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        placeholder={promptModal.placeholder}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={(value) => {
          setPromptModal({ ...promptModal, isOpen: false });
          if (promptModal.callback) promptModal.callback(value);
        }}
      />
    </div>
  );
}

export default Workflow;
