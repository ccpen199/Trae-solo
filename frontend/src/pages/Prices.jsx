import React, { useState, useEffect } from 'react';
import { prices, materials } from '../api';

export default function Prices() {
  const [list, setList] = useState([]);
  const [materialList, setMaterialList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [form, setForm] = useState({
    material_id: '',
    supplier_id: '',
    batch_no: '',
    price: '',
    currency: 'CNY',
    unit: '',
    valid_from: '',
    valid_to: ''
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    code: '',
    contact: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadList();
    loadMaterials();
    loadSuppliers();
  }, []);

  const loadList = async () => {
    try {
      const res = await prices.getAll();
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await materials.getAll({ status: 'active' });
      setMaterialList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await prices.getSuppliers();
      setSupplierList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await prices.create(form);
      setShowModal(false);
      loadList();
      setForm({ material_id: '', supplier_id: '', batch_no: '', price: '', currency: 'CNY', unit: '', valid_from: '', valid_to: '' });
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await prices.createSupplier(supplierForm);
      setShowSupplierModal(false);
      loadSuppliers();
      setSupplierForm({ name: '', code: '', contact: '', phone: '', email: '', address: '' });
    } catch (err) {
      alert('创建失败');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>原料价格</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setShowSupplierModal(true)}>
            + 新增供应商
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 录入价格
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>原料</th>
              <th>供应商</th>
              <th>批次号</th>
              <th>单价</th>
              <th>币种</th>
              <th>单位</th>
              <th>有效期</th>
              <th>状态</th>
              <th>录入时间</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td>{p.material_name}</td>
                <td>{p.supplier_name || '-'}</td>
                <td>{p.batch_no || '-'}</td>
                <td style={{ fontWeight: 600, color: '#e74c3c' }}>¥{p.price}</td>
                <td>{p.currency}</td>
                <td>{p.unit}</td>
                <td>{p.valid_from || '-'}</td>
                <td>
                  <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {p.is_active ? '生效' : '历史'}
                  </span>
                </td>
                <td>{p.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="9" className="empty-state">暂无价格数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>录入原料价格</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>原料</label>
                  <select required value={form.material_id} 
                    onChange={e => setForm({...form, material_id: e.target.value})}>
                    <option value="">请选择</option>
                    {materialList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>供应商</label>
                  <select value={form.supplier_id} 
                    onChange={e => setForm({...form, supplier_id: e.target.value})}>
                    <option value="">请选择</option>
                    {supplierList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>单价</label>
                  <input type="number" step="0.01" required 
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>单位</label>
                  <input required value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>批次号</label>
                  <input value={form.batch_no}
                    onChange={e => setForm({...form, batch_no: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>币种</label>
                  <select value={form.currency} 
                    onChange={e => setForm({...form, currency: e.target.value})}>
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="EUR">欧元 (EUR)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>生效日期</label>
                  <input type="date" value={form.valid_from}
                    onChange={e => setForm({...form, valid_from: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>失效日期</label>
                  <input type="date" value={form.valid_to}
                    onChange={e => setForm({...form, valid_to: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增供应商</h3>
              <button className="modal-close" onClick={() => setShowSupplierModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>供应商名称</label>
                  <input required value={supplierForm.name} 
                    onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>供应商编码</label>
                  <input value={supplierForm.code}
                    onChange={e => setSupplierForm({...supplierForm, code: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>联系人</label>
                  <input value={supplierForm.contact}
                    onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>电话</label>
                  <input value={supplierForm.phone}
                    onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input type="email" value={supplierForm.email}
                  onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>地址</label>
                <input value={supplierForm.address}
                  onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowSupplierModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
