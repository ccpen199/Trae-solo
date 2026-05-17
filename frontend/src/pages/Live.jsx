import { useState, useEffect } from 'react';
import { liveAPI } from '../api';
import useStore from '../store';

function Live() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('live');
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    streamer_type: 'private_coach',
    real_name: '',
    id_card: '',
    certifications: '',
    experience: ''
  });
  const [scheduleData, setScheduleData] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    category: '健身'
  });

  useEffect(() => {
    loadStreams();
  }, [activeTab]);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const data = await liveAPI.getStreams(activeTab);
      if (data.success) {
        setStreams(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.real_name || !formData.id_card) {
      alert('请填写完整信息');
      return;
    }
    try {
      await liveAPI.applyStreamer(formData);
      alert('申请已提交，请等待审核');
      setShowApplyModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleData.title || !scheduleData.scheduled_time) {
      alert('请填写标题和时间');
      return;
    }
    try {
      await liveAPI.scheduleStream(scheduleData);
      alert('直播已预约');
      setShowScheduleModal(false);
      loadStreams();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReserve = async (id) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      await liveAPI.reserveStream(id);
      alert('预约成功');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && streams.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>📺 直播中心</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowApplyModal(true)}
            style={{
              padding: '10px 20px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            申请成为主播
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              padding: '10px 20px',
              background: '#00d563',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            预约直播
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        {['live', 'scheduled', 'ended'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: activeTab === tab ? '#00d563' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#333',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {tab === 'live' ? '正在直播' : tab === 'scheduled' ? '预约中' : '已结束'}
          </button>
        ))}
      </div>

      {streams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📺</div>
          暂无{activeTab === 'live' ? '正在直播' : activeTab === 'scheduled' ? '预约直播' : '已结束直播'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {streams.map(stream => (
            <div key={stream.id} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                height: '160px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '40px'
              }}>
                📺
              </div>
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{stream.title}</h3>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  👤 {stream.streamer_name || '主播'}
                </p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  🏷️ {stream.category || '健身'}
                </p>
                {activeTab === 'scheduled' && (
                  <button
                    onClick={() => handleReserve(stream.id)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      background: '#00d563',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    预约观看
                  </button>
                )}
                {activeTab === 'live' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#fff1f0',
                    color: '#f5222d',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}>
                    🔥 正在直播
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showApplyModal && (
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
            <h3 style={{ margin: '0 0 20px 0' }}>申请成为主播</h3>
            <form onSubmit={handleApply}>
              <div style={{ marginBottom: '15px' }}>
                <label>主播类型</label>
                <select
                  value={formData.streamer_type}
                  onChange={(e) => setFormData({ ...formData, streamer_type: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="private_coach">私教</option>
                  <option value="planner">规划师</option>
                  <option value="nutritionist">营养师</option>
                  <option value="influencer">达人</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>真实姓名</label>
                <input
                  type="text"
                  value={formData.real_name}
                  onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>身份证号</label>
                <input
                  type="text"
                  value={formData.id_card}
                  onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>资质证书</label>
                <input
                  type="text"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>从业经验</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>预约直播</h3>
            <form onSubmit={handleSchedule}>
              <div style={{ marginBottom: '15px' }}>
                <label>直播标题 *</label>
                <input
                  type="text"
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                  placeholder="请输入直播标题"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>直播描述</label>
                <textarea
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px' }}
                  placeholder="请输入直播描述"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>直播分类</label>
                <select
                  value={scheduleData.category}
                  onChange={(e) => setScheduleData({ ...scheduleData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="健身">健身</option>
                  <option value="瑜伽">瑜伽</option>
                  <option value="跑步">跑步</option>
                  <option value="营养">营养</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>直播时间 *</label>
                <input
                  type="datetime-local"
                  value={scheduleData.scheduled_time}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  确认预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Live;
