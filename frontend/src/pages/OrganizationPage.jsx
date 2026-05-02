import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function OrganizationPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [tree, setTree] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    type: 'department'
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      if (response.data.success) {
        setOrganizations(response.data.data.list || []);
        setTree(response.data.data.tree || []);
      }
    } catch (error) {
      console.error('Fetch organizations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await api.put(`/organizations/${editingOrg.id}`, formData);
      } else {
        await api.post('/organizations', formData);
      }
      setShowModal(false);
      setEditingOrg(null);
      setFormData({ name: '', parentId: '', type: 'department' });
      fetchOrganizations();
    } catch (error) {
      console.error('Save organization error:', error);
    }
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      parentId: org.parent_id || '',
      type: org.type || 'department'
    });
    setShowModal(true);
  };

  const handleDelete = async (org) => {
    if (window.confirm(`确定要删除组织 "${org.name}" 吗？`)) {
      try {
        await api.delete(`/organizations/${org.id}`);
        fetchOrganizations();
      } catch (error) {
        console.error('Delete organization error:', error);
        alert('删除失败：' + (error.response?.data?.error || '未知错误'));
      }
    }
  };

  const renderTreeNode = (node, level = 0) => (
    <div key={node.id} style={{ marginLeft: level * 24 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: level === 0 ? '#fafafa' : 'white'
      }}>
        <span style={{ marginRight: '12px' }}>
          {node.children && node.children.length > 0 ? '📁' : '📂'}
        </span>
        <div style={{ flex: 1 }}>
          <strong>{node.name}</strong>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            类型: {node.type} | 员工数: {node.user_count || 0} | 子部门: {node.child_count || 0}
          </div>
        </div>
        {hasPermission('org:write') && (
          <div>
            <button className="action-btn" onClick={() => handleEdit(node)}>编辑</button>
            <button className="action-btn danger" onClick={() => handleDelete(node)}>删除</button>
          </div>
        )}
      </div>
      {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>组织架构</h1>
        <p>管理企业组织架构，支持多层级部门管理</p>
      </div>
      <div className="page-content">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <input type="text" className="filter-input" placeholder="搜索组织..." />
            <button className="filter-btn">搜索</button>
          </div>
          {hasPermission('org:write') && (
            <button 
              className="filter-btn" 
              onClick={() => {
                setEditingOrg(null);
                setFormData({ name: '', parentId: '', type: 'department' });
                setShowModal(true);
              }}
            >
              + 新增组织
            </button>
          )}
        </div>

        <div className="section">
          <h3 className="section-title">组织树</h3>
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner-large"></div>
              <p style={{ marginTop: '16px' }}>加载中...</p>
            </div>
          ) : tree.length > 0 ? (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
              {tree.map(node => renderTreeNode(node))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p>暂无组织数据</p>
            </div>
          )}
        </div>

        <div className="alert alert-info">
          <strong>功能说明</strong>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            组织架构管理支持：
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>支持同步外部系统组织架构</li>
            <li>支持多层级部门管理</li>
            <li>支持员工所属组织分配</li>
            <li>岗位变动时自动触发权限清理</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOrg ? '编辑组织' : '新增组织'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>组织名称 *</label>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ width: '100%', height: '40px' }}
                    placeholder="请输入组织名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>上级组织</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', height: '40px' }}
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  >
                    <option value="">无（根级组织）</option>
                    {organizations
                      .filter(o => o.id !== editingOrg?.id)
                      .map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>组织类型</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', height: '40px' }}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="department">部门</option>
                    <option value="team">小组</option>
                    <option value="company">公司</option>
                    <option value="root">根级</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="filter-btn"
                >
                  {editingOrg ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationPage;
