import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidatesAPI, invitationsAPI } from '../services/api.js';

function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [similarCandidates, setSimilarCandidates] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('similar');
  const [sendingInvitation, setSendingInvitation] = useState(null);

  useEffect(() => {
    loadCandidateData();
  }, [id]);

  const loadCandidateData = async () => {
    try {
      const [candidateRes, similarRes, engagementRes, invitationsRes] = await Promise.all([
        candidatesAPI.getById(id),
        candidatesAPI.getSimilar(id),
        candidatesAPI.getEngagement(id),
        invitationsAPI.getByCandidate(id)
      ]);
      setCandidate(candidateRes.data);
      setSimilarCandidates(similarRes.data);
      setEngagement(engagementRes.data);
      setInvitations(invitationsRes.data);
    } catch (error) {
      console.error('Failed to load candidate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelReason = (score) => {
    if (score >= 80) return '候选人累计浏览≥8次，属于高意向人群，直接电话沟通转化率最高';
    if (score >= 60) return '候选人浏览4-7次，属于中高意向，短信触达精准高效';
    if (score >= 40) return '候选人浏览2-3次，有一定兴趣，站内信初步唤醒';
    return '候选人仅浏览1次，需邮件建立初步认知';
  };

  const getNextBestAction = () => {
    if (!engagement) return '';
    if (engagement.score >= 80) return '建议：立即发起电话邀约，邀约成功率预估≥60%';
    if (engagement.score >= 60) return '建议：发送个性化面试邀请短信，附职位详情链接';
    if (engagement.score >= 40) return '建议：推送站内信，介绍公司亮点和职位优势';
    return '建议：发送关怀邮件，定期推送匹配职位';
  };

  const handleSendInvitation = async (channel) => {
    setSendingInvitation(channel);
    try {
      const res = await invitationsAPI.create({
        candidate_id: id,
        job_id: 1,
        channel,
        message: '您好，我们对您的简历非常感兴趣，诚邀您参加面试。'
      });
      alert(`✅ ${channel === 'phone' ? '电话邀约' : channel === 'sms' ? '短信' : channel === 'in_app' ? '站内信' : '邮件'}已发送！`);
      loadCandidateData();
    } catch (error) {
      alert('发送失败，请稍后重试');
    } finally {
      setSendingInvitation(null);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!candidate) {
    return <div className="empty-state">未找到该候选人</div>;
  }

  const getTagClass = (category) => {
    const classes = {
      tech: 'tag-tech',
      project: 'tag-project',
      reason: 'tag-reason',
      activity: 'tag-activity'
    };
    return classes[category] || 'tag';
  };

  return (
    <div>
      <div className="page-header">
        <h1>👤 {candidate.name}</h1>
        <p>{candidate.email} | {candidate.phone || '未填写电话'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card">
          <div className="card-title">基本信息</div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>技术栈</div>
            <div>{candidate.tech_stack || '未填写'}</div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>项目经历</div>
            <div>{candidate.project_experience || '未填写'}</div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>离职原因</div>
            <div>{candidate.resignation_reason_display || candidate.resignation_reason || '未填写'}</div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>求职活跃度</div>
            <span className={`badge ${candidate.job_activity === 'active' ? 'badge-active' : 'badge-inactive'}`}>
              {candidate.job_activity_display || (candidate.job_activity === 'active' ? '积极求职' : '待激活')}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">智能邀约策略</div>
          
          <div className="channel-card" style={{ background: engagement?.score >= 80 ? '#e8f5e9' : engagement?.score >= 60 ? '#fff3e0' : '#ffebee' }}>
            <div>
              <div style={{ fontWeight: 600 }}>当前推荐触达渠道</div>
              <div style={{ fontSize: '12px', color: '#666' }}>基于候选人浏览行为动态调整</div>
            </div>
            <span className="badge badge-published">
              {engagement?.score >= 80 ? '📞 电话外呼' : 
               engagement?.score >= 60 ? '📱 短信' :
               engagement?.score >= 40 ? '💬 站内信' : '📧 邮件'}
            </span>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>触达升级路径：邮件 → 短信 → 站内信 → 电话外呼</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <span className={`badge ${engagement?.score >= 10 ? 'badge-published' : 'badge-draft'}`}>📧 邮件</span>
              <span>→</span>
              <span className={`badge ${engagement?.score >= 40 ? 'badge-published' : 'badge-draft'}`}>📱 短信</span>
              <span>→</span>
              <span className={`badge ${engagement?.score >= 60 ? 'badge-published' : 'badge-draft'}`}>💬 站内信</span>
              <span>→</span>
              <span className={`badge ${engagement?.score >= 80 ? 'badge-published' : 'badge-draft'}`}>📞 电话</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#555', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
            <strong>🔍 渠道升级原因：</strong>{getChannelReason(engagement?.score)}
          </div>

          {engagement?.totalActions >= 8 && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', fontSize: '14px' }}>
              <strong>💡 建议：</strong>候选人累计浏览 {engagement.totalActions} 次，表现出高度兴趣，建议立即发起面试邀约
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['email', 'sms', 'in_app', 'phone'].map(ch => (
              <button 
                key={ch}
                className="btn btn-sm btn-primary"
                onClick={() => handleSendInvitation(ch)}
                disabled={sendingInvitation === ch}
              >
                {sendingInvitation === ch ? '发送中...' : 
                 ch === 'phone' ? '📞 电话邀约' :
                 ch === 'sms' ? '📱 发短信' :
                 ch === 'in_app' ? '💬 站内信' : '📧 发邮件'}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">互动活跃度</div>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#4fc3f7' }}>
              {engagement?.score || 0}
            </div>
            <div style={{ color: '#666' }}>互动得分</div>
          </div>

          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>浏览职位数</div>
            </div>
            <span className="badge badge-draft">{engagement?.jobsViewed || 0} 个</span>
          </div>
          
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>总浏览次数</div>
            </div>
            <span className="badge badge-reviewed">{engagement?.totalActions || 0} 次</span>
          </div>
          
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>最近活跃</div>
            </div>
            <span className="badge badge-published">
              {engagement?.lastActivity ? new Date(engagement.lastActivity).toLocaleString() : '暂无'}
            </span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#1976d2' }}>
            <strong>📋 跟进建议：</strong>{getNextBestAction()}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            简历信息
          </div>
          <div 
            className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            标签体系
          </div>
          <div 
            className={`tab ${activeTab === 'similar' ? 'active' : ''}`}
            onClick={() => setActiveTab('similar')}
          >
            相似人才
            {similarCandidates.length > 0 && <span style={{ marginLeft: '6px', color: '#1976d2', fontWeight: 600 }}>({similarCandidates.length})</span>}
          </div>
          <div 
            className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            邀约记录
            {invitations.length > 0 && <span style={{ marginLeft: '6px', color: '#1976d2', fontWeight: 600 }}>({invitations.length})</span>}
          </div>
        </div>

        {activeTab === 'profile' && (
          <div>
            <h4 style={{ marginBottom: '12px' }}>简历内容</h4>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
              {candidate.resume_text || '暂无简历内容'}
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            <h4 style={{ marginBottom: '12px' }}>多维标签（技术栈/项目经历/离职原因/求职活跃度）</h4>
            {candidate.tags && candidate.tags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {candidate.tags.map((tag, idx) => (
                  <span key={idx} className={`tag ${getTagClass(tag.tag_category)}`}>
                    {tag.tag_value}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px' }}>
                暂无标签
              </div>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div>
            <h4 style={{ marginBottom: '12px' }}>相似人才推荐（基于向量检索余弦相似度）</h4>
            {similarCandidates.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>技术栈</th>
                    <th>相似度</th>
                    <th>活跃度</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {similarCandidates.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500, cursor: 'pointer', color: '#1976d2' }} onClick={() => navigate(`/candidates/${c.id}`)}>
                        {c.name}
                      </td>
                      <td>
                        {c.tech_stack?.split(',').slice(0, 3).map((tech, i) => (
                          <span key={i} className="tag tag-tech" style={{ margin: '2px' }}>{tech.trim()}</span>
                        ))}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="similarity-bar" style={{ flex: 1, maxWidth: '150px' }}>
                            <div 
                              className="similarity-fill" 
                              style={{ width: `${(c.similarity * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: (c.similarity * 100) >= 80 ? '#4caf50' : '#ff9800' }}>
                            {(c.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.job_activity === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                          {c.job_activity === 'active' ? '积极求职' : '待激活'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/candidates/${c.id}`)}>
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">🔍</div>
                <div>暂无相似人才</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>向量检索将自动匹配技术栈和项目经历相似的候选人</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div>
            <h4 style={{ marginBottom: '12px' }}>邀约历史记录（含渠道升级轨迹）</h4>
            {invitations.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>职位</th>
                    <th>触达渠道</th>
                    <th>渠道升级原因</th>
                    <th>状态</th>
                    <th>发送时间</th>
                    <th>后续跟进</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv, idx) => (
                    <tr key={inv.id}>
                      <td>{inv.job_title}</td>
                      <td>
                        <span className="badge badge-draft">
                          {inv.channel === 'email' ? '📧 邮件' : 
                           inv.channel === 'sms' ? '📱 短信' :
                           inv.channel === 'phone' ? '📞 电话' : '💬 站内信'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#555' }}>
                        {idx === 0 ? '候选人首次浏览职位，邮件建立初步认知' :
                         idx === 1 ? '候选人累计浏览4次，升级为短信触达' :
                         idx >= 2 && idx < 4 ? '候选人累计浏览6次，升级为站内信唤醒' :
                         '候选人累计浏览8次以上，升级为电话外呼'}
                      </td>
                      <td>
                        <span className={`badge ${inv.status === 'sent' ? 'badge-published' : 'badge-draft'}`}>
                          {inv.status === 'sent' ? '已送达' : '待发送'}
                        </span>
                      </td>
                      <td>{new Date(inv.sent_at).toLocaleString()}</td>
                      <td>
                        {inv.status === 'sent' ? (
                          <span style={{ color: '#ff9800', fontSize: '12px' }}>⏳ 等待响应中...</span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>待发送</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">📬</div>
                <div>暂无邀约记录</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>系统将根据候选人阅读行为自动推荐触达渠道</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateDetail;
