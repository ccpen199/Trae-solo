import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Plus } from 'lucide-react';

function Configuration() {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'category',
    pattern: '',
    priority: '0',
    owner_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        apiService.getClassificationRules(),
        apiService.getUsers()
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createClassificationRule(formData);
      setShowModal(false);
      setFormData({
        rule_name: '',
        rule_type: 'category',
        pattern: '',
        priority: '0',
        owner_id: ''
      });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">系统配置</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>分类规则</button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>系统信息</button>
      </div>

      {activeTab === 'rules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> 新建规则
            </button>
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>规则名称</th>
                    <th>规则类型</th>
                    <th>匹配模式</th>
                    <th>优先级</th>
                    <th>责任人</th>
                    <th>状态</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id}>
                      <td>{rule.rule_name}</td>
                      <td>{rule.rule_type}</td>
                      <td>{rule.pattern || '-'}</td>
                      <td>{rule.priority}</td>
                      <td>{users.find(u => u.id === rule.owner_id)?.name || '-'}</td>
                      <td>
                        <span className={`badge badge-${rule.status === 'active' ? 'active' : 'inactive'}`}>
                          {rule.status === 'active' ? '启用' : '停用'}
                        </span>
                      </td>
                      <td>{new Date(rule.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr><td colSpan="7" className="empty-state">暂无分类规则</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">系统名称</span>
              <span className="value">内部软件资产台账系统</span>
            </div>
            <div className="detail-item">
              <span className="label">版本</span>
              <span className="value">v1.0.0</span>
            </div>
            <div className="detail-item">
              <span className="label">数据库</span>
              <span className="value">SQLite</span>
            </div>
            <div className="detail-item">
              <span className="label">前端框架</span>
              <span className="value">React + Vite</span>
            </div>
            <div className="detail-item">
              <span className="label">后端框架</span>
              <span className="value">Node.js + Express</span>
            </div>
            <div className="detail-item">
              <span className="label">项目ID</span>
              <span className="value">may-63390</span>
            </div>
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>功能特性</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>应用接入与环境管理</li>
            <li>版本与密钥管理</li>
            <li>变更单流程管理（创建-提交-执行-复核-退回-关闭）</li>
            <li>执行任务与调用日志</li>
            <li>告警记录与处理</li>
            <li>权限管理与审计</li>
            <li>分类规则配置</li>
            <li>数据导出功能</li>
          </ul>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建分类规则</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>规则名称 *</label>
                    <input required value={formData.rule_name} onChange={e => setFormData({...formData, rule_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>规则类型</label>
                    <select value={formData.rule_type} onChange={e => setFormData({...formData, rule_type: e.target.value})}>
                      <option value="category">应用分类</option>
                      <option value="priority">优先级</option>
                      <option value="approval">审批流程</option>
                      <option value="notification">通知</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>匹配模式</label>
                    <input value={formData.pattern} onChange={e => setFormData({...formData, pattern: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>优先级</label>
                    <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>责任人</label>
                  <select value={formData.owner_id} onChange={e => setFormData({...formData, owner_id: e.target.value})}>
                    <option value="">请选择</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuration;
