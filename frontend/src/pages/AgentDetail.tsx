import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AgentProfile, AuditLog } from '../types';

export default function AgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAgent();
      loadTimeline();
    }
  }, [id]);

  const loadAgent = async () => {
    try {
      const res = await api.get(`/agents/${id}`);
      setAgent(res.data);
    } catch (error) {
      console.error('Load agent error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const res = await api.get(`/agents/${id}/timeline`);
      setTimeline(res.data || []);
    } catch (error) {
      console.error('Load timeline error:', error);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!agent) return <div className="error-message">Agent 不存在</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/agents" style={{ color: '#1890ff' }}>Agent 列表</Link> / {agent.name}
      </div>
      <h1 className="page-title">{agent.name}</h1>

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          基本信息
        </div>
        <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          变更时间线
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>基本信息</h3>
            <div className="form-group">
              <label>描述</label>
              <div>{agent.description || '-'}</div>
            </div>
            <div className="form-group">
              <label>状态</label>
              <span className={`status-badge ${agent.status === 'active' ? 'status-active' : 'status-draft'}`}>
                {agent.status === 'active' ? '启用' : '停用'}
              </span>
            </div>
            <div className="form-group">
              <label>创建人</label>
              <div>{agent.created_by_name}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>模型配置</h3>
            <div className="form-group">
              <label>模型</label>
              <div>{agent.model_config.model || '-'}</div>
            </div>
            <div className="form-group">
              <label>温度</label>
              <div>{agent.model_config.temperature || '-'}</div>
            </div>
            <div className="form-group">
              <label>语气偏好</label>
              <div>{agent.tone_preferences.join(', ') || '-'}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>必填变量</h3>
            {agent.variable_requirements.length > 0 ? (
              <ul>
                {agent.variable_requirements.map((v, i) => (
                  <li key={i} style={{ margin: '8px 0' }}>{v}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#888' }}>暂无必填变量</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>审批流程</h3>
            <div className="form-group">
              <label>需要预览审批</label>
              <div>{agent.approval_workflow.require_preview_approval ? '是' : '否'}</div>
            </div>
            <div className="form-group">
              <label>自动发送阈值</label>
              <div>{agent.approval_workflow.auto_send_threshold || '-'}</div>
            </div>
          </div>
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
