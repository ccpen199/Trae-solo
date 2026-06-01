import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorAPI, CREATOR_ID } from '../utils/api.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [works, setWorks] = useState([]);
  const [violations, setViolations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [fanProfiles, setFanProfiles] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, worksRes, vioRes, actRes, fanRes, incRes] = await Promise.all([
        creatorAPI.getDashboard(CREATOR_ID),
        creatorAPI.getWorks(CREATOR_ID),
        creatorAPI.getViolations(CREATOR_ID),
        creatorAPI.getActivities(CREATOR_ID, 10),
        creatorAPI.getFanProfiles(CREATOR_ID),
        creatorAPI.getIncomeSummary(CREATOR_ID),
      ]);
      
      setDashboard(dashRes.data);
      setWorks(worksRes.data.slice(0, 5));
      setViolations(vioRes.data);
      setActivities(actRes.data);
      setFanProfiles(fanRes.data);
      setIncomeSummary(incRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="flex-center" style={{ padding: '100px 0' }}>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  const creator = dashboard?.creator || {};

  const statusLabels = {
    draft: { label: '草稿', class: 'status-draft' },
    auditing: { label: '审核中', class: 'status-auditing' },
    published: { label: '已发布', class: 'status-published' },
    scheduled: { label: '定时发布', class: 'status-scheduled' },
  };

  const typeLabels = {
    video: '视频',
    article: '图文',
  };

  return (
    <div>
      <div className="page-header">
        <h2>创作者主页</h2>
        <button className="btn btn-primary" onClick={() => navigate('/publish')}>
          + 发布内容
        </button>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="profile-header">
            <div className="avatar">{creator.nickname?.charAt(0) || '创'}</div>
            <div className="profile-info">
              <h3>
                {creator.nickname || '创作者'}
                {creator.verified && <span className="verified-badge">✓ 已认证</span>}
              </h3>
              <p>{creator.bio || '暂无简介'}</p>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{(creator.follower_count || 0).toLocaleString()}</div>
              <div className="stat-label">粉丝数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{(creator.total_views || 0).toLocaleString()}</div>
              <div className="stat-label">总播放</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">¥{(creator.total_income || 0).toLocaleString()}</div>
              <div className="stat-label">累计收益</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-warning">{dashboard?.counts?.auditing || 0}</div>
              <div className="stat-label">审核中</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">作品概览</h3>
            <button className="btn btn-sm btn-default" onClick={() => navigate('/works')}>
              查看全部
            </button>
          </div>
          {works.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📝</div>
              <div className="empty-text">暂无作品</div>
            </div>
          ) : (
            works.map(work => (
              <div key={work.id} className="work-list-item">
                <div className="work-cover">
                  {typeLabels[work.type]}封面
                </div>
                <div className="work-info">
                  <div className="work-title">{work.title}</div>
                  <div className="work-meta">
                    <span className={`status-badge ${statusLabels[work.status]?.class}`}>
                      {statusLabels[work.status]?.label}
                    </span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{typeLabels[work.type]}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{work.created_at?.split(' ')[0]}</span>
                  </div>
                  {work.status === 'published' && (
                    <div className="work-stats">
                      <span>👁️ {work.views.toLocaleString()}</span>
                      <span>❤️ {work.likes.toLocaleString()}</span>
                      <span>💬 {work.comments.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">收益概览</h3>
              <button className="btn btn-sm btn-default" onClick={() => navigate('/income')}>
                查看详情
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card" style={{ boxShadow: 'none', padding: '16px 0' }}>
                <div className="stat-value text-success">¥{(incomeSummary?.total || 0).toLocaleString()}</div>
                <div className="stat-label">累计收益</div>
              </div>
              <div className="stat-card" style={{ boxShadow: 'none', padding: '16px 0' }}>
                <div className="stat-value text-warning">¥{(incomeSummary?.pending || 0).toLocaleString()}</div>
                <div className="stat-label">待结算</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">粉丝画像</h3>
            </div>
            <div className="fan-grid">
              {['18-24', '25-34', '35-44', '45+'].map(age => {
                const fans = fanProfiles.filter(f => f.age_group === age);
                const total = fans.reduce((sum, f) => sum + f.percentage, 0);
                return (
                  <div key={age} className="fan-card">
                    <div className="fan-label">{age}岁</div>
                    <div className="fan-value">{total.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">违规记录</h3>
              <button className="btn btn-sm btn-default" onClick={() => navigate('/tools?tab=appeals')}>
                申诉
              </button>
            </div>
            {violations.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✅</div>
                <div className="empty-text">暂无违规记录</div>
              </div>
            ) : (
              violations.slice(0, 3).map(v => (
                <div key={v.id} className={`violation-item ${v.status === 'resolved' ? 'resolved' : ''}`}>
                  <div className="violation-title">
                    {v.type === 'copyright' ? '版权问题' : v.type === 'violence' ? '暴力内容' : '其他违规'}
                    {v.status === 'resolved' && <span className="text-success" style={{ marginLeft: '8px' }}>已处理</span>}
                  </div>
                  <div className="violation-desc">{v.description}</div>
                  <div className="violation-meta">
                    <span>处罚：{v.penalty === 'warning' ? '警告' : '封号'}</span>
                    <span>{v.created_at?.split(' ')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">动态时间线</h3>
            </div>
            <div className="timeline">
              {activities.map(act => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-time">{act.created_at}</div>
                  <div className="timeline-content">{act.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
