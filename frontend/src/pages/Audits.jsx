import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auditsApi, usersApi, materialsApi } from '../api.js';

const statusLabels = {
  draft: '草稿',
  pending: '待审核',
  risk_detected: '风险已发现',
  rectifying: '整改中',
  reviewing: '复核中',
  completed: '已完成',
  rejected: '已驳回'
};

function Audits() {
  const [audits, setAudits] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    assignee_id: '',
    start_date: '',
    end_date: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAudit, setNewAudit] = useState({
    title: '',
    description: '',
    assignee_id: '',
    material_ids: []
  });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAudits();
  }, [filters]);

  const loadData = async () => {
    try {
      const [usersRes, materialsRes] = await Promise.all([
        usersApi.getAll(),
        materialsApi.getAll()
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (materialsRes.data.success) setMaterials(materialsRes.data.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const loadAudits = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await auditsApi.getAll(params);
      if (res.data.success) {
        setAudits(res.data.data);
      }
    } catch (error) {
      console.error('加载审计列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async () => {
    try {
      const res = await auditsApi.create({
        ...newAudit,
        created_by: 1
      });
      if (res.data.success) {
        setShowCreateModal(false);
        setNewAudit({ title: '', description: '', assignee_id: '', material_ids: [] });
        loadAudits();
      }
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>📋 审计台账</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建审计
        </button>
      </div>

      <div className="filter-bar">
        <select 
          value={filters.status} 
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select 
          value={filters.assignee_id} 
          onChange={e => setFilters({ ...filters, assignee_id: e.target.value })}
        >
          <option value="">全部负责人</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <input 
          type="date" 
          value={filters.start_date}
          onChange={e => setFilters({ ...filters, start_date: e.target.value })}
          placeholder="开始日期"
        />
        <input 
          type="date" 
          value={filters.end_date}
          onChange={e => setFilters({ ...filters, end_date: e.target.value })}
          placeholder="结束日期"
        />
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : audits.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>状态</th>
                <th>风险数</th>
                <th>负责人</th>
                <th>创建人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(audit => (
                <tr key={audit.id}>
                  <td>{audit.id}</td>
                  <td>{audit.title}</td>
                  <td><span className={`status-badge status-${audit.status}`}>{statusLabels[audit.status]}</span></td>
                  <td>{audit.risk_count || 0}</td>
                  <td>{audit.assignee_name || '-'}</td>
                  <td>{audit.creator_name || '-'}</td>
                  <td>{new Date(audit.created_at).toLocaleString()}</td>
                  <td><Link to={`/audits/${audit.id}`} className="link">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无审计记录</div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建审计任务</h3>
            <div className="form-group">
              <label>标题 *</label>
              <input 
                type="text" 
                value={newAudit.title}
                onChange={e => setNewAudit({ ...newAudit, title: e.target.value })}
                placeholder="请输入审计标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea 
                value={newAudit.description}
                onChange={e => setNewAudit({ ...newAudit, description: e.target.value })}
                placeholder="请输入审计描述"
              />
            </div>
            <div className="form-group">
              <label>负责人</label>
              <select 
                value={newAudit.assignee_id}
                onChange={e => setNewAudit({ ...newAudit, assignee_id: e.target.value })}
              >
                <option value="">请选择负责人</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>关联材料</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }}>
                {materials.map(m => (
                  <div key={m.id} style={{ marginBottom: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                      <input 
                        type="checkbox"
                        checked={newAudit.material_ids.includes(m.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewAudit({ ...newAudit, material_ids: [...newAudit.material_ids, m.id] });
                          } else {
                            setNewAudit({ ...newAudit, material_ids: newAudit.material_ids.filter(id => id !== m.id) });
                          }
                        }}
                      />
                      {m.title} ({m.type})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateAudit}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Audits;
