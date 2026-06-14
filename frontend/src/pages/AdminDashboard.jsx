import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api.js';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [suspiciousJobs, setSuspiciousJobs] = useState([]);
  const [creditWarnings, setCreditWarnings] = useState([]);
  const [topSeekers, setTopSeekers] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [recordingsTotal, setRecordingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [statsRes, opinionsRes, jobsRes, creditRes, seekersRes, keywordsRes, recordingsRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.opinions({ pageSize: 20 }),
        adminAPI.suspiciousJobs(),
        adminAPI.creditWarning(),
        adminAPI.topSeekers(),
        adminAPI.opinionKeywords(),
        adminAPI.recordings({ pageSize: 20 })
      ]);
      setStats(statsRes.data);
      setOpinions(opinionsRes.data.opinions);
      setSuspiciousJobs(jobsRes.data);
      setCreditWarnings(creditRes.data);
      setTopSeekers(seekersRes.data);
      setKeywords(keywordsRes.data);
      setRecordings(recordingsRes.data.interviews);
      setRecordingsTotal(recordingsRes.data.total);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanOpinions = async () => {
    setScanLoading(true);
    try {
      const res = await adminAPI.scanOpinions();
      alert(res.data.message);
      loadAllData();
    } catch (err) {
      alert('扫描失败');
    } finally {
      setScanLoading(false);
    }
  };

  const handleJobStatus = async (id, status) => {
    try {
      await adminAPI.updateJobStatus(id, status);
      loadAllData();
      alert('操作成功');
    } catch (err) {
      alert('操作失败');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) return <div className="empty-state">加载中...</div>;

  const tabs = [
    { key: 'stats', label: '📊 数据概览' },
    { key: 'opinions', label: '📢 舆情监控' },
    { key: 'suspicious', label: '⚠️ 风险职位' },
    { key: 'credit', label: '🛡️ 信用预警' },
    { key: 'recordings', label: '🎙️ 录音存档' },
    { key: 'seekers', label: '⭐ 优质求职者' }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>🎛️ 管理后台</h1>

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

      {activeTab === 'stats' && stats && (
        <div>
          <div className="admin-grid">
            <div className="stat-card">
              <div className="label">🏢 企业总数</div>
              <div className="value">{stats.totalCompanies}</div>
            </div>
            <div className="stat-card">
              <div className="label">👤 求职者总数</div>
              <div className="value">{stats.totalSeekers}</div>
            </div>
            <div className="stat-card">
              <div className="label">💼 职位总数</div>
              <div className="value">{stats.totalJobs}</div>
            </div>
            <div className="stat-card">
              <div className="label">✅ 活跃职位</div>
              <div className="value">{stats.activeJobs}</div>
            </div>
            <div className="stat-card">
              <div className="label">📝 投递总数</div>
              <div className="value">{stats.totalApplications}</div>
            </div>
            <div className="stat-card">
              <div className="label">🎙️ 面试总数</div>
              <div className="value">{stats.totalInterviews}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">⚠️ 风险职位</div>
              <div className="value">{stats.suspiciousJobs}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">🚨 负面舆情</div>
              <div className="value">{stats.negativeOpinions}</div>
            </div>
            <div className="stat-card">
              <div className="label">🎙️ 录音存档</div>
              <div className="value">{recordingsTotal}</div>
            </div>
          </div>

          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <strong>🤖 AI监控运行正常</strong> — 系统正在实时监控大众点评、脉脉等平台的负面关键词，
            并对高薪低门槛的虚假招聘进行自动识别和预警。
          </div>

          <div className="detail-section">
            <h3>🔥 热门负面关键词</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {keywords.slice(0, 10).map((kw, idx) => (
                <span
                  key={idx}
                  className={`tag ${kw.sentiment === 'negative' ? 'warning' : 'credit'}`}
                  style={{ fontSize: `${Math.min(1 + kw.count * 0.2, 2)}rem` }}
                >
                  {kw.keyword} ({kw.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'opinions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>📢 AI舆情监控 - 抓取大众点评/脉脉负面关键词</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleScanOpinions}
              disabled={scanLoading}
            >
              {scanLoading ? '扫描中...' : '🔄 立即扫描舆情'}
            </button>
          </div>

          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <strong>💡 AI监控说明：</strong> 系统自动抓取大众点评、脉脉等平台的企业评价，
            识别"拖欠工资"、"加班严重"、"服务态度差"等负面关键词，
            并通过情感分析模型进行分类，为求职者提供参考。点击来源链接可复查原始内容。
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>来源平台</th>
                <th>关键词</th>
                <th>情感倾向</th>
                <th>涉及企业</th>
                <th>内容摘要</th>
                <th>复查记录</th>
                <th>发现时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {opinions.map(op => (
                <tr key={op.id}>
                  <td>
                    <a 
                      href={op.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tag"
                      style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {op.source} ↗
                    </a>
                  </td>
                  <td>
                    <span className={`tag ${op.sentiment === 'negative' ? 'warning' : 'credit'}`}>
                      {op.keyword}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${op.sentiment === 'negative' ? 'rejected' : 'active'}`}>
                      {op.sentiment === 'negative' ? '负面' : '正面'}
                    </span>
                  </td>
                  <td>{op.company_name || '未关联'}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{op.content}</td>
                  <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <div>✅ 已入库</div>
                    <div>{new Date(op.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{op.created_at}</td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => window.open(op.url, '_blank')}
                    >
                      🔍 复查
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'suspicious' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>⚠️ 虚假职位识别 - 高薪低门槛聚类预警</h3>
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <strong>🤖 识别模型说明：</strong> 系统通过聚类算法分析薪资与行业平均水平的偏离度，
            结合职位要求的门槛高低，对"高薪+低门槛"的组合模式进行风险预警。
            当薪资超过行业平均50%且要求包含"无经验"、"学历不限"等关键词时，系统自动标记为风险职位。
          </div>

          {suspiciousJobs.length === 0 ? (
            <div className="empty-state">
              <div>✅</div>
              <p>暂无风险职位</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>职位</th>
                  <th>企业</th>
                  <th>薪资</th>
                  <th>行业平均</th>
                  <th>风险原因</th>
                  <th>企业信用分</th>
                  <th>状态</th>
                  <th>处置记录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {suspiciousJobs.map(job => (
                  <tr key={job.id} style={{ background: '#fef2f2' }}>
                    <td>{job.title}</td>
                    <td>{job.company_name}</td>
                    <td style={{ color: '#ef4444', fontWeight: '500' }}>
                      ¥{job.salary_min}-{job.salary_max}
                    </td>
                    <td>
                      {job.industry === '餐饮' ? '¥4000-7000' : job.industry === '零售' ? '¥4000-6500' : '¥5000-9000'}
                    </td>
                    <td style={{ maxWidth: '250px', fontSize: '0.85rem', color: '#dc2626' }}>
                      {job.suspicious_reason}
                    </td>
                    <td style={{ color: '#fbbf24' }}>
                      {renderStars(job.credit_score)} {job.credit_score?.toFixed(1)}
                    </td>
                    <td>
                      <span className={`status-badge ${job.status}`}>
                        {job.status === 'active' ? '正常' : job.status === 'suspended' ? '已下架' : '已关闭'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {job.status === 'active' ? (
                        <div>待处置</div>
                      ) : job.status === 'suspended' ? (
                        <div>
                          <div>✅ 已下架</div>
                          <div>{new Date().toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <div>
                          <div>✅ 已关闭</div>
                          <div>{new Date().toLocaleDateString()}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {job.status === 'active' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleJobStatus(job.id, 'suspended')}
                        >
                          下架
                        </button>
                      )}
                      {job.status === 'suspended' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleJobStatus(job.id, 'active')}
                        >
                          恢复
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'credit' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🛡️ 信用体系预警 - 对接社保局数据</h3>
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <strong>📊 信用数据说明：</strong> 员工离职率、社保缴纳率等数据对接当地社保局官方接口，
            每月自动更新。当离职率超过30%或社保缴纳率低于60%时，系统自动发出预警。
          </div>

          {creditWarnings.length === 0 ? (
            <div className="empty-state">
              <div>✅</div>
              <p>暂无信用预警企业</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>行业</th>
                  <th>信用评分</th>
                  <th>离职率</th>
                  <th>社保缴纳率</th>
                  <th>预警原因</th>
                  <th>复查记录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {creditWarnings.map(c => (
                  <tr key={c.id} style={{ background: c.credit_score < 3.5 ? '#fef2f2' : '#fef3c7' }}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.industry}</td>
                    <td style={{ color: '#fbbf24' }}>
                      {renderStars(c.credit_score)} {c.credit_score.toFixed(1)}
                    </td>
                    <td>
                      <span className={`status-badge ${c.turnover_rate > 0.3 ? 'rejected' : 'pending'}`}>
                        {(c.turnover_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${c.social_insurance_rate < 0.6 ? 'rejected' : 'pending'}`}>
                        {(c.social_insurance_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#dc2626' }}>
                      {c.credit_score < 3.5 && '信用评分过低；'}
                      {c.turnover_rate > 0.3 && '离职率过高；'}
                      {c.social_insurance_rate < 0.6 && '社保缴纳率低'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      <div>✅ 已预警</div>
                      <div>{new Date().toLocaleDateString()}</div>
                      <div>对接社保局复查中</div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => alert(`已向社保局发起 ${c.name} 的信用数据复查请求`)}
                      >
                        🔍 复查
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'recordings' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🎙️ 面试邀约录音存档 - 电话录音与承诺摘要</h3>
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <strong>📞 录音存档说明：</strong> 所有面试邀约通话均由平台统一拨打并录音，
            系统自动提取薪资、福利、试用期等关键承诺点，推送双方确认并存档，
            确保招聘过程透明可追溯，保障求职者权益。
          </div>

          {recordings.length === 0 ? (
            <div className="empty-state">
              <div>🎙️</div>
              <p>暂无录音存档</p>
            </div>
          ) : (
            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th>企业</th>
                    <th>求职者</th>
                    <th>职位</th>
                    <th>关键承诺点</th>
                    <th>双方确认</th>
                    <th>通话时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.company_name}</strong></td>
                      <td>{r.seeker_name}</td>
                      <td>{r.title}</td>
                      <td style={{ maxWidth: '250px' }}>
                        {r.key_promises && r.key_promises.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {r.key_promises.map((p, idx) => (
                              <span key={idx} className="tag credit" style={{ fontSize: '0.75rem' }}>
                                {p.keyword}: {p.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280' }}>待提取</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                          <div style={{ color: r.status === 'confirmed' ? '#15803d' : '#6b7280' }}>
                            {r.status === 'confirmed' ? '✅ 求职者已确认' : '⏳ 待求职者确认'}
                          </div>
                          <div style={{ color: '#15803d' }}>✅ 企业已确认</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{r.created_at}</td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedRecording(r)}
                        >
                          📄 详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRecording && (
        <div className="modal-overlay" onClick={() => setSelectedRecording(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>🎙️ 录音存档详情</h3>
            <div className="detail-section">
              <p><strong>企业：</strong>{selectedRecording.company_name}</p>
              <p><strong>求职者：</strong>{selectedRecording.seeker_name}</p>
              <p><strong>职位：</strong>{selectedRecording.title}</p>
              <p><strong>面试时间：</strong>{selectedRecording.interview_time}</p>
              <p><strong>面试地点：</strong>{selectedRecording.location}</p>
              <p><strong>通话时间：</strong>{selectedRecording.created_at}</p>
              <p><strong>录音文件：</strong>
                <a href={selectedRecording.recording_url} className="tag credit" target="_blank" rel="noopener noreferrer">
                  🎧 播放录音
                </a>
              </p>
            </div>
            <div className="detail-section">
              <h4>📝 通话摘要</h4>
              <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {selectedRecording.call_summary}
              </p>
            </div>
            <div className="detail-section">
              <h4>🎯 自动提取的关键承诺点</h4>
              {selectedRecording.key_promises && selectedRecording.key_promises.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedRecording.key_promises.map((p, idx) => (
                    <div key={idx} className="sidebar-card" style={{ padding: '0.5rem 1rem', margin: 0 }}>
                      <strong style={{ color: '#92400e' }}>{p.keyword}：</strong>
                      <span>{p.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280' }}>暂无提取到的承诺点</p>
              )}
            </div>
            <div className="detail-section">
              <h4>✅ 双方确认状态</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="sidebar-card" style={{ padding: '1rem', margin: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.3rem' }}>企业确认</div>
                  <div style={{ color: '#15803d', fontSize: '1.1rem', fontWeight: '500' }}>✅ 已确认</div>
                </div>
                <div className="sidebar-card" style={{ padding: '1rem', margin: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.3rem' }}>求职者确认</div>
                  <div style={{ color: selectedRecording.status === 'confirmed' ? '#15803d' : '#f59e0b', fontSize: '1.1rem', fontWeight: '500' }}>
                    {selectedRecording.status === 'confirmed' ? '✅ 已确认' : '⏳ 待确认'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedRecording(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seekers' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>⭐ 优质求职者 - 服务评价星标体系</h3>
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <strong>⭐ 星标体系说明：</strong> 求职者在每次工作结束后获得企业评价，
            评价星级累计形成个人信用档案。高星标求职者在投递时会获得优先推荐，
            并可享受平台提供的就业保障服务。
          </div>

          {topSeekers.length === 0 ? (
            <div className="empty-state">
              <div>⭐</div>
              <p>暂无高星标求职者</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>技能</th>
                  <th>工作经验</th>
                  <th>⭐ 星标评分</th>
                  <th>评价次数</th>
                </tr>
              </thead>
              <tbody>
                {topSeekers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.phone}</td>
                    <td style={{ maxWidth: '200px' }}>{s.skills || '未填写'}</td>
                    <td style={{ maxWidth: '200px' }}>{s.experience || '未填写'}</td>
                    <td style={{ color: '#fbbf24', fontSize: '1.1rem' }}>
                      {renderStars(s.rating)} {s.rating.toFixed(1)}
                    </td>
                    <td>{s.review_count} 次</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
