import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FactoryList = () => {
  const [factories, setFactories] = useState([]);
  const [filters, setFilters] = useState({
    region: '',
    category: '',
    scale: '',
    verified: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [newFactory, setNewFactory] = useState({
    name: '',
    region: '',
    category: '',
    scale: '',
    equipment: '',
    contact_name: '',
    contact_phone: '',
    main_customers: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadFactories();
  }, [filters]);

  const loadFactories = () => {
    const params = new URLSearchParams();
    if (filters.region) params.append('region', filters.region);
    if (filters.category) params.append('category', filters.category);
    if (filters.scale) params.append('scale', filters.scale);
    if (filters.verified !== '') params.append('verified', filters.verified);

    fetch(`/api/factories?${params.toString()}`)
      .then(res => res.json())
      .then(data => setFactories(data));
  };

  const handleCreateFactory = (e) => {
    e.preventDefault();
    fetch('/api/factories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFactory)
    })
      .then(res => res.json())
      .then(data => {
        setShowModal(false);
        setNewFactory({
          name: '',
          region: '',
          category: '',
          scale: '',
          equipment: '',
          contact_name: '',
          contact_phone: '',
          main_customers: ''
        });
        loadFactories();
      });
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: 0 }}>工厂名录</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新增工厂
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="搜索地区"
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
          />
          <input
            type="text"
            placeholder="搜索品类"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          />
          <select
            value={filters.scale}
            onChange={(e) => setFilters({ ...filters, scale: e.target.value })}
          >
            <option value="">全部规模</option>
            <option value="小型">小型</option>
            <option value="中型">中型</option>
            <option value="大型">大型</option>
          </select>
          <select
            value={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="true">已认证</option>
            <option value="false">待审核</option>
          </select>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>工厂名称</th>
              <th>地区</th>
              <th>品类</th>
              <th>规模</th>
              <th>联系人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {factories.map(factory => (
              <tr key={factory.id}>
                <td>{factory.name}</td>
                <td>{factory.region || '-'}</td>
                <td>{factory.category || '-'}</td>
                <td>{factory.scale || '-'}</td>
                <td>{factory.contact_name || '-'}</td>
                <td>
                  <span className={`badge ${factory.is_verified ? 'badge-success' : 'badge-warning'}`}>
                    {factory.is_verified ? '已认证' : '待审核'}
                  </span>
                </td>
                <td>
                  <Link to={`/factories/${factory.id}`} className="link">查看详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {factories.length === 0 && (
          <div className="empty">暂无工厂数据</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增工厂</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateFactory}>
              <div className="form-grid">
                <div className="form-group">
                  <label>工厂名称 *</label>
                  <input
                    type="text"
                    required
                    value={newFactory.name}
                    onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>地区</label>
                  <input
                    type="text"
                    value={newFactory.region}
                    onChange={(e) => setNewFactory({ ...newFactory, region: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>品类</label>
                  <input
                    type="text"
                    value={newFactory.category}
                    onChange={(e) => setNewFactory({ ...newFactory, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>规模</label>
                  <select
                    value={newFactory.scale}
                    onChange={(e) => setNewFactory({ ...newFactory, scale: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="小型">小型</option>
                    <option value="中型">中型</option>
                    <option value="大型">大型</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>联系人</label>
                  <input
                    type="text"
                    value={newFactory.contact_name}
                    onChange={(e) => setNewFactory({ ...newFactory, contact_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input
                    type="text"
                    value={newFactory.contact_phone}
                    onChange={(e) => setNewFactory({ ...newFactory, contact_phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>主要设备</label>
                  <textarea
                    value={newFactory.equipment}
                    onChange={(e) => setNewFactory({ ...newFactory, equipment: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>主营客户</label>
                  <textarea
                    value={newFactory.main_customers}
                    onChange={(e) => setNewFactory({ ...newFactory, main_customers: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryList;
