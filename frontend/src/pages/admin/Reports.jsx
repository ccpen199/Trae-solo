import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [handlingReport, setHandlingReport] = useState(null);
  const [handleForm, setHandleForm] = useState({
    status: 'resolved',
    handling_note: '',
    freeze_target: false,
  });

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports({ status: statusFilter, limit: 50 });
      setReports(res.data.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!handlingReport) return;

    try {
      await adminAPI.handleReport(handlingReport.id, handleForm);
      setHandlingReport(null);
      setHandleForm({ status: 'resolved', handling_note: '', freeze_target: false });
      loadReports();
    } catch (err) {
      alert('处理失败');
    }
  };

  const statusLabels = {
    pending: '⏳ 待处理',
    processing: '🔄 处理中',
    resolved: '✅ 已解决',
    rejected: '❌ 已驳回',
  };

  const targetLabels = {
    user: '用户',
    job: '职位',
    post: '帖子',
    message: '消息',
    resume: '简历',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin" className="text-sm text-secondary" style={{ marginBottom: 8, display: 'block' }}>
            ← 返回控制台
          </Link>
          <h1 className="page-title">⚠️ 举报管理</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            SLA: 举报需在 2 小时内处理并响应
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '12px 20px',
              fontWeight: statusFilter === key ? 600 : 400,
              color: statusFilter === key ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: statusFilter === key ? '2px solid var(--primary-color)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p>暂无{statusLabels[statusFilter]}的举报</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reports.map(report => (
            <div key={report.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <span className={`badge badge-${
                      report.status === 'pending' ? 'warning' :
                      report.status === 'processing' ? 'info' :
                      report.status === 'resolved' ? 'success' : 'danger'
                    }`}>
                      {statusLabels[report.status]}
                    </span>
                    <span className="badge">{targetLabels[report.target_type]}</span>
                    <span className="text-sm text-muted">
                      举报 ID: {report.id} · {report.created_at?.replace('T', ' ').substring(0, 19)}
                    </span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      举报人：<span className="font-medium">{report.reporter_name}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      举报类型：<span className="font-medium">{report.reason}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      目标ID：<span className="font-medium">{report.target_id}</span>
                    </div>
                  </div>

                  {report.description && (
                    <div style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{report.description}</p>
                    </div>
                  )}

                  {report.handling_note && (
                    <div style={{
                      padding: 12,
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 8,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}>
                      <p style={{ fontSize: 14 }}>
                        <span className="font-medium">处理意见：</span>
                        {report.handling_note}
                        <span className="text-sm text-muted" style={{ marginLeft: 12 }}>
                          处理人: {report.handled_by} · {report.handled_at?.replace('T', ' ').substring(0, 16)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {report.status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setHandlingReport(report)}
                  >
                    处理
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {handlingReport && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setHandlingReport(null)}>
          <div className="card" style={{ width: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>处理举报 #{handlingReport.id}</h2>

            <form onSubmit={handleReport}>
              <div className="form-group">
                <label className="form-label">处理结果</label>
                <select
                  className="form-select"
                  value={handleForm.status}
                  onChange={(e) => setHandleForm({ ...handleForm, status: e.target.value })}
                >
                  <option value="resolved">✅ 已解决</option>
                  <option value="rejected">❌ 驳回举报</option>
                  <option value="processing">🔄 处理中</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">处理说明</label>
                <textarea
                  className="form-textarea"
                  value={handleForm.handling_note}
                  onChange={(e) => setHandleForm({ ...handleForm, handling_note: e.target.value })}
                  placeholder="请填写处理说明..."
                  required
                />
              </div>

              {handleForm.status === 'resolved' && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={handleForm.freeze_target}
                      onChange={(e) => setHandleForm({ ...handleForm, freeze_target: e.target.checked })}
                    />
                    <span className="text-danger font-medium">冻结被举报对象（用户/内容）</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setHandlingReport(null)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">确认处理</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
