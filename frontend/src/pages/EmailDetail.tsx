import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { EmailGeneration, AuditLog } from '../types';
import { useAuthStore } from '../store/authStore';

export default function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState<EmailGeneration | null>(null);
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadEmail();
      loadTimeline();
    }
  }, [id]);

  const loadEmail = async () => {
    try {
      const res = await api.get(`/email-generations/${id}`);
      setEmail(res.data);
    } catch (err) {
      console.error('Load email error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const res = await api.get(`/email-generations/${id}/timeline`);
      setTimeline(res.data || []);
    } catch (error) {
      console.error('Load timeline error:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/email-generations/${id}/approve`);
      loadEmail();
      loadTimeline();
    } catch (err: any) {
      setError(err.response?.data?.error || '审核失败');
    }
  };

  const handleSend = async () => {
    try {
      await api.post(`/email-generations/${id}/send`);
      loadEmail();
      loadTimeline();
      setTimeout(() => navigate('/send-records'), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || '发送失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!email) return <div className="error-message">邮件不存在</div>;

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    validated: '已验证',
    approved: '已批准',
    sent: '已发送',
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/emails" style={{ color: '#1890ff' }}>邮件列表</Link> / #{email.id}
      </div>
      <h1 className="page-title">{email.subject}</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ marginRight: 16 }}>收件人: {email.customer_name} ({email.customer_email})</span>
            <span style={{ marginRight: 16 }}>Agent: {email.agent_name}</span>
            <span
              className={`status-badge ${
                email.status === 'sent'
                  ? 'status-sent'
                  : email.status === 'approved'
                  ? 'status-approved'
                  : email.status === 'validated'
                  ? 'status-active'
                  : 'status-draft'
              }`}
            >
              {statusLabels[email.status] || email.status}
            </span>
            {email.is_sensitive && (
              <span className="status-badge status-critical" style={{ marginLeft: 8 }}>
                敏感客户
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {email.status !== 'sent' && user?.permissions?.includes('email:approve') && (
              <button className="btn btn-success btn-sm" onClick={handleApprove}>
                审核通过
              </button>
            )}
            {email.status !== 'sent' && (
              <button className="btn btn-primary btn-sm" onClick={handleSend}>
                发送
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
          邮件内容
        </div>
        <div className={`tab ${activeTab === 'variables' ? 'active' : ''}`} onClick={() => setActiveTab('variables')}>
          变量信息
        </div>
        <div className={`tab ${activeTab === 'validation' ? 'active' : ''}`} onClick={() => setActiveTab('validation')}>
          验证结果
        </div>
        <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          时间线
        </div>
      </div>

      {activeTab === 'content' && (
        <div className="card">
          <div className="form-group">
            <label>主题</label>
            <div style={{ padding: '8px 0', fontWeight: 500, fontSize: 18 }}>{email.subject}</div>
          </div>
          <div className="form-group">
            <label>正文</label>
            <div className="preview-box" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{email.content}</div>
          </div>
        </div>
      )}

      {activeTab === 'variables' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>变量名</th>
                <th>值</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(email.variables).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="card">
          <div className="form-group">
            <label>变量验证结果</label>
            <div>
              {email.validation_result.variables_valid ? (
                <span className="status-badge status-approved">验证通过</span>
              ) : (
                <span className="status-badge status-critical">验证失败</span>
              )}
            </div>
          </div>
          {email.validation_result.missing_fields?.length > 0 && (
            <div className="form-group">
              <label>缺失字段</label>
              <div style={{ color: '#ff4d4f' }}>
                {email.validation_result.missing_fields.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <div className="timeline">
            {timeline.length > 0 ? (
              timeline.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {log.action === 'create' && '创建'}
                    {log.action === 'update' && '更新'}
                    {log.action === 'approve' && '审批'}
                    {log.action === 'send' && '发送'}
                    - {log.reason}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                    操作人: {log.operator_name} | {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.change_summary && (
                    <div style={{ fontSize: 12, color: '#888' }}>变更: {log.change_summary}</div>
                  )}
                  {log.recovery_path && (
                    <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                      恢复路径: {log.recovery_path}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="loading">暂无变更记录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
