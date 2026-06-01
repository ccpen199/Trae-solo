import { useState, useEffect } from 'react';
import axios from 'axios';

function StudentDashboard({ user }) {
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinContent, setCheckinContent] = useState('');
  const [checkinImages, setCheckinImages] = useState([]);
  const [visibility, setVisibility] = useState('public');

  useEffect(() => {
    loadCamps();
  }, []);

  useEffect(() => {
    if (selectedCamp) {
      loadDashboard(selectedCamp.id);
    }
  }, [selectedCamp]);

  const loadCamps = async () => {
    const res = await axios.get(`/api/student/${user.id}/camps`);
    setCamps(res.data);
    if (res.data.length > 0) {
      setSelectedCamp(res.data[0]);
    }
  };

  const loadDashboard = async (campId) => {
    const res = await axios.get(`/api/student/${user.id}/camps/${campId}/dashboard`);
    setDashboard(res.data);
  };

  const handleCheckin = async () => {
    if (!dashboard?.todayTask || !checkinContent.trim()) return;
    
    await axios.post('/api/checkin', {
      camp_id: selectedCamp.id,
      user_id: user.id,
      task_id: dashboard.todayTask.id,
      day_number: dashboard.currentDay,
      content: checkinContent,
      images: JSON.stringify(checkinImages),
      visibility
    });
    
    setShowCheckinModal(false);
    setCheckinContent('');
    setCheckinImages([]);
    loadDashboard(selectedCamp.id);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      }))
    ).then(results => {
      setCheckinImages([...checkinImages, ...results].slice(0, 9));
    });
  };

  if (camps.length === 0) {
    return (
      <div className="card text-center" style={{ padding: 60 }}>
        <h2>暂无加入的训练营</h2>
        <p className="text-gray" style={{ marginTop: 8 }}>请联系班主任加入训练营</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div className="flex gap-2">
          {camps.map(camp => (
            <button
              key={camp.id}
              className={`btn ${selectedCamp?.id === camp.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCamp(camp)}
            >
              {camp.name}
            </button>
          ))}
        </div>
      </div>

      {dashboard && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">当前进度</div>
              <div className="value">{dashboard.currentDay}/{dashboard.enrollment.total_days}</div>
              <div className="progress-bar mt-4">
                <div className="fill" style={{ width: `${(dashboard.currentDay / dashboard.enrollment.total_days) * 100}%` }}></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="label">连续打卡</div>
              <div className="value">{dashboard.enrollment.streak}天</div>
              <div className="change positive">最高 {dashboard.enrollment.max_streak} 天</div>
            </div>
            <div className="stat-card">
              <div className="label">累计积分</div>
              <div className="value">{dashboard.enrollment.points}</div>
              <div className="change">累计打卡 {dashboard.checkinCount} 次</div>
            </div>
            <div className="stat-card">
              <div className="label">班级排名</div>
              <div className="value">第 {dashboard.myRank} 名</div>
              <div className="change">共 {dashboard.totalStudents} 人</div>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <div className="flex-between mb-4">
                <h2>今日任务 · 第 {dashboard.currentDay} 天</h2>
                {!dashboard.todayCheckin && (
                  <button className="btn btn-primary" onClick={() => setShowCheckinModal(true)}>
                    去打卡
                  </button>
                )}
                {dashboard.todayCheckin && (
                  <span className="badge badge-success">已打卡</span>
                )}
              </div>
              
              {dashboard.todayTask && (
                <div>
                  <h3 style={{ marginBottom: 12 }}>{dashboard.todayTask.title}</h3>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#666', lineHeight: 1.8 }}>
                    {dashboard.todayTask.content}
                  </p>
                  {dashboard.todayTask.checkin_rule && (
                    <div style={{ marginTop: 16, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
                      <span style={{ fontWeight: 500 }}>打卡要求：</span>
                      {dashboard.todayTask.checkin_rule}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h2>班级排行榜</h2>
              {dashboard.rankings.map((item, index) => (
                <div key={item.user_id} className="ranking-item">
                  <div className={`rank ${index < 3 ? `top${index + 1}` : ''}`}>{index + 1}</div>
                  <div className="info">
                    <div className="name">{item.name}</div>
                    <div className="text-sm text-gray">连续 {item.streak} 天</div>
                  </div>
                  <div className="points">{item.points} 分</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>最近打卡记录</h2>
            {dashboard.recentCheckins.length === 0 ? (
              <p className="text-gray text-center" style={{ padding: 20 }}>暂无打卡记录</p>
            ) : (
              dashboard.recentCheckins.map(checkin => (
                <div key={checkin.id} className={`checkin-card ${checkin.status === 'approved' || checkin.status === 'excellent' ? 'completed' : ''}`}>
                  <div className="flex-between">
                    <div>
                      <strong>第 {checkin.day_number} 天</strong>
                      <span className="text-sm text-gray" style={{ marginLeft: 12 }}>
                        {checkin.task_title}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`badge ${
                        checkin.status === 'excellent' ? 'badge-success' :
                        checkin.status === 'approved' ? 'badge-info' :
                        checkin.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {checkin.status === 'excellent' ? '优秀' :
                         checkin.status === 'approved' ? '已通过' :
                         checkin.status === 'rejected' ? '已驳回' : '待审核'}
                      </span>
                      {checkin.is_makeup && <span className="badge badge-warning">补卡</span>}
                    </div>
                  </div>
                  <p style={{ marginTop: 12, color: '#666' }}>{checkin.content}</p>
                  {checkin.coach_comment && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
                      <span style={{ color: '#065f46', fontWeight: 500 }}>教练点评：</span>
                      {checkin.coach_comment}
                      {checkin.coach_rating && <span style={{ marginLeft: 8 }}>⭐ {checkin.coach_rating}分</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showCheckinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>今日打卡 · 第 {dashboard.currentDay} 天</h2>
              <button className="modal-close" onClick={() => setShowCheckinModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>打卡内容</label>
              <textarea 
                rows={5}
                value={checkinContent}
                onChange={(e) => setCheckinContent(e.target.value)}
                placeholder="记录今天的训练心得和成果..."
              />
            </div>

            <div className="form-group">
              <label>上传图片（最多9张）</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              <div className="image-preview">
                {checkinImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt="" />
                    <button 
                      onClick={() => setCheckinImages(checkinImages.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>可见范围</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="public">公开</option>
                <option value="group">仅班级可见</option>
                <option value="teacher">仅老师可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCheckinModal(false)}>
                取消
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={handleCheckin}
                disabled={!checkinContent.trim()}
              >
                提交打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
