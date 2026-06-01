import React, { useState, useEffect } from 'react';
import { configAPI } from '../api.js';

function ConfigPage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [operationLogs, setOperationLogs] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ rule_name: '', category: '', rule_type: 'permission', rule_content: '', description: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });

  useEffect(() => {
    if (activeTab === 'rules') loadRules();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'operation') loadOperationLogs();
  }, [activeTab]);

  const loadRules = async () => {
    try {
      const response = await configAPI.getRules();
      setRules(response.data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await configAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await configAPI.getAuditLogs(pagination);
      setAuditLogs(response.data.list || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const loadOperationLogs = async () => {
    try {
      const response = await configAPI.getOperationLogs(pagination);
      setOperationLogs(response.data || []);
    } catch (error) {
      console.error('Failed to load operation logs:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.rule_name || !newRule.rule_content) {
      alert('请填写必填字段');
      return;
    }
    try {
      await configAPI.createRule(newRule);
      setShowRuleModal(false);
      setNewRule({ rule_name: '', category: '', rule_type: 'permission', rule_content: '', description: '' });
      loadRules();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleToggleRuleStatus = async (rule) => {
    try {
      await configAPI.updateRule(rule.id, { status: rule.status === 'active' ? 'inactive' : 'active' });
      loadRules();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const roleLabels = {
    platform_engineer: '平台工程师',
    ops: '运维',
    developer: '开发者',
    app_owner: '应用负责人',
    security_admin: '安全管理员'
  };

  const ruleTypeLabels = {
    permission: '权限规则',
    category: '分类规则',
    security: '安全规则',
    workflow: '工作流规则'
  };

  return (
    <div>
      <div className="card">
        <div className="tabs">
          <div className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>配置规则</div>
          <div className={`tab-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>用户管理</div>
          <div className={`tab-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>权限审计</div>
          <div className={`tab-item ${activeTab === 'operation' ? 'active' : ''}`} onClick={() => setActiveTab('operation')}>操作日志</div>
        </div>

        {activeTab === 'rules' && (
          <div>
            <div className="flex flex-between items-center mb-md">
              <h3 className="card-title" style={{ margin: 0 }}>配置规则</h3>
              <button className="btn btn-primary" onClick={() => setShowRuleModal(true)}>+ 新建规则</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>规则名称</th>
                  <th>分类</th>
                  <th>类型</th>
                  <th>责任人</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.rule_name}</td>
                    <td><span className="tag tag-blue">{rule.category}</span></td>
                    <td><span className="tag tag-green">{ruleTypeLabels[rule.rule_type]}</span></td>
                    <td>{rule.owner_name || '-'}</td>
                    <td>{rule.valid_from || '-'} ~ {rule.valid_to || '永久'}</td>
                    <td><span className={`status ${rule.status === 'active' ? 'status-success' : 'status-closed'}`}>{rule.status === 'active' ? '启用' : '停用'}</span></td>
                    <td>{rule.created_at}</td>
                    <td>
                      <button className="btn btn-sm" style={{ background: rule.status === 'active' ? '#f5222d' : '#52c41a', color: 'white' }} onClick={() => handleToggleRuleStatus(rule)}>
                        {rule.status === 'active' ? '停用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 className="card-title">用户列表</h3>
            <table>
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td><span className={`role-badge role-${user.role}`}>{roleLabels[user.role]}</span></td>
                    <td>{user.email}</td>
                    <td><span className={`status ${user.status === 'active' ? 'status-success' : 'status-closed'}`}>{user.status === 'active' ? '启用' : '禁用'}</span></td>
                    <td>{user.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <h3 className="card-title">权限审计日志</h3>
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>操作</th>
                  <th>资源类型</th>
                  <th>IP地址</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.user_name}</td>
                    <td>{log.action}</td>
                    <td>{log.resource_type}</td>
                    <td>{log.ip_address || '-'}</td>
                    <td>{log.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'operation' && (
          <div>
            <h3 className="card-title">操作日志</h3>
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>操作</th>
                  <th>模块</th>
                  <th>详情</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {operationLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.user_name}</td>
                    <td>{log.operation}</td>
                    <td><span className="tag tag-blue">{log.module}</span></td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '-'}</td>
                    <td>{log.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">新建配置规则</h3>
              <button className="modal-close" onClick={() => setShowRuleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">规则名称 *</label>
                <input className="form-input" value={newRule.rule_name} onChange={(e) => setNewRule(p => ({ ...p, rule_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">分类 *</label>
                <input className="form-input" value={newRule.category} onChange={(e) => setNewRule(p => ({ ...p, category: e.target.value }))} placeholder="如: 生产环境" />
              </div>
              <div className="form-group">
                <label className="form-label">规则类型</label>
                <select className="form-select" value={newRule.rule_type} onChange={(e) => setNewRule(p => ({ ...p, rule_type: e.target.value }))}>
                  <option value="permission">权限规则</option>
                  <option value="category">分类规则</option>
                  <option value="security">安全规则</option>
                  <option value="workflow">工作流规则</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">规则内容 *</label>
                <textarea className="form-input" rows={4} value={newRule.rule_content} onChange={(e) => setNewRule(p => ({ ...p, rule_content: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea className="form-input" rows={2} value={newRule.description} onChange={(e) => setNewRule(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowRuleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateRule}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigPage;
