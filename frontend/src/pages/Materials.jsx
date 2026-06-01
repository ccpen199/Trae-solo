import React, { useState, useEffect } from 'react';
import { materialsApi } from '../api.js';

const typeLabels = {
  policy: '制度材料',
  regulation: '监管要求',
  document: '审计文档',
  evidence: '复核证据'
};

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [filters, setFilters] = useState({ type: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'document',
    content: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [filters]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await materialsApi.getAll(params);
      if (res.data.success) {
        setMaterials(res.data.data);
      }
    } catch (error) {
      console.error('加载材料列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('type', newMaterial.type);
      formData.append('content', newMaterial.content);
      formData.append('uploaded_by', '1');
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await materialsApi.create(formData);
      if (res.data.success) {
        setShowUploadModal(false);
        setNewMaterial({ title: '', type: 'document', content: '' });
        setSelectedFile(null);
        loadMaterials();
      }
    } catch (error) {
      alert('上传失败: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>📁 材料管理</h2>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          + 上传材料
        </button>
      </div>

      <div className="filter-bar">
        <select 
          value={filters.type} 
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">全部类型</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : materials.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>类型</th>
                <th>文件名</th>
                <th>版本</th>
                <th>上传时间</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.title}</td>
                  <td><span className="tag">{typeLabels[m.type] || m.type}</span></td>
                  <td>{m.file_name || '-'}</td>
                  <td>v{m.version}</td>
                  <td>{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无材料记录</div>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>上传材料</h3>
            <div className="form-group">
              <label>标题 *</label>
              <input 
                type="text" 
                value={newMaterial.title}
                onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                placeholder="请输入材料标题"
              />
            </div>
            <div className="form-group">
              <label>类型 *</label>
              <select 
                value={newMaterial.type}
                onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })}
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea 
                value={newMaterial.content}
                onChange={e => setNewMaterial({ ...newMaterial, content: e.target.value })}
                placeholder="请输入材料内容（或上传文件）"
              />
            </div>
            <div className="form-group">
              <label>上传文件</label>
              <input 
                type="file"
                onChange={e => setSelectedFile(e.target.files[0])}
              />
              {selectedFile && <div style={{ marginTop: '8px', fontSize: '14px' }}>已选择: {selectedFile.name}</div>}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleUpload}>上传</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Materials;
