import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api.js';

function Analytics() {
  const [channels, setChannels] = useState([]);
  const [team, setTeam] = useState([]);
  const [newChannel, setNewChannel] = useState({ name: '', cost_per_candidate: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('channels');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [channelsRes, teamRes] = await Promise.all([
        analyticsAPI.getChannels(),
        analyticsAPI.getTeam()
      ]);
      setChannels(channelsRes.data);
      setTeam(teamRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    try {
      await analyticsAPI.addChannel({
        name: newChannel.name,
        cost_per_candidate: parseFloat(newChannel.cost_per_candidate)
      });
      setNewChannel({ name: '', cost_per_candidate: '' });
      loadData();
    } catch (error) {
      console.error('Failed to add channel:', error);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📈 招聘成本分析</h1>
        <p>各渠道获客成本、候选人质量、团队人效综合分析</p>
      </div>

      <div className="card">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            渠道分析
          </div>
          <div 
            className={`tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            团队人效
          </div>
        </div>

        {activeTab === 'channels' && (
          <div>
            <div className="card" style={{ background: '#f8f9fa', margin: '0 -24px 20px', borderRadius: 0 }}>
              <div className="card-title">添加招聘渠道</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">渠道名称</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newChannel.name}
                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                    placeholder="例如：猎聘、BOSS直聘、内推等"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">获客单价 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newChannel.cost_per_candidate}
                    onChange={(e) => setNewChannel({ ...newChannel, cost_per_candidate: e.target.value })}
                    placeholder="200"
                  />
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleAddChannel}
                disabled={!newChannel.name || !newChannel.cost_per_candidate}
              >
                ➕ 添加渠道
              </button>
            </div>

            {channels.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>渠道名称</th>
                    <th>获客单价</th>
                    <th>累计投入</th>
                    <th>候选人数量</th>
                    <th>面试通过率</th>
                    <th>录用人数</th>
                    <th>质量得分</th>
                    <th>人均成本</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map(channel => (
                    <tr key={channel.id}>
                      <td style={{ fontWeight: 500 }}>{channel.name}</td>
                      <td>¥{channel.cost_per_candidate?.toLocaleString()}</td>
                      <td>¥{channel.total_spent?.toLocaleString() || 0}</td>
                      <td>{channel.total_candidates || 0}</td>
                      <td>
                        <span style={{ 
                          color: channel.interviewPassRate >= 50 ? '#4caf50' : '#ff9800',
                          fontWeight: 600
                        }}>
                          {channel.interviewPassRate}%
                        </span>
                      </td>
                      <td>{channel.hired || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: '80px' }}>
                            <div 
                              className="progress-fill" 
                              style={{ width: `${channel.qualityScore}%` }}
                            />
                          </div>
                          <span style={{ fontWeight: 600 }}>{channel.qualityScore}</span>
                        </div>
                      </td>
                      <td>¥{channel.costPerHire?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`badge ${channel.roi >= 5 ? 'badge-published' : 'badge-reviewed'}`}>
                          {channel.roi}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div>暂无渠道数据，请先添加招聘渠道</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            {team.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {team.map(member => (
                    <div key={member.id} className="channel-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ width: '100%', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>{member.email}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {member.role === 'admin' ? '管理员' : 'HR招聘官'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666' }}>面试数</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#4fc3f7' }}>
                            {member.interviews_conducted || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666' }}>录用数</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#81c784' }}>
                            {member.hires_made || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666' }}>月均录用</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffb74d' }}>
                            {member.hiresPerMonth || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666' }}>通过率</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e57373' }}>
                            {member.passRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ background: '#f8f9fa' }}>
                  <div className="card-title">人效说明</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '8px' }}>团队人效比</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        人均录用数/月：衡量团队整体招聘效率的核心指标
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '8px' }}>候选人质量分</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        面试通过率 × 入职留存率：综合评估招聘质量
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div>暂无团队数据</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
