import React, { useState, useEffect } from 'react';
import { jobsAPI, candidatesAPI, invitationsAPI, behaviorAPI } from '../services/api.js';

function SmartInvitation() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [message, setMessage] = useState('');
  const [autoCandidates, setAutoCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobsAPI.getAll();
      setJobs(res.data.filter(j => j.status === 'published'));
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = async (jobId) => {
    setSelectedJob(jobId);
    try {
      const [candidatesRes, autoRes] = await Promise.all([
        candidatesAPI.getAll(),
        jobsAPI.getAutoInvite(jobId)
      ]);
      setCandidates(candidatesRes.data);
      setAutoCandidates(autoRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCandidateSelect = async (candidateId) => {
    setSelectedCandidate(candidateId);
    try {
      const res = await candidatesAPI.getEngagement(candidateId);
      setEngagement(res.data);
      
      if (selectedJob) {
        const behaviorRes = await behaviorAPI.track(candidateId, selectedJob, 'view_job');
        if (behaviorRes.data) {
          setSelectedChannel(behaviorRes.data.recommendedChannel);
          setMessage(behaviorRes.data.nextBestAction);
        }
      }
    } catch (error) {
      console.error('Failed to load engagement:', error);
    }
  };

  const handleSendInvitation = async () => {
    try {
      await invitationsAPI.create({
        candidate_id: selectedCandidate,
        job_id: selectedJob,
        channel: selectedChannel,
        message
      });
      alert('邀约发送成功！');
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  const getUrgencyClass = (urgency) => {
    const classes = {
      high: 'urgency-high',
      medium: 'urgency-medium',
      low: 'urgency-low'
    };
    return classes[urgency] || 'urgency-low';
  };

  const getChannelLabel = (channel) => {
    const labels = {
      email: '📧 邮件',
      sms: '📱 短信',
      in_app: '💬 站内信',
      phone: '📞 电话'
    };
    return labels[channel] || channel;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📧 智能邀约</h1>
        <p>基于候选人行为动态调整触达策略</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">选择职位</div>
          {jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  className={`channel-btn ${selectedJob === job.id ? 'active' : ''}`}
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  onClick={() => handleJobSelect(job.id)}
                >
                  <div style={{ fontWeight: 600 }}>{job.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {job.location} | ¥{job.salary_min}-{job.salary_max}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💼</div>
              <div>暂无已发布的职位</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">候选人行为追踪</div>
          {selectedJob ? (
            autoCandidates.length > 0 ? (
              <div>
                <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                  🔥 以下候选人多次浏览该职位，建议主动邀约
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>候选人</th>
                      <th>浏览次数</th>
                      <th>推荐渠道</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoCandidates.map(c => (
                      <tr key={c.candidate_id}>
                        <td>{c.name}</td>
                        <td>{c.total_views} 次</td>
                        <td>
                          <span className="badge badge-reviewed">
                            {getChannelLabel(c.recommendedChannel)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👀</div>
                <div>暂无高意向候选人</div>
              </div>
            )
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👆</div>
              <div>请先选择一个职位</div>
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">选择候选人</div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {candidates.map(c => (
                <div
                  key={c.id}
                  className={`channel-btn ${selectedCandidate === c.id ? 'active' : ''}`}
                  style={{ textAlign: 'left', justifyContent: 'flex-start', marginBottom: '8px' }}
                  onClick={() => handleCandidateSelect(c.id)}
                >
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {c.email} | {c.tech_stack?.split(',').slice(0, 2).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">邀约配置</div>
            
            {selectedCandidate && engagement ? (
              <div>
                <div className="channel-card" style={{ marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>互动活跃度</div>
                    <div className="urgency-indicator" style={{ marginTop: '4px' }}>
                      <span className={`urgency-dot ${getUrgencyClass(engagement.score > 70 ? 'high' : engagement.score > 40 ? 'medium' : 'low')}`}></span>
                      <span>得分 {engagement.score} | 浏览 {engagement.jobsViewed} 个职位 | 互动 {engagement.totalActions} 次</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">选择触达渠道</label>
                  <div className="invitation-channels">
                    {['email', 'sms', 'in_app', 'phone'].map(channel => (
                      <button
                        key={channel}
                        className={`channel-btn ${selectedChannel === channel ? 'active' : ''}`}
                        onClick={() => setSelectedChannel(channel)}
                      >
                        {getChannelLabel(channel)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">邀约内容</label>
                  <textarea
                    className="form-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="输入邀约内容..."
                  />
                </div>

                <button 
                  className="btn btn-success"
                  onClick={handleSendInvitation}
                >
                  📤 发送邀约
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <div>请选择一个候选人</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">触达策略说明</div>
        <div className="grid-2">
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📧 邮件触达</div>
              <div style={{ fontSize: '12px', color: '#666' }}>首次接触、低意向候选人</div>
            </div>
            <span className="badge badge-draft">浏览 ≥1 次</span>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📱 短信触达</div>
              <div style={{ fontSize: '12px', color: '#666' }}>邮件无响应、中等意向</div>
            </div>
            <span className="badge badge-reviewed">浏览 ≥3 次</span>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>💬 站内信触达</div>
              <div style={{ fontSize: '12px', color: '#666' }}>频繁访问、较高意向</div>
            </div>
            <span className="badge badge-reviewed">浏览 ≥5 次</span>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📞 电话触达</div>
              <div style={{ fontSize: '12px', color: '#666' }}>高度关注、紧急邀约</div>
            </div>
            <span className="badge badge-published">浏览 ≥8 次</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartInvitation;
