import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { userApi } from '../services/api';

function UserCenter() {
  const { userInfo, refreshUserInfo, DEMO_USER_ID } = useContext(AppContext);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [growthRes, levelsRes] = await Promise.all([
          userApi.getGrowth(DEMO_USER_ID, 10),
          userApi.getLevels()
        ]);
        
        if (growthRes.data.success) {
          setGrowthRecords(growthRes.data.data.growthRecords);
        }
        if (levelsRes.data.success) {
          setLevels(levelsRes.data.data);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [DEMO_USER_ID, userInfo]);

  const formatCurrency = (fen) => {
    return (fen / 100).toFixed(2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrivilegeIcon = (code) => {
    const icons = {
      'POINT_DOUBLE': '✨',
      'BIRTHDAY_GIFT': '🎁',
      'FREE_CANCEL': '🔄',
      'PRIORITY_SERVICE': '🎧',
      'MEMBER_PRICE': '💰',
      'LATE_CHECKOUT': '⏰',
      'FAST_SECURITY': '⚡',
      'VIP_LOUNGE': '🍸'
    };
    return icons[code] || '⭐';
  };

  if (!userInfo || loading) {
    return (
      <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>加载用户中心数据中...</p>
    </div>
    );
  }

  const { userInfo: userData, privileges, retentionStrategy, expiringGrowth } = userInfo;
  const { user, progressToNext } = userData;

  return (
    <div className="user-center">
      <div className="level-card">
        <div className="level-info">
          <div className="level-icon">{user.level_icon}</div>
          <div className="level-details">
            <div className="level-name">{user.level_name}</div>
            <div className="level-desc">{user.level_description}</div>
            <div className="growth-stats">
              <div className="stat-item">
                <div className="stat-value">{user.available_points}</div>
                <div className="stat-label">可用积分</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{user.current_growth}</div>
                <div className="stat-label">当前成长值</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{user.total_points}</div>
                <div className="stat-label">累计获得积分</div>
              </div>
            </div>
          </div>
        </div>
        
        {progressToNext && (
          <div className="progress-section">
            <div className="progress-header">
              <span>距离 {progressToNext.nextLevelName}</span>
              <span>还需 {progressToNext.neededForNext} 成长值</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressToNext.progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header">当前等级特权</div>
          {privileges && privileges.length > 0 ? (
            <div className="privilege-grid">
              {privileges.map(privilege => (
                <div key={privilege.id} className="privilege-item">
                  <div className="privilege-icon">
                    {getPrivilegeIcon(privilege.privilege_code)}
                  </div>
                  <div className="privilege-name">{privilege.privilege_name}</div>
                  <div className="privilege-desc">{privilege.privilege_description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              升级解锁更多特权
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-header">保级策略</div>
          {retentionStrategy && (
            <div className="retention-card">
              <div className="retention-title">{retentionStrategy.levelName}保级规则</div>
              <div className="retention-desc">{retentionStrategy.strategy}</div>
              <div className="retention-desc" style={{ marginTop: '8px' }}>
                {retentionStrategy.downgradeLevel ? (
                <span>⚠️ 若未达标将降为 {levels.find(l => l.id === retentionStrategy.downgradeLevel)?.name || '小骆驼'}</span>
              ) : (
                <span>✅ 当前等级无保级压力</span>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {expiringGrowth && expiringGrowth.length > 0 && (
        <div className="card">
          <div className="card-header">即将过期的成长值</div>
          {expiringGrowth.map((item, index) => (
            <div key={index} className="expire-warning">
              <span className="expire-icon">⚠️</span>
              <div className="expire-info">
                <span className="expire-amount">{item.expire_amount} 成长值</span>
                <span style={{ marginLeft: '12px', color: '#666' }}>
                  将于 {formatDate(item.expire_date)} 过期
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">最近成长值记录</div>
        {growthRecords.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
            <thead>
              <tr>
                <th>业务线</th>
                <th>成长值</th>
                <th>系数</th>
                <th>变更前</th>
                <th>变更后</th>
                <th>有效期至</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {growthRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.business_name}</td>
                  <td>
                    <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                      +{record.growth_amount}
                    </span>
                  </td>
                  <td>x{record.business_coefficient}</td>
                  <td>{record.growth_before}</td>
                  <td>{record.growth_after}</td>
                  <td>{formatDate(record.expire_date)}</td>
                  <td>{formatDate(record.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            暂无成长值记录，去消费一笔试试？
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-header">全部等级介绍</div>
        <div className="privilege-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {levels.map(level => (
            <div 
              key={level.id} 
              className="privilege-item"
              style={{ 
                borderColor: user.current_level_id === level.id ? '#ff6b00' : '#eee',
                background: user.current_level_id === level.id ? '#fff9f5' : '#fff'
              }}
            >
              <div className="privilege-icon" style={{ fontSize: '32px' }}>
                {level.icon}
              </div>
              <div className="privilege-name">{level.name}</div>
              <div className="privilege-desc">
                {level.min_growth} - {level.max_growth || '∞'} 成长值
              </div>
              <div className="privilege-desc" style={{ marginTop: '4px' }}>
                {level.privileges?.length || 0} 项特权
              </div>
              {user.current_level_id === level.id && (
                <span className="badge badge-success" style={{ marginTop: '8px' }}>当前等级</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserCenter;
