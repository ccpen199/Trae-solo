import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, commonAPI } from '../api';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [saveMsg, setSaveMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', coverage_scope: '',
    duration_months: 12, price: '', deductible: 0, max_service_count: 1, status: 'active'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const productsRes = await productsAPI.getAll(params);
      const categoriesRes = await commonAPI.getCategories();
      const raw = productsRes;
      const list = raw && raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
      setProducts(Array.isArray(list) ? list : []);
      const cats = categoriesRes && categoriesRes.data ? categoriesRes.data : (Array.isArray(categoriesRes) ? categoriesRes : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      console.error('加载产品失败', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
        setSaveMsg('产品更新成功！已保存：' + formData.name);
      } else {
        await productsAPI.create(formData);
        setSaveMsg('产品新增成功！已登记：' + formData.name);
      }
      setShowModal(false);
      setEditingProduct(null);
      loadData();
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '', description: '', category: '', coverage_scope: '',
      duration_months: 12, price: '', deductible: 0, max_service_count: 1, status: 'active'
    });
  };

  return (
    <div>
      {saveMsg && (
        <div style={{background:'#f6ffed',border:'1px solid #b7eb8f',padding:'12px 20px',borderRadius:'6px',marginBottom:'16px',color:'#389e0d',fontWeight:600}}>
          ✓ {saveMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>延保产品管理</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + 新增产品
          </button>
        </div>

        <div className="search-bar">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="active">上架中</option>
            <option value="inactive">已下架</option>
            <option value="">全部</option>
          </select>
          <button className="btn btn-default" onClick={loadData}>刷新</button>
        </div>

        {loading ? <div style={{padding:'40px',textAlign:'center',color:'#999'}}>加载中...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>产品名称</th>
              <th>分类</th>
              <th>保障范围</th>
              <th>期限</th>
              <th>价格</th>
              <th>免赔额</th>
              <th>服务次数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan="9" style={{textAlign:'center',color:'#999',padding:'40px'}}>暂无产品数据</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><br/><span style={{fontSize:'12px',color:'#999'}}>{p.description}</span></td>
                <td><span className="tag tag-info">{p.category}</span></td>
                <td style={{maxWidth:'200px',fontSize:'12px'}}>{p.coverage_scope}</td>
                <td>{p.duration_months}个月</td>
                <td>¥{p.price}</td>
                <td>¥{p.deductible || 0}</td>
                <td>{p.max_service_count}次</td>
                <td><span className={`tag ${p.status === 'active' ? 'tag-success' : 'tag-default'}`}>{p.status === 'active' ? '上架' : '下架'}</span></td>
                <td><button className="btn btn-default btn-sm" onClick={() => handleEdit(p)}>编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '编辑产品' : '新增产品'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>产品名称 *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>品类 *</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                      <option value="">请选择</option>
                      <option value="大家电">大家电</option>
                      <option value="冰箱">冰箱</option>
                      <option value="空调">空调</option>
                      <option value="洗衣机">洗衣机</option>
                      <option value="电视">电视</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>产品描述</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>保障范围 *</label>
                  <textarea value={formData.coverage_scope} onChange={(e) => setFormData({...formData, coverage_scope: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>保障期限(月) *</label>
                    <input type="number" value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: parseInt(e.target.value)||12})} required />
                  </div>
                  <div className="form-group">
                    <label>价格(元) *</label>
                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)||0})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>免赔额(元)</label>
                    <input type="number" step="0.01" value={formData.deductible} onChange={(e) => setFormData({...formData, deductible: parseFloat(e.target.value)||0})} />
                  </div>
                  <div className="form-group">
                    <label>最大服务次数</label>
                    <input type="number" value={formData.max_service_count} onChange={(e) => setFormData({...formData, max_service_count: parseInt(e.target.value)||1})} />
                  </div>
                </div>
                {editingProduct && (
                  <div className="form-group">
                    <label>状态</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="active">上架</option>
                      <option value="inactive">下架</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? '保存修改' : '新增产品'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
