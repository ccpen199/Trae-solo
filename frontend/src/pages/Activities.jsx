import { useState, useEffect } from 'react';
import { activityAPI } from '../api';
import useStore from '../store';

function Activities() {
  const { user } = useStore();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gym_name: '',
    address: '',
    activity_time: '',
    max_participants: 50
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activityAPI.getList('upcoming');
      if (data.success) {
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.gym_name || !formData.address || !formData.activity_time) {
      alert('请填写完整信息');
      return;
    }
    try {
      await activityAPI.create(formData);
      alert('活动创建成功');
      setShowCreateModal(false);
      loadActivities();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegister = async (id) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      await activityAPI.register(id);
      alert('报名成功');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && activities.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🎉 线下活动</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: '#00d563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          创建活动
        </button>
      </div>

      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          暂无活动，快来创建第一个活动吧！
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {activities.map(activity => (
            <div key={activity.id} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                height: '180px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '50px'
              }}>
                🏋️
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>{activity.title}</h3>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                  🏠 {activity.gym_name}
                </p>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                  📍 {activity.address}
                </p>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                  🕐 {activity.activity_time}
                </p>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                  👥 {activity.participant_count || 0}/{activity.max_participants || 50}人报名
                </p>
                <button
                  onClick={() => handleRegister(activity.id)}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '12px',
                    background: '#00d563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  立即报名
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>创建线下活动</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '15px' }}>
                <label>活动标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                  placeholder="请输入活动标题"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>活动描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '60px' }}
                  placeholder="请输入活动描述"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>健身房名称 *</label>
                <input
                  type="text"
                  value={formData.gym_name}
                  onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                  placeholder="请输入健身房名称"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>活动地址 *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                  placeholder="请输入活动地址"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>活动时间 *</label>
                <input
                  type="datetime-local"
                  value={formData.activity_time}
                  onChange={(e) => setFormData({ ...formData, activity_time: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>最大参与人数</label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  创建活动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Activities;
