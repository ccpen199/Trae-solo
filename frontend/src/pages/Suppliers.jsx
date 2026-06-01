import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../api.js';

function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    region: '',
    risk_level: '',
    is_key_supplier: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    region: '',
    product_category: '',
    contract_amount: '',
    risk_level: 'medium',
    is_key_supplier: false,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'active'
  });

  useEffect(() => {
    loadSuppliers();
  }, [filters]);

  const loadSuppliers = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const res = await suppliersAPI.getAll(params);
      setSuppliers(res.data);
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      setShowModal(false);
      loadSuppliers();
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await suppliersAPI.delete(deletingId);
      loadSuppliers();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      industry: '',
      region: '',
      product_category: '',
      contract_amount: '',
      risk_level: 'medium',
      is_key_supplier: false,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      status: 'active'
    });
  };

  const getRiskBadge = (level) => {
    const badges = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger'
    };
    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    };
    return <span className={`badge ${badges[level] || 'badge-secondary'}`}>{labels[level] || level}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>供应商管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 新增供应商
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="搜索供应商名称/联系人"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="form-group">
            <select
              className="form-control"
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            >
              <option value="">所有行业</option>
              <option value="信息技术">信息技术</option>
              <option value="制造业">制造业</option>
              <option value="互联网">互联网</option>
              <option value="能源">能源</option>
              <option value="金融">金融</option>
            </select>
          </div>
          <div className="form-group">
            <select
              className="form-control"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="">所有地区</option>
              <option value="华东">华东</option>
              <option value="华南">华南</option>
              <option value="华北">华北</option>
              <option value="华中">华中</option>
              <option value="西南">西南</option>
            </select>
          </div>
          <div className="form-group">
            <select
              className="form-control"
              value={filters.risk_level}
              onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            >
              <option value="">所有风险等级</option>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
            </select>
          </div>
          <div className="form-group">
            <select
              className="form-control"
              value={filters.is_key_supplier}
              onChange={(e) => setFilters({ ...filters, is_key_supplier: e.target.value })}
            >
              <option value="">全部</option>
              <option value="true">关键供应商</option>
              <option value="false">普通供应商</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>供应商名称</th>
              <th>行业</th>
              <th>地区</th>
              <th>供货品类</th>
              <th>合同金额</th>
              <th>风险等级</th>
              <th>联系人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>
                  {supplier.name}
                  {supplier.is_key_supplier && <span className="key-supplier">关键</span>}
                </td>
                <td>{supplier.industry}</td>
                <td>{supplier.region}</td>
                <td>{supplier.product_category}</td>
                <td>{supplier.contract_amount?.toLocaleString()}</td>
                <td>{getRiskBadge(supplier.risk_level)}</td>
                <td>
                  <div>{supplier.contact_name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{supplier.contact_email}</div>
                </td>
                <td>
                  <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                    详情
                  </button>
                  <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                    onClick={() => handleEdit(supplier)}>
                    编辑
                  </button>
                  <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => handleDeleteClick(supplier.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSupplier ? '编辑供应商' : '新增供应商'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>供应商名称 *</label>
                    <input type="text" className="form-control" required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>行业</label>
                    <select className="form-control"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="信息技术">信息技术</option>
                      <option value="制造业">制造业</option>
                      <option value="互联网">互联网</option>
                      <option value="能源">能源</option>
                      <option value="金融">金融</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>地区</label>
                    <select className="form-control"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="华东">华东</option>
                      <option value="华南">华南</option>
                      <option value="华北">华北</option>
                      <option value="华中">华中</option>
                      <option value="西南">西南</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>供货品类</label>
                    <input type="text" className="form-control"
                      value={formData.product_category}
                      onChange={(e) => setFormData({ ...formData, product_category: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>合同金额</label>
                    <input type="number" className="form-control"
                      value={formData.contract_amount}
                      onChange={(e) => setFormData({ ...formData, contract_amount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>风险等级</label>
                    <select className="form-control"
                      value={formData.risk_level}
                      onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}>
                      <option value="low">低风险</option>
                      <option value="medium">中风险</option>
                      <option value="high">高风险</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox"
                      checked={formData.is_key_supplier}
                      onChange={(e) => setFormData({ ...formData, is_key_supplier: e.target.checked })} />
                    &nbsp;关键供应商（优先评估）
                  </label>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>联系人</label>
                    <input type="text" className="form-control"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>联系电话</label>
                    <input type="text" className="form-control"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>联系邮箱</label>
                  <input type="email" className="form-control"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>确定要删除该供应商吗？此操作不可撤销。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowDeleteConfirm(false)}>取消</button>
              <button className="btn btn-danger" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
