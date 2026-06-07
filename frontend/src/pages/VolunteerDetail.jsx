import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { volunteerAPI } from '../api';

function VolunteerDetail() {
  const { id } = useParams();
  const [volunteer, setVolunteer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [volRes, actRes, txnRes] = await Promise.all([
        volunteerAPI.getById(id),
        volunteerAPI.getActivities(id),
        volunteerAPI.getTransactions(id)
      ]);
      setVolunteer(volRes.data.data);
      setActivities(actRes.data.data);
      setTransactions(txnRes.data.data);
    } catch (err) {
      console.error('加载志愿者详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="card">加载中...</div></div>;
  if (!volunteer) return <div className="container"><div className="card">志愿者不存在</div></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="grid grid-2">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 700, marginRight: '20px'
              }}>
                {volunteer.name?.[0] || '?'}
              </div>
              <div>
                <h2>{volunteer.name}</h2>
                <div style={{ color: 'var(--text-secondary)' }}>{volunteer.phone}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {volunteer.skills?.map(s => <span key={s} className="tag tag-primary">{s}</span>)}
                </div>
              </div>
            </div>

            <div className="grid grid-3" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-card-value">{volunteer.total_hours?.toFixed(1) || 0}</div>
                <div className="stat-card-label">服务时长(小时)</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: 'var(--success-color)' }}>
                  {volunteer.yicoin?.balance || 0}
                </div>
                <div className="stat-card-label">益币余额</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: 'var(--warning-color)' }}>
                  {volunteer.yicoin?.total_earned || 0}
                </div>
                <div className="stat-card-label">累计益币</div>
              </div>
            </div>

            {volunteer.blockchain_hash && (
              <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>🔗 区块链存证哈希</div>
                <div style={{ wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{volunteer.blockchain_hash}</div>
              </div>
            )}

            {volunteer.organization_history?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>历史组织归属</div>
                {volunteer.organization_history.map((org, i) => (
                  <div key={i} style={{ padding: '8px', background: '#fafafa', borderRadius: '4px', marginBottom: '4px', fontSize: '14px' }}>
                    {typeof org === 'string' ? org : org.name || JSON.stringify(org)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="card">
              <div className="card-title">服务活动记录</div>
              {activities.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p>暂无活动记录</p>
                </div>
              ) : (
                activities.map(act => (
                  <Link to={`/activities/${act.id}`} key={act.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 600 }}>{act.title}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span className={`tag tag-${act.status === 'completed' ? 'success' : 'primary'}`}>{act.status}</span>
                        {act.actual_hours && <span style={{ marginLeft: '8px' }}>时长: {act.actual_hours}h</span>}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-title">益币交易记录</div>
              {transactions.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p>暂无交易记录</p>
                </div>
              ) : (
                transactions.map(txn => (
                  <div key={txn.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{txn.reason || txn.type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(txn.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 700,
                      color: txn.type === 'earn' ? 'var(--success-color)' : 'var(--error-color)'
                    }}>
                      {txn.type === 'earn' ? '+' : '-'}{txn.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerDetail;
