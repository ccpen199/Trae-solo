import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AgentProfile } from '../types';

export default function AgentList() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res = await api.get('/agents');
      setAgents(res.data.data || []);
    } catch (error) {
      console.error('Load agents error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h1 className="page-title">Agent 档案列表</h1>
      
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Agent 名称</th>
              <th>描述</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td>
                  <Link to={`/agents/${agent.id}`} style={{ color: '#1890ff' }}>
                    {agent.name}
                  </Link>
                </td>
                <td>{agent.description || '-'}</td>
                <td>
                  <span className={`status-badge ${agent.status === 'active' ? 'status-active' : 'status-draft'}`}>
                    {agent.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td>{agent.created_by_name}</td>
                <td>{new Date(agent.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/agents/${agent.id}`} className="btn btn-default btn-sm">
                    查看
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
