import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { risksApi, rectificationsApi, usersApi } from '../api.js';

const statusLabels = {
  open: '待处理',
  confirmed: '已确认',
  false_positive: '误判',
  rectified: '已整改'
};

function highlightMatchedText(text, matchedText) {
  if (!text || !matchedText) return text;
  
  const escaped = matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === matchedText.toLowerCase() ? (
      <mark key={i} style={{ 
        background: '#ff6b6b', 
        color: 'white', 
        padding: '2px 6px', 
        borderRadius: '3px',
        fontWeight: 'bold'
      }}>
        {part}
      </mark>
    ) : part
  );
}

function RiskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [risk, setRisk] = useState(null);
  const [users, setUsers] = useState([]);
  const [showRectModal, setShowRectModal] = useState(false);
  const [newRect, setNewRect] = useState({
    title: '',
    description: '',
    assignee_id: '',
    action_plan: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, usersRes] = await Promise.all([
        risksApi.get(id),
        usersApi.getAll()
      ]);
      if (riskRes.data.success) setRisk(riskRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (isFalsePositive) => {
    try {
      const res = await risksApi.confirm(id, { 
        user_id: 3,
        is_false_positive: isFalsePositive 
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: isFalsePositive ? '已标记为误判' : '已确认风险' });
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
        risk_id: id,
        audit_id: risk?.audit_id,
        created_by: 1
      });
      if (res.data.success) {
        setShowRectModal(false);
        setNewRect({ title: '', description: '', assignee_id: '', action_plan: '' });
        setMessage({ type: 'success', text: '整改任务创建成功' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!risk) return <div>风险记录不存在</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/risks">风险清单</Link> / {risk.title}
      </div>

      <div className="page-header">
        <h2>风险详情 - {risk.title}</h2>
        <div>
          {risk.status === 'open' && (
            <>
              <button className="btn btn-success" onClick={() => handleConfirm(false)} style={{ marginRight: '8px' }}>
                确认风险
              </button>
              <button className="btn btn-secondary" onClick={() => handleConfirm(true)} style={{ marginRight: '8px' }}>
                标记误判
              </button>
            </>
          )}
          {(risk.status === 'open' || risk.status === 'confirmed') && (
            <button className="btn btn-warning" onClick={() => setShowRectModal(true)} style={{ marginRight: '8px' }}>
              创建整改
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/risks')}>返回</button>
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
            <div style={{ fontWeight: 'bold' }}>{risk.id}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>风险等级</div>
            <div><span className={`status-badge risk-${risk.risk_level}`}>{risk.risk_level}</span></div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>状态</div>
            <div><span className={`status-badge status-${risk.status}`}>{statusLabels[risk.status]}</span></div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>关联审计</div>
            <div>{risk.audit_title || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>规则</div>
            <div>{risk.rule_name || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>检测时间</div>
            <div>{new Date(risk.created_at).toLocaleString()}</div>
          </div>
        </div>
        {risk.matched_text && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>🔍 匹配到的敏感内容</div>
            <div style={{ 
              background: '#fff3cd', 
              padding: '16px', 
              borderRadius: '8px',
              border: '2px solid #ffc107',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#856404'
            }}>
              📌 {risk.matched_text}
            </div>
          </div>
        )}
        {risk.location && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>📍 匹配位置</div>
            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '4px', color: '#0d47a1' }}>
              {risk.location}
            </div>
          </div>
        )}
        {risk.description && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>📝 检测说明</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{risk.description}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>📄 原始材料</h3>
        {risk.materials?.length > 0 ? (
          risk.materials.map(m => (
            <div key={m.id} style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#2c3e50' }}>
                📎 {m.title} <span style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 'normal' }}>({m.type})</span>
              </div>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {highlightMatchedText(m.content, risk.matched_text)}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">暂无关联材料</div>
        )}
      </div>

      <div className="card">
        <h3>整改任务</h3>
        {risk.rectifications?.length > 0 ? (
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
              {risk.rectifications.map(r => (
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
        {risk.logs?.length > 0 ? (
          <div className="timeline">
            {risk.logs.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                <div className="action">{log.action}</div>
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

export default RiskDetail;
