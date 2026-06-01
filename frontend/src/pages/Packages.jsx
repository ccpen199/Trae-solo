import React, { useState, useEffect } from 'react';
import { packageAPI } from '../api.js';

function Packages({ user }) {
  const [packages, setPackages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_audience: '',
    contraindications: '',
    price: '',
    preparation: '',
    items: [{ name: '', category: '', description: '', reference_range: '', unit: '', is_key: false }]
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await packageAPI.getAll();
      setPackages(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载套餐失败' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPackage) {
        await packageAPI.update(editingPackage.id, formData);
        setMessage({ type: 'success', text: '套餐更新成功，已创建新版本' });
      } else {
        await packageAPI.create(formData);
        setMessage({ type: 'success', text: '套餐创建成功' });
      }
      loadPackages();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    packageAPI.get(pkg.id).then(res => {
      setFormData({
        name: res.data.name,
        description: res.data.description || '',
        target_audience: res.data.target_audience || '',
        contraindications: res.data.contraindications || '',
        price: res.data.price,
        preparation: res.data.preparation || '',
        items: res.data.items.length > 0 ? res.data.items : [{ name: '', category: '', description: '', reference_range: '', unit: '', is_key: false }]
      });
      setShowModal(true);
    });
  };

  const handlePublish = async (id, publish) => {
    try {
      if (publish) {
        await packageAPI.publish(id);
      } else {
        await packageAPI.unpublish(id);
      }
      loadPackages();
      setMessage({ type: 'success', text: publish ? '发布成功' : '下架成功' });
    } catch (err) {
      setMessage({ type: 'error', text: '操作失败' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个套餐吗？')) {
      try {
        await packageAPI.delete(id);
        loadPackages();
        setMessage({ type: 'success', text: '删除成功' });
      } catch (err) {
        setMessage({ type: 'error', text: '删除失败' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_audience: '',
      contraindications: '',
      price: '',
      preparation: '',
      items: [{ name: '', category: '', description: '', reference_range: '', unit: '', is_key: false }]
    });
    setEditingPackage(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', category: '', description: '', reference_range: '', unit: '', is_key: false }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="page-title" style={{ margin: 0 }}>套餐管理</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 新建套餐
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>套餐名称</th>
              <th>价格</th>
              <th>版本</th>
              <th>项目数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg => (
              <tr key={pkg.id}>
                <td>
                  <div className="font-bold">{pkg.name}</div>
                  <div className="text-xs text-gray">{pkg.description}</div>
                </td>
                <td>¥{Number(pkg.price).toFixed(2)}</td>
                <td>v{pkg.version}</td>
                <td>{pkg.item_count}</td>
                <td>
                  <span className={`badge ${pkg.is_published ? 'badge-success' : 'badge-gray'}`}>
                    {pkg.is_published ? '已发布' : '未发布'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(pkg)}>编辑</button>
                  <button 
                    className={`btn ${pkg.is_published ? 'btn-warning' : 'btn-success'} btn-sm`} 
                    onClick={() => handlePublish(pkg.id, !pkg.is_published)}
                  >
                    {pkg.is_published ? '下架' : '发布'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pkg.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingPackage ? '编辑套餐' : '新建套餐'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>套餐名称 *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>价格 *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>适用人群</label>
                  <input 
                    type="text" 
                    value={formData.target_audience}
                    onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>套餐描述</label>
                <textarea 
                  rows="2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>禁忌事项</label>
                  <textarea 
                    rows="2"
                    value={formData.contraindications}
                    onChange={e => setFormData({ ...formData, contraindications: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>准备事项</label>
                  <textarea 
                    rows="2"
                    value={formData.preparation}
                    onChange={e => setFormData({ ...formData, preparation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label>检查项目</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ 添加项目</button>
                </div>
                <div className="item-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input 
                        placeholder="项目名称" 
                        value={item.name}
                        onChange={e => updateItem(index, 'name', e.target.value)}
                      />
                      <input 
                        placeholder="分类" 
                        value={item.category}
                        onChange={e => updateItem(index, 'category', e.target.value)}
                      />
                      <input 
                        placeholder="参考范围" 
                        value={item.reference_range}
                        onChange={e => updateItem(index, 'reference_range', e.target.value)}
                      />
                      <input 
                        placeholder="单位" 
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs">
                          <input 
                            type="checkbox" 
                            checked={item.is_key}
                            onChange={e => updateItem(index, 'is_key', e.target.checked)}
                          /> 关键
                        </label>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Packages;
