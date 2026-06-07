import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useStore from '../store.js';
import { referralAPI } from '../api.js';

export default function Referrals() {
  const { user } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || (user?.role === 'jobseeker' ? 'received' : 'sent'));
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, [activeTab]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await referralAPI.list({ type: activeTab });
      setReferrals(res.data.referrals || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取内推列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      reviewing: '审核中',
      interviewing: '面试中',
      offer: '已发Offer',
      hired: '已入职',
      rejected: '已拒绝',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  const tabs = user?.role === 'employer'
    ? [
        { key: 'sent', label: '发出的' },
        { key: 'received', label: '收到的' },
        { key: 'company', label: '公司的' }
      ]
    : user?.role === 'hr' || user?.role === 'owner'
    ? [
        { key: 'received', label: '收到的' },
        { key: 'company', label: '公司的' }
      ]
    : [
        { key: 'received', label: '收到的' },
        { key: 'sent', label: '发出的' }
      ];

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">📋 内推管理</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {referrals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无内推记录</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>职位</th>
                <th>公司</th>
                {activeTab !== 'received' && <th>候选人</th>}
                {activeTab === 'received' && <th>推荐人</th>}
                <th>状态</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/referrals/${r.id}`} style={{ color: '#667eea', fontWeight: 500 }}>
                      {r.job_title}
                    </Link>
                  </td>
                  <td>{r.company_name}</td>
                  {activeTab !== 'received' && <td>{r.candidate_name}</td>}
                  {activeTab === 'received' && <td>{r.referrer_name}</td>}
                  <td>
                    <span className={`status-badge status-${r.status}`}>
                      {getStatusText(r.status)}
                    </span>
                  </td>
                  <td style={{ color: '#999', fontSize: 12 }}>
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link to={`/referrals/${r.id}`} className="btn btn-sm btn-primary">
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
