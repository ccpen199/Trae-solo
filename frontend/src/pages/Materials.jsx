import React, { useState, useEffect } from 'react';
import { materialsAPI, resourcesAPI } from '../api/index.js';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [resources, setResources] = useState([]);
  const [filterResource, setFilterResource] = useState('');
  const [showExpired, setShowExpired] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    resource_id: '',
    type: 'image',
    name: '',
    url: '',
    content: '',
    copyright: '',
    channels: '',
    expire_at: ''
  });

  useEffect(() => {
    fetchMaterials();
    fetchResources();
  }, [filterResource, showExpired]);

  const fetchMaterials = async () => {
    try {
      const expiredParam = showExpired === 'all' ? undefined : showExpired === 'expired';
      const response = await materialsAPI.getAll(filterResource || undefined, expiredParam);
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await resourcesAPI.getAll();
      setResources(response.data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const isExpired = (material) => {
    if (!material.expire_at) return false;
    return new Date(material.expire_at) < new Date();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await materialsAPI.update(editingMaterial.id, formData);
      } else {
        await materialsAPI.create(formData);
      }
      fetchMaterials();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save material:', error);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      resource_id: material.resource_id || '',
      type: material.type,
      name: material.name,
      url: material.url || '',
      content: material.content || '',
      copyright: material.copyright || '',
      channels: material.channels || '',
      expire_at: material.expire_at ? material.expire_at.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个素材吗？')) {
      try {
        await materialsAPI.delete(id);
        fetchMaterials();
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      resource_id: '',
      type: 'image',
      name: '',
      url: '',
      content: '',
      copyright: '',
      channels: '',
      expire_at: ''
    });
    setEditingMaterial(null);
  };

  const getTypeIcon = (type) => {
    const icons = {
      image: '🖼️',
      video: '🎬',
      text: '📝',
      copy: '📄'
    };
    return icons[type] || '📁';
  };

  const getTypeName = (type) => {
    const names = {
      image: '图片',
      video: '视频',
      text: '文案',
      copy: '软文'
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <h2>📁 素材库管理</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 添加素材
        </button>
      </div>

      <div className="filter-bar">
        <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)}>
          <option value="">全部资源</option>
          {resources.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select value={showExpired} onChange={(e) => setShowExpired(e.target.value)}>
          <option value="all">全部状态</option>
          <option value="valid">有效素材</option>
          <option value="expired">过期素材</option>
        </select>
      </div>

      <div className="material-grid">
        {materials.map(material => (
          <div key={material.id} className={`material-card ${isExpired(material) ? 'expired' : ''}`}>
            <div className="material-preview">
              {getTypeIcon(material.type)}
            </div>
            <div className="material-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div className="material-name">{material.name}</div>
                {isExpired(material) && <span className="expired-badge">已过期</span>}
              </div>
              <div className="material-meta">
                <div>{getTypeName(material.type)}</div>
                {material.copyright && <div>© {material.copyright}</div>}
                {material.channels && <div>渠道: {material.channels}</div>}
                {material.expire_at && <div>有效期至: {material.expire_at.split('T')[0]}</div>}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-small btn-secondary" onClick={() => handleEdit(material)}>
                  编辑
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(material.id)}>
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMaterial ? '编辑素材' : '添加素材'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>素材类型</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="image">图片</option>
                      <option value="video">视频</option>
                      <option value="text">文案</option>
                      <option value="copy">软文</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>关联资源</label>
                    <select value={formData.resource_id} onChange={(e) => setFormData({...formData, resource_id: e.target.value})}>
                      <option value="">不关联资源</option>
                      {resources.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>素材名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                {formData.type === 'image' || formData.type === 'video' ? (
                  <div className="form-group">
                    <label>URL 地址</label>
                    <input type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>内容</label>
                    <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows="5" />
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>版权信息</label>
                    <input type="text" value={formData.copyright} onChange={(e) => setFormData({...formData, copyright: e.target.value})} placeholder="如：官方版权" />
                  </div>
                  <div className="form-group">
                    <label>适用渠道</label>
                    <input type="text" value={formData.channels} onChange={(e) => setFormData({...formData, channels: e.target.value})} placeholder="如：微信、小红书、抖音" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>过期时间</label>
                  <input type="date" value={formData.expire_at} onChange={(e) => setFormData({...formData, expire_at: e.target.value})} />
                  <small style={{ color: '#718096' }}>过期素材将不能用于新线路</small>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">{editingMaterial ? '保存' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Materials;
