import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignAPI, appealAPI, creatorAPI, CREATOR_ID } from '../utils/api.js';

const Tools = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(urlTab || 'campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [violations, setViolations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [mySignups, setMySignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealContent, setAppealContent] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authContent, setAuthContent] = useState('');

  const tabs = [
    { key: 'campaigns', label: '活动报名' },
    { key: 'auth', label: '素材授权' },
    { key: 'interaction', label: '粉丝互动' },
    { key: 'appeals', label: '违规申诉' },
    { key: 'timeline', label: '时间线' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campRes, vioRes, actRes] = await Promise.all([
        campaignAPI.list(),
        creatorAPI.getViolations(CREATOR_ID),
        creatorAPI.getActivities(CREATOR_ID, 50),
      ]);
      setCampaigns(campRes.data);
      setViolations(vioRes.data);
      setActivities(actRes.data);
      
      const signupActivities = actRes.data.filter(a => a.type === 'campaign');
      setMySignups(signupActivities);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (campaignId, campaignName) => {
    try {
      await campaignAPI.signup(campaignId, CREATOR_ID);
      alert(`报名成功！\n\n活动：${campaignName}\n\n说明：\n1. 报名信息已提交\n2. 审核结果将在 1-3 个工作日内通知\n3. 请在"我的报名"中查看状态`);
      loadData();
    } catch (error) {
      console.error('Failed to signup:', error);
      alert('报名失败，请重试');
    }
  };

  const handleAppeal = async () => {
    if (!appealContent.trim() || !selectedViolation) {
      alert('请填写申诉内容');
      return;
    }
    try {
      await appealAPI.create({
        creator_id: CREATOR_ID,
        violation_id: selectedViolation.id,
        content: appealContent,
      });
      alert('申诉已提交\n\n说明：\n1. 申诉将在 1-3 个工作日内处理\n2. 处理结果将通过系统消息通知\n3. 申诉期间违规记录暂不清除');
      setShowAppealModal(false);
      setAppealContent('');
      setSelectedViolation(null);
    } catch (error) {
      console.error('Failed to appeal:', error);
      alert('申诉失败，请重试');
    }
  };

  const handleAuthSubmit = async () => {
    if (!authContent.trim()) {
      alert('请填写授权说明');
      return;
    }
    alert('授权申请已提交\n\n说明：\n1. 授权申请已提交审核\n2. 审核周期约 1-3 个工作日\n3. 审核通过后素材可商用');
    setShowAuthModal(false);
    setAuthContent('');
  };

  const openAppealModal = (violation) => {
    setSelectedViolation(violation);
    setShowAppealModal(true);
  };

  const typeIcons = {
    publish: '📝',
    audit: '✅',
    income: '💰',
    violation: '⚠️',
    appeal: '📋',
    campaign: '🎉',
    withdraw: '💳',
    delete: '🗑️',
    auth: '📜',
  };

  const mockInteractions = [
    { id: 1, type: 'comment', content: '期待下期作品！', time: '2小时前', status: 'pending' },
    { id: 2, type: 'question', content: '请问这个教程有完整视频吗？', time: '5小时前', status: 'pending' },
    { id: 3, type: 'suggestion', content: '建议增加更多案例分析', time: '1天前', status: 'replied' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>运营工具</h2>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="tabs">
            {tabs.map(tab => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '60px 0' }}>
              <span>加载中...</span>
            </div>
          ) : activeTab === 'campaigns' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="card-title">可报名活动</h3>
                {mySignups.length > 0 && (
                  <span className="text-muted">我的报名：{mySignups.length} 个</span>
                )}
              </div>
              
              {campaigns.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🎉</div>
                  <div className="empty-text">暂无活动</div>
                </div>
              ) : (
                campaigns.map(c => (
                  <div key={c.id} className="campaign-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div className="campaign-title">{c.name}</div>
                        <div className="campaign-desc">{c.description}</div>
                        <div className="campaign-meta" style={{ marginTop: '8px' }}>
                          <span className="text-muted">活动时间：</span>
                          {c.start_date?.split(' ')[0]} - {c.end_date?.split(' ')[0]}
                        </div>
                        <div className="campaign-reward" style={{ marginTop: '8px' }}>
                          🏆 {c.reward}
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleSignup(c.id, c.name)}
                      >
                        立即报名
                      </button>
                    </div>
                  </div>
                ))
              )}

              {mySignups.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>我的报名记录</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>报名时间</th>
                        <th>活动名称</th>
                        <th>状态</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySignups.map(signup => (
                        <tr key={signup.id}>
                          <td>{signup.created_at?.split(' ')[0]}</td>
                          <td>{signup.description}</td>
                          <td>
                            <span className="status-badge status-pending">待审核</span>
                          </td>
                          <td className="text-muted">1-3 个工作日内审核</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'auth' ? (
            <div>
              <div className="card" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <h3 className="card-title" style={{ marginBottom: '12px' }}>素材授权说明</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#595959' }}>
                  <div>• <strong>原创作品</strong>：默认享有著作权，可用于商业用途</div>
                  <div>• <strong>授权转载</strong>：需获得原作者授权，保留出处</div>
                  <div>• <strong>混合创作</strong>：引用部分需注明来源</div>
                  <div>• <strong>商用授权</strong>：需申请并通过审核</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">我的授权状态</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAuthModal(true)}>
                    申请授权
                  </button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>授权类型</th>
                      <th>申请时间</th>
                      <th>状态</th>
                      <th>有效期</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>原创作品保护</td>
                      <td>2024-01-01</td>
                      <td><span className="status-badge status-settled">有效</span></td>
                      <td>永久</td>
                    </tr>
                    <tr>
                      <td>商用授权</td>
                      <td>2024-01-15</td>
                      <td><span className="status-badge status-pending">审核中</span></td>
                      <td>1年</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'interaction' ? (
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">粉丝互动消息</h3>
                  <span className="text-muted" style={{ fontSize: '13px' }}>
                    待回复：{mockInteractions.filter(i => i.status === 'pending').length} 条
                  </span>
                </div>
                {mockInteractions.map(interaction => (
                  <div 
                    key={interaction.id} 
                    style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid #f0f0f0',
                      background: interaction.status === 'pending' ? '#fffbe6' : '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          marginRight: '8px',
                          background: interaction.type === 'comment' ? '#e6f7ff' : '#fff7e6',
                          color: interaction.type === 'comment' ? '#1890ff' : '#fa8c16'
                        }}>
                          {interaction.type === 'comment' ? '评论' : '提问'}
                        </span>
                        <span style={{ fontSize: '14px' }}>{interaction.content}</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: '12px' }}>{interaction.time}</span>
                    </div>
                    {interaction.status === 'pending' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-default">回复</button>
                        <button className="btn btn-sm btn-default">忽略</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '16px' }}>互动统计</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">156</div>
                    <div className="stat-label">总评论</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">89</div>
                    <div className="stat-label">待回复</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">23</div>
                    <div className="stat-label">粉丝提问</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">12</div>
                    <div className="stat-label">已回复</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'appeals' ? (
            <div>
              {violations.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">暂无违规记录</div>
                </div>
              ) : (
                violations.map(v => (
                  <div key={v.id} className={`violation-item ${v.status === 'resolved' ? 'resolved' : ''}`}>
                    <div className="violation-title">
                      {v.type === 'copyright' ? '版权问题' : v.type === 'violence' ? '暴力内容' : '其他违规'}
                      <span style={{ marginLeft: '12px', fontSize: '12px' }} className={v.status === 'resolved' ? 'text-success' : 'text-warning'}>
                        {v.status === 'resolved' ? '已处理' : '待处理'}
                      </span>
                    </div>
                    <div className="violation-desc">{v.description}</div>
                    <div className="violation-meta">
                      <span>处罚：{v.penalty === 'warning' ? '警告' : '封号'}</span>
                      <span>{v.created_at?.split(' ')[0]}</span>
                    </div>
                    {v.status !== 'resolved' && (
                      <div style={{ marginTop: '12px' }}>
                        <button className="btn btn-sm btn-default" onClick={() => openAppealModal(v)}>
                          发起申诉
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="timeline">
              {activities.map(act => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: act.type === 'violation' ? '#ff4d4f' : '#1890ff' }}></div>
                  <div className="timeline-time">{act.created_at}</div>
                  <div className="timeline-content">
                    <span style={{ marginRight: '8px' }}>{typeIcons[act.type] || '📌'}</span>
                    {act.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAppealModal && (
        <div className="modal-overlay" onClick={() => setShowAppealModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">违规申诉</h3>
              <button className="modal-close" onClick={() => setShowAppealModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fff1f0', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                  {selectedViolation?.type === 'copyright' ? '版权问题' : '违规内容'}
                </div>
                <div className="text-muted">{selectedViolation?.description}</div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  处罚：{selectedViolation?.penalty === 'warning' ? '警告' : '封号'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">申诉理由 *</label>
                <textarea
                  className="form-textarea"
                  placeholder="请详细说明申诉理由，提供相关证据..."
                  value={appealContent}
                  onChange={(e) => setAppealContent(e.target.value)}
                  style={{ minHeight: '150px' }}
                />
              </div>
              <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <strong>申诉说明：</strong>
                <div>• 申诉将在 1-3 个工作日内处理</div>
                <div>• 处理结果将通过系统消息通知</div>
                <div>• 申诉期间违规记录暂不清除</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowAppealModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAppeal}>提交申诉</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">申请素材授权</h3>
              <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">授权类型</label>
                <select className="form-select">
                  <option>商用授权</option>
                  <option>转载授权</option>
                  <option>改编授权</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">授权说明 *</label>
                <textarea
                  className="form-textarea"
                  placeholder="请说明授权用途、使用范围等..."
                  value={authContent}
                  onChange={(e) => setAuthContent(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <strong>授权说明：</strong>
                <div>• 审核周期约 1-3 个工作日</div>
                <div>• 授权有效期默认为 1 年</div>
                <div>• 审核通过后可在"我的授权"查看</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowAuthModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAuthSubmit}>提交申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
