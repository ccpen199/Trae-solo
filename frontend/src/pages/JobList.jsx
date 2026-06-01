import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api.js';

function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishError, setPublishError] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [diagnosingId, setDiagnosingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobsAPI.getAll();
      setJobs(res.data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnose = async (job) => {
    setDiagnosingId(job.id);
    try {
      const res = await jobsAPI.diagnose(job.id);
      setSelectedJob({ ...job, diagnosis: res.data });
      setShowDiagnosisModal(true);
      loadJobs();
    } catch (error) {
      alert('诊断失败，请稍后重试');
    } finally {
      setDiagnosingId(null);
    }
  };

  const handlePublish = async (job) => {
    if (!job.diagnosis_result) {
      const confirmed = window.confirm('⚠️ 该职位未经过智能诊断\n\n请先完成诊断以确保：\n• 标题关键词优化\n• 薪资区间合理性\n• JD结构完整性\n• 歧视性表述拦截\n• 薪资真实性核验\n\n是否立即前往诊断？');
      if (confirmed) {
        handleDiagnose(job);
      }
      return;
    }

    setPublishingId(job.id);
    setPublishError(null);
    try {
      const res = await jobsAPI.publish(job.id);
      if (res.data.success) {
        const record = res.data.auditRecord;
        alert(`✅ 发布成功！职位已进入在招状态\n\n━━━━━━━━━━━━━━━━━━━━━━\n发布人：${record.publishedBy}\n发布时间：${new Date(record.publishedAt).toLocaleString()}\n合规评分：${record.complianceScore}分\n薪资核验：${record.salaryVerified ? '✅ 已核验' : '⏳ 待核验'}\n审批渠道：${record.channel}\n━━━━━━━━━━━━━━━━━━━━━━`);
      }
      loadJobs();
    } catch (error) {
      const errData = error.response?.data;
      let errorTitle = '发布失败';
      let errorDetails = [];
      let suggestion = '';
      let showDiagnoseButton = false;
      let showAuthButton = false;

      if (errData?.error === 'company_not_verified') {
        errorTitle = '⚠️ 企业认证未通过';
        errorDetails = [
          '根据平台规则，所有企业必须完成三项认证后方可发布职位：',
          '',
          '  1. 📄 营业执照上传',
          '  2. 🆔 法人身份证验证',
          '  3. 🏦 对公账户验证'
        ];
        suggestion = '';
        showAuthButton = true;
      } else if (errData?.error === 'no_diagnosis') {
        errorTitle = '⚠️ 职位未经过智能诊断';
        errorDetails = [
          errData.message,
          '',
          '诊断将检查以下内容：',
          '  • 标题关键词优化建议',
          '  • 薪资区间合理性提醒',
          '  • JD结构完整性评分',
          '  • 歧视性表述合规审查',
          '  • 薪资真实性核验'
        ];
        suggestion = '';
        showDiagnoseButton = true;
      } else if (errData?.error === 'compliance_failed') {
        errorTitle = '⚠️ 合规审查未通过';
        errorDetails = [errData.message];
        if (errData.violations && errData.violations.length > 0) {
          errorDetails.push('');
          errorDetails.push('检测到以下违规内容：');
          errData.violations.forEach(v => errorDetails.push(`  ❌ ${v.suggestion}`));
        }
        suggestion = '请修改职位描述后重新诊断';
        showDiagnoseButton = true;
      } else if (errData?.error === 'quality_too_low') {
        errorTitle = '⚠️ 职位质量分未达标';
        errorDetails = [
          errData.message,
          '',
          `当前得分：${errData.currentScore}分`,
          `要求得分：${errData.requiredScore}分以上`,
          '',
          '优化建议方向：',
          '  • 补充职位亮点和福利信息',
          '  • 明确岗位职责和任职要求',
          '  • 完善薪资范围和工作地点',
          '  • 增加公司介绍和团队信息'
        ];
        suggestion = '';
        showDiagnoseButton = true;
      } else {
        errorDetails = [errData?.message || '未知错误，请稍后重试'];
      }

      const buttons = [];
      if (showDiagnoseButton) {
        buttons.push({ text: '🔍 立即诊断', action: 'diagnose' });
      }
      if (showAuthButton) {
        buttons.push({ text: '✅ 前往企业认证', action: 'auth' });
      }
      buttons.push({ text: '知道了', action: 'close' });

      const fullMessage = `${errorTitle}\n\n${errorDetails.join('\n')}${suggestion ? '\n\n建议：' + suggestion : ''}`;
      setPublishError({ 
        jobId: job.id, 
        message: fullMessage, 
        errorCode: errData?.error,
        showDiagnoseButton,
        showAuthButton
      });
      
      const userAction = confirm(`${fullMessage}\n\n${showDiagnoseButton ? '[确定] = 立即前往诊断，[取消] = 稍后再说' : ''}`);
      if (userAction && showDiagnoseButton) {
        handleDiagnose(job);
      } else if (userAction && showAuthButton) {
        navigate('/company-auth');
      }
    } finally {
      setPublishingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-draft',
      reviewed: 'badge-reviewed',
      published: 'badge-published'
    };
    const labels = {
      draft: '草稿',
      reviewed: '已审核',
      published: '已发布'
    };
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
  };

  const getScoreColor = (score) => {
    if (!score) return '#999';
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreText = (score) => {
    if (!score) return '未诊断';
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    return '待优化';
  };

  const renderDiagnosisModal = () => {
    if (!showDiagnosisModal || !selectedJob?.diagnosis) return null;
    const d = selectedJob.diagnosis;
    
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} onClick={() => setShowDiagnosisModal(false)}>
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '24px',
          maxWidth: '700px', width: '90%', maxHeight: '85vh', overflow: 'auto'
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>🔍 智能诊断报告 - {selectedJob.title}</h3>
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => setShowDiagnosisModal(false)}
            >
              关闭
            </button>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: d.overallScore >= 60 ? '#e8f5e9' : '#ffebee', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: getScoreColor(d.overallScore) }}>
              {d.overallScore}
            </div>
            <div style={{ color: '#666' }}>综合诊断评分</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📝 标题关键词分析</span>
              <span style={{ color: getScoreColor(d.title.score) }}>{d.title.score}分</span>
            </div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{d.title.title}</div>
            {d.title.suggestions && d.title.suggestions.length > 0 && (
              <div style={{ background: '#fff8e1', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 优化建议：</div>
                {d.title.suggestions.map((s, i) => <div key={i}>• {s}</div>)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>💰 薪资合理性分析</span>
              <span style={{ color: getScoreColor(d.salary.score) }}>{d.salary.score}分</span>
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>{d.salary.title}</div>
            {d.salary.suggestions && d.salary.suggestions.length > 0 && (
              <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 建议：</div>
                {d.salary.suggestions.map((s, i) => <div key={i}>• {s}</div>)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📋 JD结构完整性</span>
              <span style={{ color: getScoreColor(d.description.score) }}>{d.description.score}分</span>
            </div>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{d.description.title}</div>
            <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {d.description.sections.map((s, i) => (
                <span key={i} className={`badge ${s.passed ? 'badge-published' : 'badge-draft'}`}>
                  {s.passed ? '✅' : '❌'} {s.name}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚠️ 合规审查</span>
              <span style={{ color: d.compliance.passed ? '#4caf50' : '#f44336' }}>
                {d.compliance.passed ? '✅ 通过' : '❌ 未通过'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>{d.compliance.title}</div>
            {d.compliance.violations && d.compliance.violations.length > 0 && (
              <div style={{ background: '#ffebee', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#c62828' }}>🚫 检测到违规内容：</div>
                {d.compliance.violations.map((v, i) => <div key={i}>• {v.suggestion}</div>)}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              薪资真实性核验：{d.compliance.salaryVerified ? '✅ 已核验' : '⏳ 待核验'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowDiagnosisModal(false)}
            >
              关闭
            </button>
            {d.overallScore >= 60 && d.compliance.passed && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowDiagnosisModal(false);
                  handlePublish(selectedJob);
                }}
              >
                ✅ 立即发布
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>💼 职位管理</h1>
        <p>管理所有招聘职位及其诊断状态</p>
      </div>

      {publishError && (
        <div className="alert alert-error" style={{ marginBottom: '16px', cursor: 'pointer' }} onClick={() => setPublishError(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>❌ 发布被拦截：</strong>{publishError.message.split('\n')[1]}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {publishError.showDiagnoseButton && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    const job = jobs.find(j => j.id === publishError.jobId);
                    if (job) handleDiagnose(job);
                  }}
                >
                  🔍 立即诊断
                </button>
              )}
              {publishError.showAuthButton && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/company-auth');
                  }}
                >
                  ✅ 企业认证
                </button>
              )}
              <span style={{ color: '#666', fontSize: '12px', alignSelf: 'center' }}>点击关闭</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>职位列表</div>
          <Link to="/jobs/new">
            <button className="btn btn-primary">➕ 发布新职位</button>
          </Link>
        </div>

        {jobs.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>职位名称</th>
                <th>薪资范围</th>
                <th>工作地点</th>
                <th>部门</th>
                <th>合规评分</th>
                <th>状态</th>
                <th>审查明细</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 500 }}>{job.title}</td>
                  <td>¥{job.salary_min?.toLocaleString()} - ¥{job.salary_max?.toLocaleString()}</td>
                  <td>{job.location || '-'}</td>
                  <td>{job.department || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="similarity-bar" style={{ width: '60px' }}>
                        <div 
                          className="similarity-fill" 
                          style={{ 
                            width: `${job.compliance_score || 0}%`,
                            background: getScoreColor(job.compliance_score)
                          }}
                        />
                      </div>
                      <span style={{ color: getScoreColor(job.compliance_score), fontWeight: 600 }}>
                        {job.compliance_score || '-'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {getScoreText(job.compliance_score)}
                      </span>
                    </div>
                  </td>
                  <td>{getStatusBadge(job.status)}</td>
                  <td>
                    {!job.diagnosis_result ? (
                      <span className="badge badge-draft" style={{ cursor: 'pointer' }} onClick={() => handleDiagnose(job)}>
                        ⚠️ 待诊断
                      </span>
                    ) : (
                      <span className="badge badge-reviewed" style={{ cursor: 'pointer' }} onClick={() => handleDiagnose(job)}>
                        📋 查看报告
                      </span>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleDiagnose(job)}
                      disabled={diagnosingId === job.id}
                    >
                      {diagnosingId === job.id ? '诊断中...' : '🔍 诊断'}
                    </button>
                    {job.status !== 'published' && (
                      <button 
                        className={`btn btn-sm ${job.diagnosis_result ? 'btn-success' : 'btn-disabled'}`}
                        onClick={() => handlePublish(job)}
                        disabled={publishingId === job.id}
                        title={!job.diagnosis_result ? '请先完成智能诊断' : ''}
                      >
                        {publishingId === job.id ? '发布中...' : '发布'}
                      </button>
                    )}
                    {job.status === 'published' && (
                      <span className="badge badge-published">已在招</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <div>暂无职位，点击上方按钮发布新职位</div>
          </div>
        )}
      </div>

      {renderDiagnosisModal()}
    </div>
  );
}

export default JobList;
