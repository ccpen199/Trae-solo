import { useEffect, useState } from 'react';
import api from '../utils/api';
import { EmailTemplate } from '../types';
import { useAuthStore } from '../store/authStore';

export default function TemplateList() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/templates${params}`);
      setTemplates(res.data.data || []);
    } catch (error) {
      console.error('Load templates error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/templates/${id}/approve`);
      loadTemplates();
    } catch (error) {
      console.error('Approve template error:', error);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h1 className="page-title">邮件模板</h1>

      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="approved">已批准</option>
            </select>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {user?.permissions?.includes('template:create') && (
              <button className="btn btn-primary">+ 新建模板</button>
            )}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>模板名称</th>
              <th>分类</th>
              <th>语气</th>
              <th>版本</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.category || '-'}</td>
                <td>{template.tone}</td>
                <td>v{template.version}</td>
                <td>
                  <span
                    className={`status-badge ${
                      template.status === 'approved' ? 'status-approved' : 'status-draft'
                    }`}
                  >
                    {template.status === 'approved' ? '已批准' : '草稿'}
                  </span>
                </td>
                <td>{template.created_by_name}</td>
                <td>{new Date(template.created_at).toLocaleString()}</td>
                <td>
                  {template.status === 'draft' && user?.permissions?.includes('template:approve') && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(template.id)}
                    >
                      批准
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
