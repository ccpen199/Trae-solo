import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityAPI, volunteerAPI, postAPI } from '../api';

function Home({ user }) {
  const [stats, setStats] = useState({
    activities: 0,
    volunteers: 0,
    hours: 0
  });
  const [recommended, setRecommended] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadStats();
    loadLatestPosts();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 39.9042, lng: 116.4074 });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && user?.volunteer?.id) {
      loadRecommended();
    }
  }, [userLocation, user]);

  const loadStats = async () => {
    try {
      const [actRes, volRes] = await Promise.all([
        activityAPI.getAll({ limit: 100 }),
        volunteerAPI.getAll({ limit: 1000 })
      ]);
      
      let totalHours = 0;
      if (volRes.data.data && volRes.data.data.length > 0) {
        totalHours = volRes.data.data.reduce((sum, v) => sum + (v.total_hours || 0), 0);
      }
      
      setStats({
        activities: actRes.data.total || 0,
        volunteers: volRes.data.total || 0,
        hours: totalHours.toFixed(1)
      });
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  const loadRecommended = async () => {
    try {
      const res = await activityAPI.getRecommended({
        lat: userLocation.lat,
        lng: userLocation.lng,
        volunteer_id: user.volunteer.id,
        limit: 5
      });
      setRecommended(res.data.data);
    } catch (err) {
      console.error('加载推荐活动失败', err);
    }
  };

  const loadLatestPosts = async () => {
    try {
      const res = await postAPI.getAll({ limit: 3 });
      setLatestPosts(res.data.data || []);
    } catch (err) {
      console.error('加载最新动态失败', err);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>欢迎来到志愿公益平台</h1>
        <p style={{ opacity: 0.9, fontSize: '16px' }}>
          用爱心点亮世界，用行动温暖社会。北斗/GPS时空校验 + 区块链存证，让每一份志愿服务都真实可追溯。
        </p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/activities" className="btn" style={{ background: 'white', color: '#1890ff' }}>
            📋 浏览活动
          </Link>
          <Link to="/volunteers" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
            👥 认识志愿者
          </Link>
          <Link to="/organizations" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
            🏢 志愿组织
          </Link>
          <Link to="/yicoin" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
            💰 益币中心
          </Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats.activities}</div>
          <div className="stat-card-label">志愿服务活动</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            含地理围栏、风险等级、保险覆盖
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.volunteers}</div>
          <div className="stat-card-label">注册志愿者</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            区块链哈希存证、技能标签、组织归属
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.hours}</div>
          <div className="stat-card-label">累计服务时长（小时）</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            同步至省级志愿服务云平台
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <Link to="/activities" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-title">
              <span>📋 活动中心</span>
              <span className="tag tag-primary">立即进入</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🛡️ 北斗/GPS时空校验</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 已启用</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📍 地理围栏设置</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 可配置</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⚠️ 风险等级标识</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 三级划分</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🛡️ 保险覆盖状态</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 可追踪</span>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/volunteers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-title">
              <span>👥 志愿者名录</span>
              <span className="tag tag-primary">立即进入</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🔗 服务时长哈希</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 区块链存证</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🏷️ 技能标签匹配</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 多维筛选</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🏢 历史组织归属</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 履历追踪</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>☁️ 省级平台同步</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 自动上报</span>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/organizations" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-title">
              <span>🏢 志愿组织</span>
              <span className="tag tag-primary">立即进入</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📋 民政备案OCR</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 智能识别</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⭐ 组织信用评分</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 动态评估</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📊 活动发布频次</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 数据统计</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📈 能力雷达图</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 五维评估</span>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/yicoin" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div className="card-title">
              <span>💰 益币中心</span>
              <span className="tag tag-primary">立即进入</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📜 获取规则说明</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 清晰透明</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🎯 兑换阈值配置</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 灵活设置</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🛡️ 防刷熔断机制</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 日限500</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📝 兑换记录追踪</span>
                <span style={{ color: 'var(--success-color)' }}>✓ 完整流水</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {user?.volunteer && recommended.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span>🎯 为你推荐</span>
            <span className="tag tag-primary">基于 LBS + 技能匹配</span>
          </div>
          {recommended.map(activity => (
            <Link 
              to={`/activities/${activity.id}`} 
              key={activity.id} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="activity-card">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-meta">
                  <span>📍 {activity.location_name}</span>
                  <span>📅 {new Date(activity.start_time).toLocaleDateString()}</span>
                  <span>🏢 {activity.org_name}</span>
                  {activity.insurance_covered && <span className="tag tag-success">已投保</span>}
                  <span className={`tag tag-${activity.risk_level === 'high' ? 'error' : activity.risk_level === 'medium' ? 'warning' : 'primary'}`}>
                    风险等级: {activity.risk_level}
                  </span>
                </div>
                {activity.matchScore && (
                  <div className="match-score">
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.total}</div>
                      <div className="match-score-label">综合匹配</div>
                    </div>
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.lbs}</div>
                      <div className="match-score-label">LBS距离</div>
                    </div>
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.skills}</div>
                      <div className="match-score-label">技能匹配</div>
                    </div>
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.hours}</div>
                      <div className="match-score-label">时长匹配</div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {latestPosts.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span>📢 最新公益动态</span>
            <Link to="/community" className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>
              查看更多
            </Link>
          </div>
          {latestPosts.map(post => (
            <div key={post.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 600, marginRight: '10px'
                }}>
                  {post.volunteer_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{post.volunteer_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>{post.content}</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {post.service_location && (
                  <span className="tag tag-outline">📍 {post.service_location}</span>
                )}
                {post.service_hours > 0 && (
                  <span className="tag tag-outline">⏱️ {post.service_hours}小时</span>
                )}
                {post.watermark_hash && (
                  <span className="tag tag-outline" style={{ fontSize: '11px' }}>
                    🔒 水印: {post.watermark_hash.slice(0, 12)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">平台特色</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>北斗/GPS双模定位校验</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  拒绝虚拟定位与代签，时空双重验证确保服务真实性
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🔗</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>区块链存证</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  服务时长上链存证，数据不可篡改，可追溯可复查
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>益币激励体系</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  志愿服务获得益币奖励，可兑换公益商品和服务
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">服务保障</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>活动保险覆盖</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  高风险活动配备专项保险，志愿者安全有保障
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⭐</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>组织信用评级</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  志愿组织信用评分体系，选择可靠的合作伙伴
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>☁️</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>省级平台同步</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  服务记录自动同步至省级志愿服务云平台
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
