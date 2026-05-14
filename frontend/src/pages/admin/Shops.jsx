import React, { useEffect, useState, useRef } from 'react';
import { shopAPI } from '../../utils/api';
import { useToastStore } from '../../store/auth';

function AdminShops() {
  const { addToast } = useToastStore();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    address: ''
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let cancelled = false;
    setLoading(true);
    try {
      const res = await shopAPI.getList();
      if (cancelled) return;
      setShops(res.data || []);
    } catch (err) {
      if (cancelled) return;
      setError(err.message || '加载失败');
    } finally {
      if (cancelled) return;
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      if (editingShop) {
        await shopAPI.update(editingShop.id, formData);
        addToast('店铺更新成功', 'success');
      } else {
        await shopAPI.create(formData);
        addToast('店铺创建成功', 'success');
      }
      setShowModal(false);
      setEditingShop(null);
      resetForm();
      loadData();
    } catch (err) {
      addToast(err.message || '操作失败', 'error');
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      description: shop.description || '',
      logo_url: shop.logo_url || '',
      address: shop.address || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', logo_url: '', address: '' });
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>店铺管理</h2>
        <button className="btn" onClick={() => { resetForm(); setShowModal(true); }}>
          新建店铺
        </button>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn" onClick={loadData}>重试</button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>地址</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>暂无数据</td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id}>
                  <td>{shop.name}</td>
                  <td>{shop.description}</td>
                  <td>{shop.address}</td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(shop)} style={{ marginRight: '8px', padding: '4px 12px' }}>
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingShop ? '编辑店铺' : '新建店铺'}</h3>
            <div style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">名称</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="店铺名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="店铺描述"
                />
              </div>
              <div className="form-group">
                <label className="form-label">地址</label>
                <input
                  type="text"
                  className="input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="店铺地址"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn" onClick={handleSubmit} disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? '保存中...' : '保存'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingShop(null); }} style={{ flex: 1 }}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShops;
