import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI } from '../api/index.js';

const Community = () => {
  const [activeTab, setActiveTab] = useState('topics');
  const [topics, setTopics] = useState([]);
  const [battles, setBattles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topicsRes, battlesRes, groupsRes] = await Promise.all([
          communityAPI.getTopics({ limit: 10 }),
          communityAPI.getBattles({ limit: 5 }),
          communityAPI.getViewingGroups({ limit: 5 })
        ]);
        setTopics(topicsRes.data?.data || []);
        setBattles(battlesRes.data?.data || []);
        setGroups(groupsRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const tabs = [
    { key: 'topics', label: '话题讨论' },
    { key: 'battles', label: '观点对战' },
    { key: 'groups', label: '观影团建' }
  ];

  return (
    <div className="container section">
      <h1 className="section-title">社区</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          {activeTab === 'topics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                <button className="btn btn-primary btn-sm">+ 发起话题</button>
              </div>
              {topics.map(topic => (
                <Link
                  key={topic.id}
                  to={`/community/topics/${topic.id}`}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span className="badge badge-neutral">{topic.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(topic.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{topic.name}</h3>
                  <p style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    {topic.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '12px',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>👥 {topic.member_count || 0} 成员</span>
                    <span>💬 {topic.post_count || 0} 帖子</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'battles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                <button className="btn btn-primary btn-sm">+ 发起对战</button>
              </div>
              {battles.map(battle => (
                <div
                  key={battle.id}
                  style={{
                    padding: '24px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <span className={`badge badge-${battle.status === 'active' ? 'positive' : 'neutral'}`}>
                      {battle.status === 'active' ? '🔥 进行中' : '已结束'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {battle.total_votes || 0} 人参与
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '20px',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {battle.option_a_title}
                      </button>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {battle.option_a_votes || 0} 票 ({battle.option_a_percent || 0}%)
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>VS</div>
                    <div>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {battle.option_b_title}
                      </button>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {battle.option_b_votes || 0} 票 ({battle.option_b_percent || 0}%)
                      </div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '20px', fontSize: '18px', textAlign: 'center' }}>
                    {battle.title}
                  </h3>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                <button className="btn btn-primary btn-sm">+ 组织观影</button>
              </div>
              {groups.map(group => (
                <div
                  key={group.id}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>{group.name}</h3>
                      <span className={`badge badge-${group.status === 'upcoming' ? 'positive' : group.status === 'ongoing' ? 'rating' : 'neutral'}`}>
                        {group.status === 'upcoming' ? '即将开始' : group.status === 'ongoing' ? '进行中' : '已结束'}
                      </span>
                    </div>
                    <button className="btn btn-primary btn-sm">报名参加</button>
                  </div>

                  <p style={{
                    margin: '0 0 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    {group.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>📅 {group.event_date || '时间待定'}</span>
                    <span>📍 {group.location || '线上'}</span>
                    <span>👥 {group.member_count || 0}/{group.max_members || '∞'} 人</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Community;
