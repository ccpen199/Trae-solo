import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { EmailGeneration } from '../types';

export default function EmailList() {
  const [emails, setEmails] = useState<EmailGeneration[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmails();
  }, [filter]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/email-generations${params}`);
      setEmails(res.data.data || []);
    } catch (error) {
      console.error('Load emails error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    validated: '已验证',
    approved: '已批准',
    sent: '已发送',
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h1 className="page-title">邮件列表</h1>

      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="validated">已验证</option>
              <option value="approved">已批准</option>
              <option value="sent">已发送</option>
            </select>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/generate" className="btn btn-primary">
              + 生成新邮件
            </Link>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>主题</th>
              <th>Agent</th>
              <th>收件人</th>
              <th>创建人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr key={email.id}>
                <td>{email.id}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </td>
                <td>{email.agent_name}</td>
                <td>
                  {email.customer_name}
                  {email.is_sensitive && (
                    <span className="status-badge status-critical" style={{ marginLeft: 8 }}>
                      敏感
                    </span>
                  )}
                </td>
                <td>{email.created_by_name}</td>
                <td>
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
                </td>
                <td>{new Date(email.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/emails/${email.id}`} className="btn btn-default btn-sm">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
