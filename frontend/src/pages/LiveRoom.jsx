import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, liveAPI, jobAPI, resumeAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function LiveRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [danmakus, setDanmakus] = useState([]);
  const [danmakuInput, setDanmakuInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [myResumes, setMyResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const danmakuContainerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadRoom();
    loadDanmakus();
    liveAPI.incrementView(id);

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join_live', id);

    socket.on('danmaku', (data) => {
      setDanmakus(prev => [...prev.slice(-100), data]);
      addFloatingDanmaku(data);
    });

    return () => {
      socket.emit('leave_live', id);
      socket.disconnect();
    };
  }, [id]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const res = await liveAPI.getRoom(id);
      setRoom(res.data.room);
      setJobs(res.data.related_jobs || []);
      
      if (user) {
        try {
          const resumeRes = await resumeAPI.getMyResumes();
          setMyResumes(resumeRes.data.resumes || []);
          if (resumeRes.data.resumes?.length > 0) {
            setSelectedResume(resumeRes.data.resumes[0].id.toString());
          }
        } catch (e) {
          console.error('Failed to load resumes:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load live room:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDanmakus = async () => {
    try {
      const res = await liveAPI.getDanmakus(id);
      setDanmakus(res.data.danmakus);
    } catch (err) {
      console.error('Failed to load danmakus:', err);
    }
  };

  const sendDanmaku = async (e) => {
    e.preventDefault();
    if (!danmakuInput.trim() || !user) return;

    try {
      await liveAPI.sendDanmaku(id, danmakuInput.trim());
      setDanmakuInput('');
    } catch (err) {
      console.error('Failed to send danmaku:', err);
    }
  };

  const handleApply = (job) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const confirmApply = async () => {
    if (!selectedJob || !selectedResume) {
      alert('请选择简历');
      return;
    }
    try {
      await jobAPI.applyJob(selectedJob.id, { resume_id: parseInt(selectedResume) });
      alert('投递成功！HR 会尽快联系您。');
      setShowApplyModal(false);
      setSelectedJob(null);
    } catch (err) {
      alert(err.response?.data?.error || '投递失败，请稍后重试');
    }
  };

  const addFloatingDanmaku = (data) => {
    if (!showDanmaku || !danmakuContainerRef.current) return;
    
    const danmaku = document.createElement('div');
    danmaku.textContent = `${data.username}: ${data.content}`;
    danmaku.style.cssText = `
      position: absolute;
      right: -200px;
      top: ${Math.random() * 70 + 10}%;
      color: white;
      font-size: 14px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      white-space: nowrap;
      animation: danmakuFly 8s linear;
      pointer-events: none;
      z-index: 10;
    `;
    danmakuContainerRef.current.appendChild(danmaku);
    
    setTimeout(() => danmaku.remove(), 8000);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes danmakuFly {
        from { transform: translateX(0); }
        to { transform: translateX(calc(-100vw - 200px)); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  if (!room) return <div className="empty-state">直播间不存在</div>;

  return (
    <div className="grid-3">
      <div style={{ gridColumn: 'span 2' }}>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div
            ref={danmakuContainerRef}
            style={{
              height: 450,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              overflow: 'hidden',
            }}
          >
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📺</div>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>{room.title}</h2>
              {room.status === 'live' ? (
                <div>
                  <span className="badge badge-danger" style={{ fontSize: 14, padding: '4px 12px' }}>🔴 直播中</span>
                  <span style={{ marginLeft: 12 }}>👁️ {room.viewer_count} 人在看</span>
                </div>
              ) : room.status === 'upcoming' ? (
                <span className="badge badge-warning" style={{ fontSize: 14, padding: '4px 12px' }}>
                  ⏰ 即将开始 {room.start_time?.replace('T', ' ').substring(0, 16)}
                </span>
              ) : (
                <span className="badge badge-info" style={{ fontSize: 14, padding: '4px 12px' }}>✅ 已结束</span>
              )}
            </div>

            <button
              onClick={() => setShowDanmaku(!showDanmaku)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                zIndex: 20,
              }}
            >
              弹幕 {showDanmaku ? '开' : '关'}
            </button>
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
            <form onSubmit={sendDanmaku} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                value={danmakuInput}
                onChange={(e) => setDanmakuInput(e.target.value)}
                placeholder={user ? '发送弹幕...' : '请先登录发送弹幕'}
                maxLength={50}
                disabled={!user}
              />
              <button type="submit" className="btn btn-primary" disabled={!user || !danmakuInput.trim()}>
                发送
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{
            display: 'flex',
            gap: 16,
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 16,
          }}>
            <button
              onClick={() => setActiveTab('jobs')}
              style={{
                padding: '12px 0',
                fontWeight: activeTab === 'jobs' ? 600 : 400,
                color: activeTab === 'jobs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'jobs' ? '2px solid var(--primary-color)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              📋 招聘职位 ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                padding: '12px 0',
                fontWeight: activeTab === 'info' ? 600 : 400,
                color: activeTab === 'info' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'info' ? '2px solid var(--primary-color)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              ℹ️ 直播介绍
            </button>
            <button
              onClick={() => setActiveTab('danmaku')}
              style={{
                padding: '12px 0',
                fontWeight: activeTab === 'danmaku' ? 600 : 400,
                color: activeTab === 'danmaku' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'danmaku' ? '2px solid var(--primary-color)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              💬 弹幕列表 ({danmakus.length})
            </button>
          </div>

          {activeTab === 'jobs' && (
            <div>
              {jobs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>暂无招聘职位</p>
              ) : (
                <div className="grid-2" style={{ gap: 12 }}>
                  {jobs.map(job => (
                    <div key={job.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h4 style={{ fontWeight: 600 }}>{job.title}</h4>
                        <span style={{ color: 'var(--secondary-color)', fontWeight: 600 }}>
                          {job.salary_min}K-{job.salary_max}K
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        {job.city} · {job.work_type} · {job.experience_required}
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleApply(job)}
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1 }}
                        >
                          🚀 立即投递
                        </button>
                        <Link to={`/jobs/${job.id}`} className="btn btn-sm btn-outline">
                          详情
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📢 直播介绍</h3>
              <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {room.description || '暂无介绍'}
              </p>
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🏢 公司信息</h3>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <div>公司名称：{room.company_name}</div>
                  <div>所属行业：{room.industry}</div>
                  <div>公司规模：{room.scale}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danmaku' && (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {danmakus.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>暂无弹幕</p>
              ) : (
                danmakus.slice().reverse().map(d => (
                  <div key={d.id} style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 14,
                  }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{d.username}：</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.content}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      {d.created_at?.split('T')[1]?.substring(0, 8)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="card" style={{ padding: 20, position: 'sticky', top: 88 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="avatar avatar-lg">
              {room.hr_name?.charAt(0).toUpperCase() || 'H'}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{room.hr_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{room.company_name} HR</div>
            </div>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              👥 当前观看
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-color)' }}>
              {room.viewer_count}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <Link to={`/jobs?keyword=${encodeURIComponent(room.company_name)}`} className="btn btn-secondary">
              🔍 查看该公司所有职位
            </Link>
            <Link to={`/communities?type=company&keyword=${encodeURIComponent(room.company_name)}`} className="btn btn-outline">
              🏘️ 进入公司社群
            </Link>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              🏪 虚拟展位导航
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <button className="btn btn-sm btn-outline" style={{ textAlign: 'left' }}>
                📸 公司环境照片
              </button>
              <button className="btn btn-sm btn-outline" style={{ textAlign: 'left' }}>
                🎬 团队介绍视频
              </button>
              <button className="btn btn-sm btn-outline" style={{ textAlign: 'left' }}>
                📊 薪酬福利体系
              </button>
              <button className="btn btn-sm btn-outline" style={{ textAlign: 'left' }}>
                📞 HR 1对1咨询
              </button>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowApplyModal(false)}>
          <div className="card" style={{ width: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>📩 在线投递简历</h2>
            
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>投递职位</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{selectedJob?.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedJob?.salary_min}K-{selectedJob?.salary_max}K · {selectedJob?.city}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">选择简历 *</label>
              {myResumes.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: 8 }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>您还没有创建简历</p>
                  <Link to="/my/resumes/create" className="btn btn-primary">去创建简历</Link>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                >
                  {myResumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">附言（可选）</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="想对HR说的话..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmApply}
                disabled={myResumes.length === 0 || !selectedResume}
              >
                确认投递
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveRoom;
