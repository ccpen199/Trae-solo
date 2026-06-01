import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { interviews, users } from '../api';
import PromptModal from '../components/Modal';

function InterviewList() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', sort: '-created_at' });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [userList, setUserList] = useState([]);
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', placeholder: '', callback: null });

  useEffect(() => {
    loadInterviews();
    loadUsers();
  }, [filters]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviews.list(filters);
      setData(res.data);
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

  const handleCreate = async () => {
    setFormErrors([]);
    try {
      await interviews.create(formData);
      setShowModal(false);
      setFormData({});
      loadInterviews();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个访谈吗？')) {
      try {
        await interviews.delete(id);
        loadInterviews();
      } catch (err) {
        alert('删除失败：' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleBatchUpdate = (status) => {
    if (selectedIds.length === 0) return;
    setPromptModal({
      isOpen: true,
      title: '批量更新状态',
      placeholder: '请输入变更原因...',
      callback: async (reason) => {
        try {
          await interviews.batchStatus(selectedIds, status, reason);
          setSelectedIds([]);
          loadInterviews();
        } catch (err) {
          alert(err.response?.data?.error || err.message);
        }
      }
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待处理',
      transcribing: '转写中',
      transcribed: '已转写',
      reviewing: '审核中',
      clustering: '聚类中',
      summarizing: '总结中',
      completed: '已完成',
      archived: '已归档'
    };
    return labels[status] || status;
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>访谈列表</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedIds.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={() => handleBatchUpdate('reviewing')}>
                批量审核 ({selectedIds.length})
              </button>
              <button className="btn btn-success" onClick={() => handleBatchUpdate('completed')}>
                批量完成
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            新建访谈
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label><Filter size={12} /> 状态</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="transcribing">转写中</option>
            <option value="transcribed">已转写</option>
            <option value="reviewing">审核中</option>
            <option value="clustering">聚类中</option>
            <option value="summarizing">总结中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div className="filter-group">
          <label>排序</label>
          <select 
            value={filters.sort} 
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="-created_at">最新创建</option>
            <option value="created_at">最早创建</option>
            <option value="-updated_at">最近更新</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox"
                    checked={data.data?.length > 0 && selectedIds.length === data.data.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? data.data.map(i => i.id) : [])}
                  />
                </th>
                <th>标题</th>
                <th>被访谈者</th>
                <th>状态</th>
                <th>访谈日期</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.data?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">暂无访谈记录</div>
                    <div>点击"新建访谈"开始创建</div>
                  </td>
                </tr>
              ) : (
                data.data?.map(interview => (
                  <tr key={interview.id}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(interview.id)}
                        onChange={() => toggleSelect(interview.id)}
                      />
                    </td>
                    <td>
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); navigate(`/interviews/${interview.id}`); }}
                        style={{ fontWeight: 500, color: '#2b6cb0' }}
                      >
                        {interview.title}
                      </a>
                    </td>
                    <td>{interview.interviewee_name || '-'}</td>
                    <td>
                      <span className={`badge badge-${interview.status}`}>
                        {getStatusLabel(interview.status)}
                      </span>
                    </td>
                    <td>{formatDate(interview.interview_date)}</td>
                    <td>{formatDate(interview.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        style={{ marginRight: '8px' }}
                        onClick={() => navigate(`/interviews/${interview.id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(interview.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建访谈</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {formErrors.length > 0 && (
              <div className="form-errors">
                <ul>
                  {formErrors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label>访谈标题 *</label>
              <input 
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入访谈标题"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>被访谈者姓名</label>
                <input 
                  value={formData.interviewee_name || ''}
                  onChange={(e) => setFormData({ ...formData, interviewee_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>被访谈者角色</label>
                <input 
                  value={formData.interviewee_role || ''}
                  onChange={(e) => setFormData({ ...formData, interviewee_role: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>访谈日期</label>
              <input 
                type="date"
                value={formData.interview_date || ''}
                onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述本次访谈的目的和背景"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
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

export default InterviewList;
