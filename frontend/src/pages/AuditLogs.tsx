import { useEffect, useState } from 'react';
import api from '../utils/api';
import { AuditLog } from '../types';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = filter ? `?entity_type=${filter}` : '';
      const res = await api.get(`/audit${params}`);
      setLogs(res.data || []);
    } catch (error) {
      console.error('Load audit logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionLabels: Record<string, string> = {
    create: '创建',
    update: '更新',
    approve: '审批',
    send: '发送',
    delete: '删除',
  };

  const entityLabels: Record<string, string> = {
    agent_profile: 'Agent配置',
    customer_profile: '客户档案',
    email_template: '邮件模板',
    email_generation: '邮件生成',
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h1 className="page-title">审计日志</h1>

      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部类型</option>
              <option value="agent_profile">Agent配置</option>
              <option value="customer_profile">客户档案</option>
              <option value="email_template">邮件模板</option>
              <option value="email_generation">邮件生成</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>操作</th>
              <th>对象类型</th>
              <th>对象ID</th>
              <th>操作人</th>
              <th>原因</th>
              <th>变更摘要</th>
              <th>恢复路径</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className={`status-badge ${log.action === 'create' || log.action === 'send' ? 'status-approved' : log.action === 'approve' ? 'status-active' : 'status-info'}`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>
                <td>{entityLabels[log.entity_type] || log.entity_type}</td>
                <td>{log.entity_id}</td>
                <td>{log.operator_name}</td>
                <td style={{ maxWidth: 150 }}>{log.reason || '-'}</td>
                <td style={{ maxWidth: 200, fontSize: 12, color: '#666' }}>
                  {log.change_summary || '-'}
                </td>
                <td style={{ maxWidth: 150, fontSize: 12, color: '#1890ff' }}>
                  {log.recovery_path || '-'}
                </td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
