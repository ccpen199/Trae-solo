import React, { useState, useEffect } from 'react';
import { dailyLogApi } from '../../services/api';
import { DailyLog } from '../../types';
import dayjs from 'dayjs';

const DailyLogPage: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    content: '',
    planTomorrow: '',
    issues: '',
    isPlanCompleted: false,
    relatedFees: 0
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await dailyLogApi.getDailyLogs(params);
      setLogs(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error: any) {
      console.error('获取日志失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || '获取日志失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLog) {
        await dailyLogApi.updateDailyLog(editingLog.id, formData);
        setMessage({ type: 'success', text: '日志更新成功' });
      } else {
        await dailyLogApi.createDailyLog(formData);
        setMessage({ type: 'success', text: '日志创建成功' });
      }
      setShowModal(false);
      resetForm();
      fetchLogs();
    } catch (error: any) {
      console.error('保存日志失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || '保存日志失败' });
    }
  };

  const handleEdit = (log: DailyLog) => {
    setEditingLog(log);
    setFormData({
      date: dayjs(log.date).format('YYYY-MM-DD'),
      content: log.content,
      planTomorrow: log.planTomorrow || '',
      issues: log.issues || '',
      isPlanCompleted: log.isPlanCompleted,
      relatedFees: log.relatedFees || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条日志吗？')) return;
    try {
      await dailyLogApi.deleteDailyLog(id);
      setMessage({ type: 'success', text: '日志删除成功' });
      fetchLogs();
    } catch (error: any) {
      console.error('删除日志失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || '删除日志失败' });
    }
  };

  const handleSubmitLog = async (id: number) => {
    try {
      await dailyLogApi.submitDailyLog(id);
      setMessage({ type: 'success', text: '日志提交成功' });
      fetchLogs();
    } catch (error: any) {
      console.error('提交日志失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || '提交日志失败' });
    }
  };

  const resetForm = () => {
    setFormData({
      date: dayjs().format('YYYY-MM-DD'),
      content: '',
      planTomorrow: '',
      issues: '',
      isPlanCompleted: false,
      relatedFees: 0
    });
    setEditingLog(null);
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      reviewed: '已评价'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-badge status-${status}`;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      <div className="page-header">
        <h2>我的日志</h2>
        <p>管理您的工作日志</p>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>筛选条件</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilters({ startDate: '', endDate: '', status: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              重置
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              + 新增日志
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="reviewed">已评价</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>日志列表</h3>
          <span style={{ color: '#666', fontSize: '14px' }}>
            共 {pagination.total} 条记录
          </span>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : logs.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>工作内容</th>
                  <th>明日计划</th>
                  <th>相关费用</th>
                  <th>计划完成</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{dayjs(log.date).format('YYYY-MM-DD')}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.content}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.planTomorrow || '-'}
                    </td>
                    <td>¥{log.relatedFees || 0}</td>
                    <td>{log.isPlanCompleted ? '是' : '否'}</td>
                    <td>
                      <span className={getStatusClass(log.status)}>
                        {getStatusBadge(log.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(log)}
                        >
                          编辑
                        </button>
                        {log.status === 'draft' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSubmitLog(log.id)}
                            >
                              提交
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(log.id)}
                            >
                              删除
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>暂无日志记录</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              新增第一条日志
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </button>
            <span>第 {pagination.page} / {totalPages} 页</span>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingLog ? '编辑日志' : '新增日志'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>日期 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>相关费用</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.relatedFees}
                    onChange={(e) => setFormData(prev => ({ ...prev, relatedFees: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>今日工作内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入今日工作内容"
                  required
                />
              </div>

              <div className="form-group">
                <label>明日计划</label>
                <textarea
                  value={formData.planTomorrow}
                  onChange={(e) => setFormData(prev => ({ ...prev, planTomorrow: e.target.value }))}
                  placeholder="请输入明日计划"
                />
              </div>

              <div className="form-group">
                <label>问题与建议</label>
                <textarea
                  value={formData.issues}
                  onChange={(e) => setFormData(prev => ({ ...prev, issues: e.target.value }))}
                  placeholder="请输入问题与建议"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isPlanCompleted}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPlanCompleted: e.target.checked }))}
                  />
                  昨日计划已完成
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLog ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogPage;
