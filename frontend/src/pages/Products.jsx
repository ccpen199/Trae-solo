import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api.js';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  const [productForm, setProductForm] = useState({ code: '', name: '', description: '' });
  const [materialForm, setMaterialForm] = useState({ code: '', name: '', type: '原料', supplier: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const productsData = await apiGet('/products');
    const materialsData = await apiGet('/materials');
    setProducts(productsData);
    setMaterials(materialsData);
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    await apiPost('/products', productForm);
    setProductForm({ code: '', name: '', description: '' });
    setShowProductForm(false);
    loadData();
  }

  async function handleMaterialSubmit(e) {
    e.preventDefault();
    await apiPost('/materials', materialForm);
    setMaterialForm({ code: '', name: '', type: '原料', supplier: '' });
    setShowMaterialForm(false);
    loadData();
  }

  return (
    <div>
      <div className="header">
        <h1>产品和原料管理</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>产品列表</div>
        <div className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>原料列表</div>
      </div>

      {activeTab === 'products' && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <button className="btn btn-primary" onClick={() => setShowProductForm(!showProductForm)}>
              {showProductForm ? '取消' : '+ 添加产品'}
            </button>
          </div>

          {showProductForm && (
            <form onSubmit={handleProductSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>产品编码</label>
                  <input required value={productForm.code} onChange={e => setProductForm({ ...productForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>产品名称</label>
                  <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <input value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">保存</button>
              </div>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>编码</th>
                <th>名称</th>
                <th>描述</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td><span className="badge badge-success">{p.status === 'active' ? '活跃' : p.status}</span></td>
                  <td>{p.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <button className="btn btn-primary" onClick={() => setShowMaterialForm(!showMaterialForm)}>
              {showMaterialForm ? '取消' : '+ 添加原料'}
            </button>
          </div>

          {showMaterialForm && (
            <form onSubmit={handleMaterialSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>原料编码</label>
                  <input required value={materialForm.code} onChange={e => setMaterialForm({ ...materialForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>原料名称</label>
                  <input required value={materialForm.name} onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>类型</label>
                  <select value={materialForm.type} onChange={e => setMaterialForm({ ...materialForm, type: e.target.value })}>
                    <option value="原料">原料</option>
                    <option value="辅料">辅料</option>
                    <option value="包装材料">包装材料</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>供应商</label>
                  <input value={materialForm.supplier} onChange={e => setMaterialForm({ ...materialForm, supplier: e.target.value })} />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">保存</button>
              </div>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>编码</th>
                <th>名称</th>
                <th>类型</th>
                <th>供应商</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td>{m.name}</td>
                  <td><span className="badge badge-info">{m.type}</span></td>
                  <td>{m.supplier}</td>
                  <td>{m.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
