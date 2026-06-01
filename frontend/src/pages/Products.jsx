import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', category: '', spec: '', unit: '',
    supplier_id: '', price: '', shelf_life_days: '', min_order_qty: 1, status: 'active'
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCategories();
  }, [statusFilter, categoryFilter]);

  const loadProducts = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    const res = await api.get('/products', { params });
    setProducts(res.data);
  };

  const loadSuppliers = async () => {
    const res = await api.get('/suppliers');
    setSuppliers(res.data);
  };

  const loadCategories = async () => {
    const res = await api.get('/products/categories');
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, formData);
    } else {
      await api.post('/products', formData);
    }
    setShowModal(false);
    loadProducts();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await api.patch(`/products/${id}/status`, { status: newStatus });
    loadProducts();
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      code: '', name: '', category: '', spec: '', unit: '',
      supplier_id: '', price: '', shelf_life_days: '', min_order_qty: 1, status: 'active'
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1>商品目录</h1>
        <button className="btn btn-primary" onClick={openCreate}>新增商品</button>
      </div>
      
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">全部分类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>编码</th>
            <th>名称</th>
            <th>分类</th>
            <th>规格</th>
            <th>单位</th>
            <th>供应商</th>
            <th>价格</th>
            <th>起订量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.spec}</td>
              <td>{p.unit}</td>
              <td>{p.supplier_name}</td>
              <td>¥{p.price}</td>
              <td>{p.min_order_qty}</td>
              <td>
                <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {p.status === 'active' ? '上架' : '下架'}
                </span>
              </td>
              <td>
                <button className="btn btn-sm btn-primary" onClick={() => openEdit(p)}>编辑</button>
                <button 
                  className={`btn btn-sm ${p.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  style={{ marginLeft: '5px' }}
                  onClick={() => toggleStatus(p.id, p.status)}
                >
                  {p.status === 'active' ? '下架' : '上架'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? '编辑商品' : '新增商品'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>商品编码</label>
                  <input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>商品名称</label>
                  <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>分类</label>
                  <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>规格</label>
                  <input value={formData.spec} onChange={(e) => setFormData({...formData, spec: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>单位</label>
                  <input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>供应商</label>
                  <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}>
                    <option value="">请选择</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>价格</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>保质期(天)</label>
                  <input type="number" value={formData.shelf_life_days} onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>起订量</label>
                  <input type="number" value={formData.min_order_qty} onChange={(e) => setFormData({...formData, min_order_qty: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">上架</option>
                  <option value="inactive">下架</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
