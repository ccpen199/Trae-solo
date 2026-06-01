import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { activitiesAPI } from '../api.js';

export default function ActivityDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [userRegistered, setUserRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [assignmentContent, setAssignmentContent] = useState('');

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      const response = await activitiesAPI.getOne(id);
      setActivity(response.data.activity);
      setAttendees(response.data.attendees || []);
      setAssignments(response.data.assignments || []);
      setUserRegistered(response.data.user_registered);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await activitiesAPI.register(id);
      loadActivity();
    } catch (error) {
      alert(error.response?.data?.error || '报名失败');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentContent.trim()) return;

    try {
      await activitiesAPI.submitAssignment(id, { content: assignmentContent });
      setAssignmentContent('');
      loadActivity();
      alert('作业提交成功');
    } catch (error) {
      alert('提交失败');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      sharing: '线上分享',
      livestream: '嘉宾直播',
      assignment: '作业收集',
      replay: '回放资料'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  if (!activity) {
    return <div className="text-center mt-8">活动不存在</div>;
  }

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <button className="btn btn-secondary mb-3" onClick={() => navigate('/activities')}>
            ← 返回活动列表
          </button>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                  {getTypeLabel(activity.type)}
                </span>
                <h1>{activity.title}</h1>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                  📅 {new Date(activity.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div>
                {!userRegistered ? (
                  <button className="btn btn-primary" onClick={handleRegister}>
                    立即报名
                  </button>
                ) : (
                  <span className="badge badge-success">已报名</span>
                )}
              </div>
            </div>

            <div className="mt-3" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <span className="text-muted">主持人</span>
                <p><strong>{activity.host_name}</strong></p>
              </div>
              <div>
                <span className="text-muted">报名人数</span>
                <p><strong>{attendees.length} 人</strong></p>
              </div>
              {activity.guest_info && (
                <div>
                  <span className="text-muted">嘉宾</span>
                  <p><strong>{activity.guest_info}</strong></p>
                </div>
              )}
            </div>
          </div>

          <div className="tabs">
            <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>活动详情</div>
            <div className={`tab ${activeTab === 'attendees' ? 'active' : ''}`} onClick={() => setActiveTab('attendees')}>参与者</div>
            {activity.type === 'assignment' && (
              <div className={`tab ${activeTab === 'assignment' ? 'active' : ''}`} onClick={() => setActiveTab('assignment')}>提交作业</div>
            )}
          </div>

          {activeTab === 'info' && (
            <div className="card">
              <h3 className="card-title">活动介绍</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)' }}>{activity.description}</p>

              {activity.meeting_link && (
                <div className="mt-3">
                  <h4 className="form-label">会议链接</h4>
                  <a href={activity.meeting_link} target="_blank" rel="noopener noreferrer">
                    {activity.meeting_link}
                  </a>
                </div>
              )}

              {activity.replay_link && (
                <div className="mt-3">
                  <h4 className="form-label">回放链接</h4>
                  <a href={activity.replay_link} target="_blank" rel="noopener noreferrer">
                    {activity.replay_link}
                  </a>
                </div>
              )}

              {activity.materials && (
                <div className="mt-3">
                  <h4 className="form-label">相关资料</h4>
                  {activity.materials.split(',').map((link, index) => (
                    <div key={index}>
                      <a href={link.trim()} target="_blank" rel="noopener noreferrer">
                        {link.trim()}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="card">
              <h3 className="card-title">参与者名单（{attendees.length}人）</h3>
              {attendees.map((attendee) => (
                <div key={attendee.id} className="list-item">
                  <div>
                    <strong>{attendee.name}</strong>
                    <span className="badge badge-gray" style={{ marginLeft: '0.5rem' }}>
                      {attendee.status === 'attended' ? '已出席' : '已报名'}
                    </span>
                  </div>
                  <span className="text-muted">{attendee.email}</span>
                </div>
              ))}
              {attendees.length === 0 && (
                <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无参与者</p>
              )}
            </div>
          )}

          {activeTab === 'assignment' && activity.type === 'assignment' && (
            <div>
              {userRegistered && (
                <div className="card">
                  <h3 className="card-title">提交作业</h3>
                  <form onSubmit={handleSubmitAssignment}>
                    <div className="form-group">
                      <textarea
                        className="form-input form-textarea"
                        placeholder="请输入作业内容..."
                        value={assignmentContent}
                        onChange={(e) => setAssignmentContent(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">提交作业</button>
                  </form>
                </div>
              )}

              <div className="card">
                <h3 className="card-title">已提交作业（{assignments.length}份）</h3>
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="list-item" style={{ alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{assignment.user_name}</strong>
                      <p className="text-muted" style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                        {assignment.content}
                      </p>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                      {new Date(assignment.submitted_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无作业提交</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
