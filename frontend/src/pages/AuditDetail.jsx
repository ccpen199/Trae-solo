import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auditsApi, risksApi, rectificationsApi, rulesApi, usersApi } from '../api.js';

const statusLabels = {
  draft: '草稿',
  pending: '待审核',
  risk_detected: '风险已发现',
  rectifying: '整改中',
  reviewing: '复核中',
  completed: '已完成',
  rejected: '已驳回'
};

const riskStatusLabels = {
  open: '待处理',
  confirmed: '已确认',
  false_positive: '误判',
  rectified: '已整改'
};

function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [showRectModal, setShowRectModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [newRect, setNewRect] = useState({
    title: '',
    description: '',
    assignee_id: '',
    action_plan: ''
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [auditRes, rulesRes, usersRes] = await Promise.all([
        auditsApi.get(id),
        rulesApi.getAll(),
        usersApi.getAll()
      ]);
      if (auditRes.data.success) setAudit(auditRes.data.data);
      if (rulesRes.data.success) setRules(rulesRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await auditsApi.submit(id, { user_id: 1 });
      if (res.data.success) {
        setMessage({ type: 'success', text: '提交成功' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleRunRules = async () => {
    try {
      const ruleVersions = {};
      rules.forEach(r => { ruleVersions[r.id] = r.version; });
      
      const res = await auditsApi.runRules(id, { 
        user_id: 2,
        rule_versions: ruleVersions
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: `规则执行完成，发现 ${res.data.data.count} 个风险` });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleCreateRect = async () => {
    try {
      const res = await rectificationsApi.create({
        ...newRect,
        risk_id: selectedRisk?.id,
        audit_id: id,
        created_by: 1
      });
      if (res.data.success) {
        setShowRectModal(false);
        setSelectedRisk(null);
        setNewRect({ title: '', description: '', assignee_id: '', action_plan: '' });
        setMessage({ type: 'success', text: '整改任务创建成功' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleComplete = async () => {
    try {
      const res = await auditsApi.complete(id, { user_id: 1, conclusion: 'pass' });
      if (res.data.success) {
        setMessage({ type: 'success', text: '审计已完成' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!audit) return <div>审计记录不存在</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/audits">审计台账</Link> / {audit.title}
      </div>

      <div className="page-header">
        <h2>审计详情 - {audit.title}</h2>
        <div>
          {audit.status === 'draft' && (
            <button className="btn btn-warning" onClick={handleSubmit} style={{ marginRight: '8px' }}>
              提交审核
            </button>
          )}
          {audit.status === 'pending' && (
            <button className="btn btn-primary" onClick={handleRunRules} style={{ marginRight: '8px' }}>
              执行规则检测
            </button>
          )}
          {(audit.status === 'risk_detected' || audit.status === 'rectifying') && (
            <button className="btn btn-success" onClick={handleComplete} style={{ marginRight: '8px' }}>
              完成审计
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/audits')}>返回</button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <h3>基本信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>ID</div>
            <div style={{ fontWeight: 'bold' }}>{audit.id}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>状态</div>
            <div><span className={`status-badge status-${audit.status}`}>{statusLabels[audit.status]}</span></div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>风险数</div>
            <div style={{ fontWeight: 'bold' }}>{audit.risk_count || 0}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>负责人</div>
            <div>{audit.assignee_name || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>创建人</div>
            <div>{audit.creator_name || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>创建时间</div>
            <div>{new Date(audit.created_at).toLocaleString()}</div>
          </div>
        </div>
        {audit.description && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>描述</div>
            <div>{audit.description}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>关联材料</h3>
        {audit.materials?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>类型</th>
                <th>上传时间</th>
              </tr>
            </thead>
            <tbody>
              {audit.materials.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.title}</td>
                  <td><span className="tag">{m.type}</span></td>
                  <td>{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无关联材料</div>
        )}
      </div>

      <div className="card">
        <h3>风险清单</h3>
        {audit.risks?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>风险描述</th>
                <th>规则</th>
                <th>等级</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {audit.risks.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.rule_name}</td>
                  <td><span className={`status-badge risk-${r.risk_level}`}>{r.risk_level}</span></td>
                  <td><span className={`status-badge status-${r.status}`}>{riskStatusLabels[r.status]}</span></td>
                  <td>
                    <Link to={`/risks/${r.id}`} className="link" style={{ marginRight: '8px' }}>详情</Link>
                    {(r.status === 'open' || r.status === 'confirmed') && (
                      <button 
                        className="btn btn-sm btn-warning" 
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => { setSelectedRisk(r); setShowRectModal(true); }}
                      >
                        创建整改
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无风险记录</div>
        )}
      </div>

      <div className="card">
        <h3>整改任务</h3>
        {audit.rectifications?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>整改内容</th>
                <th>负责人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {audit.rectifications.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.assignee_name || '-'}</td>
                  <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                  <td><Link to={`/rectifications/${r.id}`} className="link">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无整改任务</div>
        )}
      </div>

      <div className="card">
        <h3>操作日志</h3>
        {audit.logs?.length > 0 ? (
          <div className="timeline">
            {audit.logs.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                <div className="action">
                  {log.action} 
                  {log.old_status && log.new_status && (
                    <span> ({log.old_status} → {log.new_status})</span>
                  )}
                </div>
                <div className="user">操作人: {log.user_name || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无操作日志</div>
        )}
      </div>

      {showRectModal && (
        <div className="modal-overlay" onClick={() => setShowRectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>创建整改任务</h3>
            {selectedRisk && (
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                关联风险: {selectedRisk.title}
              </div>
            )}
            <div className="form-group">
              <label>整改标题 *</label>
              <input 
                type="text" 
                value={newRect.title}
                onChange={e => setNewRect({ ...newRect, title: e.target.value })}
                placeholder="请输入整改标题"
              />
            </div>
            <div className="form-group">
              <label>整改描述</label>
              <textarea 
                value={newRect.description}
                onChange={e => setNewRect({ ...newRect, description: e.target.value })}
                placeholder="请输入整改描述"
              />
            </div>
            <div className="form-group">
              <label>负责人 *</label>
              <select 
                value={newRect.assignee_id}
                onChange={e => setNewRect({ ...newRect, assignee_id: e.target.value })}
              >
                <option value="">请选择负责人</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>整改方案</label>
              <textarea 
                value={newRect.action_plan}
                onChange={e => setNewRect({ ...newRect, action_plan: e.target.value })}
                placeholder="请输入整改方案"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowRectModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateRect}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditDetail;
