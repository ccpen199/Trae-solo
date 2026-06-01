import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { jobAPI } from '../api/client';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState('');
  const user = useAuthStore((state) => state.user);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadDetail();
    loadTemplates();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await jobAPI.getJob(id);
      setData(res.data);
    } catch (err) {
      console.error('加载详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await jobAPI.getTemplates();
      setTemplates(res.data.templates);
    } catch (err) {
      console.error('加载模板失败', err);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setApplying(true);
    try {
      await jobAPI.applyJob(id, { resume: '在线简历' });
      setMessage('申请成功！');
      loadDetail();
    } catch (err) {
      setMessage(err.response?.data?.error || '申请失败');
    } finally {
      setApplying(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSign = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSigning(true);
    try {
      const res = await jobAPI.signJob(id, { signer_name: user.real_name || user.username });
      setMessage('电子签章成功！合同哈希：' + res.data.signature.document_hash.substring(0, 16));
      loadDetail();
    } catch (err) {
      setMessage(err.response?.data?.error || '签章失败');
    } finally {
      setSigning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!data?.job) return <div className="loading">信息不存在</div>;

  const job = data.job;

  return (
    <div className="detail-page">
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>返回</button>
      
      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      <div className="detail-header">
        <h1>{job.title}</h1>
        <div style={{ color: '#666', marginTop: '0.5rem' }}>
          {job.employer_name} | {job.region_name} | 发布于 {new Date(job.created_at).toLocaleString()}
        </div>
        <div className="card-badges" style={{ marginTop: '0.5rem' }}>
          {job.verified === 1 && <span className="badge badge-verified">信息已核验</span>}
          {job.employer_type === 'enterprise' && <span className="badge badge-pgc">企业直招</span>}
          {job.employer_type === 'individual' && <span className="badge badge-ugc">个体用工</span>}
        </div>
      </div>

      <div className="detail-info">
        <div className="detail-info-item">
          <div className="label">薪资</div>
          <div className="value" style={{ color: '#e74c3c' }}>
            {job.salary_type === 'monthly'
              ? `${job.salary_min}-${job.salary_max}元/月`
              : `${job.hourly_rate}元/小时`}
          </div>
        </div>
        <div className="detail-info-item">
          <div className="label">工作类型</div>
          <div className="value">
            {job.type === 'fulltime' ? '全职' :
             job.type === 'parttime' ? '兼职' :
             job.type === 'domestic' ? '家政服务' :
             job.type === 'repair' ? '维修服务' : job.type}
          </div>
        </div>
        <div className="detail-info-item">
          <div className="label">工作地址</div>
          <div className="value">{job.address || '面议'}</div>
        </div>
        <div className="detail-info-item">
          <div className="label">联系方式</div>
          <div className="value">{job.contact_phone}</div>
        </div>
      </div>

      {job.salary_type === 'hourly' && templates.length > 0 && (
        <div>
          <h3 className="section-title">小时工计薪模板</h3>
          <div className="card-grid">
            {templates.map((t) => (
              <div key={t.id} className="card">
                <div className="card-title">{t.name}</div>
                <div className="card-meta">
                  时薪: {t.hourly_rate}元 | 加班: {t.overtime_rate}元/小时
                </div>
                <div className="card-meta">
                  餐补: {t.meal_allowance}元 | 交通补: {t.transport_allowance}元
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-description">
        <h3>职位描述</h3>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{job.description}</p>
      </div>

      <div className="detail-description">
        <h3>任职要求</h3>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{job.requirements}</p>
      </div>

      {data.signatures?.length > 0 && (
        <div className="detail-description">
          <h3>电子签章记录</h3>
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>签署人</th>
                <th>文档哈希</th>
                <th>签章数据</th>
                <th>签署时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {data.signatures.map((s) => (
                <tr key={s.id}>
                  <td>{s.signer_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.document_hash?.substring(0, 20)}...</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.signature_data?.substring(0, 20)}...</td>
                  <td>{new Date(s.signed_at).toLocaleString()}</td>
                  <td>{s.status === 1 ? '已签署' : '待签署'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? '申请中...' : '申请职位'}
          </button>
          <button
            className="btn btn-success"
            onClick={handleSign}
            disabled={signing}
          >
            {signing ? '签署中...' : '电子签章'}
          </button>
        </div>
      )}
    </div>
  );
}

export default JobDetail;
