import React, { useEffect, useState, useRef } from 'react';
import { couponAPI, shopAPI } from '../../utils/api';
import { useToastStore } from '../../store/auth';

function AdminCoupons() {
  const { addToast } = useToastStore();
  const [coupons, setCoupons] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',
    amount: '',
    min_amount: '',
    max_amount: '',
    total_count: '',
    per_user_limit: 1,
    use_threshold: 0,
    valid_days: 30,
    source: 'platform',
    shop_id: '',
    is_auto_select: false
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
      const [couponsRes, shopsRes] = await Promise.all([
        couponAPI.getTypes(),
        shopAPI.getList().catch(() => ({ data: [] }))
      ]);
      if (cancelled) return;
      
      setCoupons(couponsRes.data || []);
      setShops(shopsRes.data || []);
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
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        min_amount: parseFloat(formData.min_amount) || 0,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        total_count: parseInt(formData.total_count) || 0,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        use_threshold: parseFloat(formData.use_threshold) || 0,
        valid_days: parseInt(formData.valid_days) || 30,
        is_auto_select: formData.is_auto_select
      };

      if (editingCoupon) {
        await couponAPI.updateType(editingCoupon.id, data);
        addToast('优惠券更新成功', 'success');
      } else {
        await couponAPI.createType(data);
        addToast('优惠券创建成功', 'success');
      }

      setShowModal(false);
      setEditingCoupon(null);
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

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      name: coupon.name,
      type: coupon.type,
      amount: coupon.amount,
      min_amount: coupon.min_amount || '',
      max_amount: coupon.max_amount || '',
      total_count: coupon.total_count,
      per_user_limit: coupon.per_user_limit,
      use_threshold: coupon.use_threshold || 0,
      valid_days: coupon.valid_days,
      source: coupon.source,
      shop_id: coupon.shop_id || '',
      is_auto_select: coupon.is_auto_select === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该优惠券类型吗？')) return;
    try {
      await couponAPI.deleteType(id);
      addToast('删除成功', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'fixed',
      amount: '',
      min_amount: '',
      max_amount: '',
      total_count: '',
      per_user_limit: 1,
      use_threshold: 0,
      valid_days: 30,
      source: 'platform',
      shop_id: '',
      is_auto_select: false
    });
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>优惠券类型管理</h2>
        <button className="btn" onClick={() => { resetForm(); setShowModal(true); }}>
          新建优惠券
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
              <th>类型</th>
              <th>金额</th>
              <th>剩余/总量</th>
              <th>来源</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>暂无数据</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.name}</td>
                  <td>{coupon.type === 'random' ? '随机' : '固定'}</td>
                  <td>¥{coupon.amount}</td>
                  <td>{coupon.remain_count}/{coupon.total_count}</td>
                  <td>{coupon.source}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: coupon.status === 'active' ? '#f6ffed' : '#fff1f0',
                      color: coupon.status === 'active' ? '#52c41a' : '#ff4d4f'
                    }}>
                      {coupon.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(coupon)} style={{ marginRight: '8px', padding: '4px 12px' }}>
                      编辑
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(coupon.id)} style={{ padding: '4px 12px' }}>
                      删除
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
            <h3>{editingCoupon ? '编辑优惠券' : '新建优惠券'}</h3>
            <div style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">名称</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="优惠券名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">类型</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="fixed">固定金额</option>
                  <option value="random">随机金额</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">金额</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">最低消费</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  />
                </div>
              </div>
              {formData.type === 'random' && (
                <div className="form-group">
                  <label className="form-label">最大金额</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">总数量</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.total_count}
                    onChange={(e) => setFormData({ ...formData, total_count: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">每人限领</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">有效期(天)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.valid_days}
                    onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">来源</label>
                  <select
                    className="input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="platform">平台发放</option>
                    <option value="shop">进店领取</option>
                    <option value="payment">支付后发放</option>
                    <option value="share">分享红包</option>
                    <option value="activity">活动发放</option>
                    <option value="game">游戏领券</option>
                    <option value="member">会员权益</option>
                    <option value="new_user">新用户</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">所属店铺</label>
                <select
                  className="input"
                  value={formData.shop_id}
                  onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                >
                  <option value="">平台通用</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_auto_select}
                    onChange={(e) => setFormData({ ...formData, is_auto_select: e.target.checked })}
                  />
                  自动选中该优惠券
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn" onClick={handleSubmit} disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? '保存中...' : '保存'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingCoupon(null); }} style={{ flex: 1 }}>
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

export default AdminCoupons;
