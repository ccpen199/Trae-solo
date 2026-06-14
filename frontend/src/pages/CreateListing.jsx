import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    price: '',
    price_unit: '次',
    city: '',
    district: '',
    address: '',
    contact_phone: '',
    contact_name: '',
    fields: {},
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/listings/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('加载分类失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/listings', {
        ...formData,
        price: parseFloat(formData.price) || 0
      });
      setSuccess('发布成功！');
      setTimeout(() => navigate(`/listing/${res.data.id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || '发布失败');
    }
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (!user) return null;

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <h2 className="card-title">发布信息</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>选择分类</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入标题（5-100字）"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>价格</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0表示面议"
                />
              </div>
              <div className="form-group">
                <label>价格单位</label>
                <select
                  value={formData.price_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_unit: e.target.value }))}
                >
                  <option value="">无</option>
                  <option value="次">次</option>
                  <option value="小时">小时</option>
                  <option value="天">天</option>
                  <option value="月">月</option>
                  <option value="件">件</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>城市</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="如：广州市"
                />
              </div>
              <div className="form-group">
                <label>区县</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="如：天河区"
                />
              </div>
            </div>

            <div className="form-group">
              <label>详细地址</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="请输入详细地址"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>联系人</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div className="form-group">
                <label>联系电话</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="请输入联系电话"
                />
              </div>
            </div>

            <div className="form-group">
              <label>详细描述</label>
              <textarea
                rows="6"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请详细描述您的服务或需求..."
              />
            </div>

            <div className="form-group">
              <label>标签（如：靠谱、持证、无中介）</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签后按回车添加"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddTag}>
                  添加
                </button>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                {formData.tags.map((tag, i) => (
                  <span key={i} className="tag tag-success" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              发布信息
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;
