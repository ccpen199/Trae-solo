import React, { useEffect, useState, useRef } from 'react';
import { activityAPI, couponAPI } from '../../utils/api';
import { useToastStore } from '../../store/auth';

function AdminActivities() {
  const { addToast } = useToastStore();
  const [activities, setActivities] = useState([]);
  const [couponTypes, setCouponTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coupon_type_id: '',
    start_time: '',
    end_time: ''
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
      const [activitiesRes, couponsRes] = await Promise.all([
        activityAPI.getList(),
        couponAPI.getTypes({ status: 'active' }).catch(() => ({ data: [] }))
      ]);
      if (cancelled) return;
      
      setActivities(activitiesRes.data || []);
      setCouponTypes(couponsRes.data || []);
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
        start_time: formData.start_time || null,
        end_time: formData.end_time || null
      };

      if (editingActivity) {
        await activityAPI.update(editingActivity.id, data);
        addToast('活动更新成功', 'success');
      } else {
        await activityAPI.create(data);
        addToast('活动创建成功', 'success');
      }
      setShowModal(false);
      setEditingActivity(null);
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

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
      coupon_type_id: activity.coupon_type_id || '',
      start_time: activity.start_time || '',
      end_time: activity.end_time || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该活动吗？')) return;
    try {
      await activityAPI.delete(id);
      addToast('删除成功', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', coupon_type_id: '', start_time: '', end_time: '' });
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>活动管理</h2>
        <button className="btn" onClick={() => { resetForm(); setShowModal(true); }}>
          新建活动
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
              <th>关联优惠券</th>
              <th>时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>暂无数据</td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.name}</td>
                  <td>{activity.description}</td>
                  <td>{activity.coupon_name ? `${activity.coupon_name} (¥${activity.coupon_amount})` : '-'}</td>
                  <td>
                    {activity.start_time && activity.end_time
                      ? `${activity.start_time} ~ ${activity.end_time}`
                      : '长期有效'}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: activity.status === 'active' ? '#f6ffed' : '#fff1f0',
                      color: activity.status === 'active' ? '#52c41a' : '#ff4d4f'
                    }}>
                      {activity.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(activity)} style={{ marginRight: '8px', padding: '4px 12px' }}>
                      编辑
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(activity.id)} style={{ padding: '4px 12px' }}>
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
            <h3>{editingActivity ? '编辑活动' : '新建活动'}</h3>
            <div style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">名称</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="活动名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="活动描述"
                />
              </div>
              <div className="form-group">
                <label className="form-label">关联优惠券</label>
                <select
                  className="input"
                  value={formData.coupon_type_id}
                  onChange={(e) => setFormData({ ...formData, coupon_type_id: e.target.value })}
                >
                  <option value="">不关联</option>
                  {couponTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} (¥{type.amount})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">开始时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn" onClick={handleSubmit} disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? '保存中...' : '保存'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingActivity(null); }} style={{ flex: 1 }}>
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

export default AdminActivities;
