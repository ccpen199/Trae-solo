import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Camps({ user }) {
  const [camps, setCamps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_days: 21,
    max_makeup_days: 3,
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCamps();
  }, []);

  const loadCamps = async () => {
    try {
      const res = await axios.get('/api/camps');
      setCamps(res.data);
    } catch (err) {
      console.error('Failed to load camps:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/camps', { ...formData, created_by: user.id });
      setShowModal(false);
      setFormData({
        name: '', description: '', start_date: '', end_date: '',
        total_days: 21, max_makeup_days: 3, status: 'active'
      });
      loadCamps();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (e) => {
    e?.stopPropagation?.();
    console.log('Opening modal, current showModal:', showModal);
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, start_date: today }));
    setShowModal(true);
    console.log('Modal should open now, showModal set to true');
  };

  const statusMap = {
    draft: { label: '草稿', class: 'badge-warning' },
    active: { label: '进行中', class: 'badge-success' },
    completed: { label: '已完成', class: 'badge-info' },
    archived: { label: '已归档', class: 'badge-danger' }
  };

  const rolePermissions = {
    admin: ['create', 'edit', 'delete', 'view'],
    platform: ['create', 'edit', 'view'],
    ops: ['view', 'edit'],
    teacher: ['view'],
    coach: ['view'],
    student: []
  };

  const canCreate = rolePermissions[user.role]?.includes('create') || user.role === 'admin';

  const getProgress = (camp) => {
    const start = new Date(camp.start_date);
    const end = new Date(camp.end_date);
    const now = new Date();
    const totalDays = camp.total_days;
    let elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    elapsed = Math.max(0, Math.min(elapsed, totalDays));
    if (now > end) elapsed = totalDays;
    return Math.round((elapsed / totalDays) * 100);
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ margin: 0 }}>训练营管理</h2>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={openModal}
            style={{ minWidth: 120 }}
          >
            + 新建训练营
          </button>
        )}
      </div>

      {camps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <h3>暂无训练营</h3>
          <p className="text-gray" style={{ margin: '8px 0 24px' }}>
            {canCreate ? '点击右上角按钮创建第一个训练营' : '请联系管理员创建训练营'}
          </p>
          {canCreate && (
            <button className="btn btn-primary" onClick={openModal}>
              + 新建训练营
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {camps.map(camp => (
            <div
              key={camp.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => navigate(`/camps/${camp.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              <div className="flex-between mb-4">
                <h3 style={{ margin: 0 }}>{camp.name}</h3>
                <span className={`badge ${statusMap[camp.status]?.class || 'badge-info'}`}>
                  {statusMap[camp.status]?.label || camp.status}
                </span>
              </div>
              <p className="text-gray" style={{ marginBottom: 16, minHeight: 40 }}>
                {camp.description}
              </p>
              <div className="flex-between text-sm text-gray mb-2">
                <span>📅 {camp.start_date} ~ {camp.end_date}</span>
                <span>👥 {camp.student_count || 0} 名学员</span>
              </div>
              <div className="progress-bar mt-2">
                <div className="fill" style={{ width: `${getProgress(camp)}%` }}></div>
              </div>
              <div className="flex-between text-sm text-gray mt-2">
                <span>进度 {getProgress(camp)}%</span>
                <span>共 {camp.total_days} 天 · 补卡 {camp.max_makeup_days} 次</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              setShowModal(false);
            }
          }}
          style={{ zIndex: 99999, display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }}
        >
          <div className="modal" style={{ maxWidth: 700, background: 'white', borderRadius: 16, padding: 24 }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>新建训练营配置</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>训练营名称 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入训练营名称，如：21天减脂训练营"
                />
              </div>

              <div className="form-group">
                <label>训练营简介</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入训练营简介，帮助学员了解训练营内容"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>开始日期 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>结束日期 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>总天数 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={formData.total_days}
                    onChange={(e) => setFormData({ ...formData, total_days: parseInt(e.target.value) || 0 })}
                    placeholder="如：21"
                  />
                </div>
                <div className="form-group">
                  <label>补卡次数</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.max_makeup_days}
                    onChange={(e) => setFormData({ ...formData, max_makeup_days: parseInt(e.target.value) || 0 })}
                    placeholder="允许的补卡次数，如：3"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">草稿</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>

              <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
                  💡 提示：创建训练营后，您可以在详情页继续配置：
                </p>
                <ul style={{ fontSize: 12, color: '#166534', margin: '8px 0 0 20px', padding: 0 }}>
                  <li>每日任务和学习资料</li>
                  <li>打卡规则和评分标准</li>
                  <li>学员分组和班主任分配</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? '创建中...' : '创建训练营'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Camps;
