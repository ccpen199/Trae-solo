import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [adminActions, setAdminActions] = useState([]);
  const [funnelData, setFunnelData] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') { fetchStats(); fetchFunnel(); }
    if (activeTab === 'videos') fetchPendingVideos();
    if (activeTab === 'companies') fetchCompanies();
    if (activeTab === 'audit') fetchAdminActions();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchFunnel = async () => {
    try {
      const { data } = await axios.get('/api/admin/funnel');
      setFunnelData(data);
    } catch (err) {
      console.error('Failed to fetch funnel:', err);
    }
  };

  const fetchPendingVideos = async () => {
    try {
      const { data } = await axios.get('/api/videos/pending');
      setPendingVideos(data.videos);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get('/api/admin/companies');
      setCompanies(data.companies);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const fetchAdminActions = async () => {
    try {
      const { data } = await axios.get('/api/admin/actions');
      setAdminActions(data.actions);
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    }
  };

  const handleReviewVideo = async (videoId, status, rejectReason = '') => {
    try {
      await axios.put(`/api/videos/${videoId}/review`, {
        status,
        rejectReason,
        reviewNote: '人工审核'
      });
      setSelectedVideo(null);
      fetchPendingVideos();
      fetchStats();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleUpdateCompany = async (companyId, field, value) => {
    try {
      await axios.put(`/api/admin/companies/${companyId}/credit`, {
        [field]: value
      });
      fetchCompanies();
    } catch (err) {
      alert('操作失败');
    }
  };

  const getCreditLevel = (score) => {
    if (score >= 90) return { label: 'AAA', color: '#16a34a', bg: '#f0fdf4' };
    if (score >= 80) return { label: 'AA', color: '#4f46e5', bg: '#eff6ff' };
    if (score >= 70) return { label: 'A', color: '#d97706', bg: '#fffbeb' };
    if (score >= 60) return { label: 'B', color: '#ea580c', bg: '#fff7ed' };
    return { label: 'C', color: '#dc2626', bg: '#fef2f2' };
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="page-header">
        <h1 className="page-title">管理后台</h1>
        <p className="page-subtitle">平台数据管理与运营监控</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          {['overview', 'funnel', 'videos', 'companies', 'audit'].map(tab => (
            <button 
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, border: 'none', background: 'transparent', color: activeTab === tab ? '#4f46e5' : '#6b7280', borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent', padding: '12px 16px' }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' ? '数据概览' : tab === 'funnel' ? '招聘漏斗' : tab === 'videos' ? '视频审核' : tab === 'companies' ? '企业信用' : '审核记录'}
            </button>
          ))}
        </div>

        <div className="card-body">
          {activeTab === 'overview' && stats && (
            <div>
              <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#4f46e5' }}>
                    {stats.overview.totalUsers}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>总用户数</div>
                </div>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#06b6d4' }}>
                    {stats.overview.totalJobs}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>岗位数</div>
                </div>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#f59e0b' }}>
                    {stats.overview.totalApplications}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>投递数</div>
                </div>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#ef4444' }}>
                    {stats.overview.pendingVideos}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>待审核视频</div>
                </div>
              </div>

              <div className="grid grid-3">
                <div className="card">
                  <div className="card-header">
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>用户分布</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}>
                          {stats.overview.totalCompanies}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>企业用户</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                          {stats.overview.totalJobseekers}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>求职者</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5' }}>
                          {stats.overview.approvedVideos}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>已通过视频</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>招聘效果</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5' }}>
                          {stats.overview.totalApplications}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>总投递</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                          {stats.overview.totalHired}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>入职数</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                          {stats.overview.totalApplications > 0 ? Math.round(stats.overview.totalHired / stats.overview.totalApplications * 100) : 0}%
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>转化率</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>视频审核</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                          {stats.overview.pendingVideos}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>待审核</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                          {stats.overview.approvedVideos}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>已通过</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5' }}>
                          {stats.overview.totalVideos}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>总视频</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                📊 全平台招聘漏斗分析
              </h3>
              {funnelData ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                    {[
                      { label: '曝光量', value: funnelData.exposure, color: '#4f46e5', width: '100%' },
                      { label: '观看数', value: funnelData.viewed, color: '#06b6d4', width: '75%' },
                      { label: '投递数', value: funnelData.applications, color: '#f59e0b', width: '50%' },
                      { label: '面试数', value: funnelData.interviews, color: '#8b5cf6', width: '30%' },
                      { label: '入职数', value: funnelData.hires, color: '#10b981', width: '15%' }
                    ].map((item, i, arr) => (
                      <div key={item.label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                        <div style={{ 
                          height: '100px', 
                          background: `linear-gradient(180deg, ${item.color}20, ${item.color}10)`,
                          borderRadius: '8px 8px 0 0',
                          margin: '0 auto',
                          width: item.width,
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          paddingBottom: '8px',
                          borderBottom: `3px solid ${item.color}`
                        }}>
                          <span style={{ fontSize: '28px', fontWeight: '700', color: item.color }}>
                            {item.value}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginTop: '8px', fontWeight: '500' }}>
                          {item.label}
                        </div>
                        {i < arr.length - 1 && item.value > 0 && (
                          <div style={{ 
                            position: 'absolute', 
                            right: '-24px', 
                            top: '44px',
                            fontSize: '11px',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            zIndex: 1
                          }}>
                            {arr[i + 1].value > 0 ? Math.round(arr[i + 1].value / item.value * 100) : 0}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-4">
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>总投递</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{funnelData.applications}</div>
                    </div>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>待查看</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>{funnelData.pending || 0}</div>
                    </div>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>整体转化率</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        {funnelData.exposure > 0 ? Math.round(funnelData.hires / funnelData.exposure * 100) : 0}%
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>投递转化率</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                        {funnelData.applications > 0 ? Math.round(funnelData.hires / funnelData.applications * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted" style={{ padding: '40px' }}>
                  加载漏斗数据中...
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🎬 视频审核工作台
              </h3>
              {pendingVideos.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '40px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                  暂无待审核视频
                </div>
              ) : (
                <div className="grid grid-3">
                  {pendingVideos.map(video => (
                    <div key={video.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}
                         onClick={() => setSelectedVideo(video)}>
                      <div style={{ 
                        height: '140px', 
                        background: '#f3f4f6', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        marginBottom: '12px'
                      }}>
                        🎬
                      </div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{video.title}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        上传者: {video.uploader_name}
                      </div>
                      <span className="badge badge-warning">待审核</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🏢 企业信用评级管理
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600' }}>企业名称</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>信用评级</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>信用评分</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>社保缴纳率</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>离职率</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>认证状态</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => {
                      const level = getCreditLevel(company.credit_score || 0);
                      return (
                        <tr key={company.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{company.name}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: level.color,
                              background: level.bg
                            }}>
                              {level.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              value={company.credit_score}
                              onChange={(e) => handleUpdateCompany(company.id, 'creditScore', parseInt(e.target.value))}
                              style={{ width: '70px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              value={company.social_insurance_rate || 0}
                              onChange={(e) => handleUpdateCompany(company.id, 'socialInsuranceRate', parseFloat(e.target.value))}
                              style={{ width: '70px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}
                            />%
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              value={company.turnover_rate || 0}
                              onChange={(e) => handleUpdateCompany(company.id, 'turnoverRate', parseFloat(e.target.value))}
                              style={{ width: '70px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}
                            />%
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${company.verified ? 'badge-success' : 'badge-gray'}`}>
                              {company.verified ? '已认证' : '未认证'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => handleUpdateCompany(company.id, 'verified', !company.verified)}
                            >
                              {company.verified ? '取消认证' : '认证'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                📋 审核复查记录
              </h3>
              {adminActions.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '40px' }}>
                  暂无审核记录
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600' }}>时间</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600' }}>操作类型</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600' }}>目标类型</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600' }}>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminActions.map(action => (
                        <tr key={action.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                            {new Date(action.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge ${
                              action.action.includes('approve') ? 'badge-success' :
                              action.action.includes('reject') ? 'badge-danger' : 'badge-primary'
                            }`}>
                              {action.action}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{action.target_type}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>{action.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>视频审核</h2>
              <button onClick={() => setSelectedVideo(null)} style={{ background: 'none', fontSize: '24px' }}>×</button>
            </div>
            <div className="card-body">
              <div style={{ 
                height: '360px', 
                background: '#000', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: '#fff'
              }}>
                <video 
                  controls 
                  style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                  src={`/api/videos/stream/${selectedVideo.id}`}
                >
                  视频预览区域
                </video>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {selectedVideo.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  {selectedVideo.description || '无描述'}
                </p>
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
                  上传者: {selectedVideo.uploader_name} ({selectedVideo.uploader_email})
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-success w-full"
                  onClick={() => handleReviewVideo(selectedVideo.id, 'approved')}
                >
                  ✓ 通过
                </button>
                <button 
                  className="btn btn-danger w-full"
                  onClick={() => handleReviewVideo(selectedVideo.id, 'rejected', '内容不符合规范')}
                >
                  ✕ 拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
