import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStore from '../store.js';
import { companyAPI, jobAPI } from '../api.js';

export default function CompanyDetail() {
  const { id } = useParams();
  const { user } = useStore();
  const [company, setCompany] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [photoForm, setPhotoForm] = useState({
    image_url: '',
    latitude: '',
    longitude: ''
  });

  const [rewardForm, setRewardForm] = useState({
    position_level: 'junior',
    reward_type: 'cash',
    reward_amount: '',
    reward_days: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [companyRes, jobsRes] = await Promise.all([
        companyAPI.detail(id),
        jobAPI.list({ company_id: id })
      ]);
      setCompany(companyRes.data.company);
      setPhotos(companyRes.data.photos || []);
      setRewards(companyRes.data.rewards || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取企业详情失败');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.role === 'owner' && user?.current_company_id === parseInt(id);

  const handleUploadPhoto = async () => {
    if (!photoForm.image_url) {
      alert('请输入图片URL');
      return;
    }
    setSubmitting(true);
    try {
      await companyAPI.uploadPhoto(id, {
        image_url: photoForm.image_url,
        latitude: parseFloat(photoForm.latitude) || null,
        longitude: parseFloat(photoForm.longitude) || null
      });
      setSuccess('照片上传成功！');
      setShowPhotoModal(false);
      setPhotoForm({ image_url: '', latitude: '', longitude: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '上传照片失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReward = async () => {
    if (rewardForm.reward_type === 'cash' && !rewardForm.reward_amount) {
      alert('请输入现金奖励金额');
      return;
    }
    if (rewardForm.reward_type === 'vacation' && !rewardForm.reward_days) {
      alert('请输入假期天数');
      return;
    }
    setSubmitting(true);
    try {
      await companyAPI.createReward(id, {
        position_level: rewardForm.position_level,
        reward_type: rewardForm.reward_type,
        reward_amount: rewardForm.reward_type === 'cash' ? parseFloat(rewardForm.reward_amount) : null,
        reward_days: rewardForm.reward_type === 'vacation' ? parseInt(rewardForm.reward_days) : null,
        description: rewardForm.description
      });
      setSuccess('奖励规则创建成功！');
      setShowRewardModal(false);
      setRewardForm({
        position_level: 'junior',
        reward_type: 'cash',
        reward_amount: '',
        reward_days: '',
        description: ''
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '创建奖励规则失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container page-content">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-text">企业不存在</div>
            <Link to="/companies" className="btn btn-primary" style={{ marginTop: 16 }}>
              返回企业列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="card">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              🏢 {company.name}
              {company.verified && <span className="tag verified" style={{ fontSize: 12 }}>✓ 企业已认证</span>}
            </h1>
            <div style={{ color: '#666', marginTop: 8 }}>
              {company.industry} · {company.employee_count}人
            </div>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowPhotoModal(true)}>
                📸 添加照片
              </button>
              <button className="btn btn-success" onClick={() => setShowRewardModal(true)}>
                🎁 添加奖励规则
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ background: '#fafafa', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#666' }}>营业执照</span>
            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{company.license_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#666' }}>公司地址</span>
            <span style={{ fontWeight: 500 }}>{company.address}</span>
          </div>
          {company.description && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
              <div style={{ color: '#666', marginBottom: 8 }}>公司简介</div>
              <div style={{ color: '#555', lineHeight: 1.8 }}>{company.description}</div>
            </div>
          )}
        </div>

        {photos.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 16, color: '#333' }}>📸 公司实景</h3>
            <div className="photo-grid">
              {photos.map((photo, i) => (
                <div key={i} className="photo-item">
                  <img src={photo.image_url} alt={`公司照片${i + 1}`} />
                  <div className="photo-watermark">
                    📍 {photo.latitude?.toFixed(4)}, {photo.longitude?.toFixed(4)} · 地理围栏已验证
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rewards.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 16, color: '#333' }}>🎁 内推奖励规则</h3>
            <div className="job-list">
              {rewards.map((r, i) => (
                <div key={i} className="card" style={{ marginBottom: 0 }}>
                  <div style={{ fontWeight: 600, color: '#fa8c16', marginBottom: 8 }}>
                    {r.position_level === 'senior' ? '高级' : r.position_level === 'middle' ? '中级' : '初级'}岗位
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                    {r.reward_type === 'cash' ? `💰 ¥${r.reward_amount}` : `🏖️  ${r.reward_days}天假期`}
                  </div>
                  {r.description && (
                    <div style={{ color: '#666', fontSize: 13 }}>{r.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 style={{ marginBottom: 16, color: '#333' }}>💼 在招职位</h3>
          {jobs.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">暂无在招职位</div>
              </div>
            </div>
          ) : (
            <div className="job-list">
              {jobs.map(job => (
                <Link to={`/jobs/${job.id}`} key={job.id} className="job-card">
                  <div className="job-title">{job.title}</div>
                  <div className="job-salary">{job.salary_min}-{job.salary_max}K</div>
                  <div className="job-tags">
                    <span className="tag">{job.location}</span>
                    <span className="tag">
                      {job.position_level === 'senior' ? '高级' : job.position_level === 'middle' ? '中级' : '初级'}
                    </span>
                  </div>
                  <div className="job-footer">
                    <span style={{ fontSize: 12, color: '#999' }}>
                      发布于 {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📸 添加公司照片</h3>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">图片URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={photoForm.image_url}
                  onChange={(e) => setPhotoForm({ ...photoForm, image_url: e.target.value })}
                  placeholder="请输入图片链接"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">纬度（可选）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={photoForm.latitude}
                    onChange={(e) => setPhotoForm({ ...photoForm, latitude: e.target.value })}
                    placeholder="如: 39.9042"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">经度（可选）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={photoForm.longitude}
                    onChange={(e) => setPhotoForm({ ...photoForm, longitude: e.target.value })}
                    placeholder="如: 116.4074"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleUploadPhoto} disabled={submitting}>
                {submitting ? '上传中...' : '上传照片'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="modal-overlay" onClick={() => setShowRewardModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎁 添加奖励规则</h3>
              <button className="modal-close" onClick={() => setShowRewardModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">岗位级别</label>
                <select
                  className="form-select"
                  value={rewardForm.position_level}
                  onChange={(e) => setRewardForm({ ...rewardForm, position_level: e.target.value })}
                >
                  <option value="junior">初级</option>
                  <option value="middle">中级</option>
                  <option value="senior">高级</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">奖励类型</label>
                <select
                  className="form-select"
                  value={rewardForm.reward_type}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
                >
                  <option value="cash">现金奖励</option>
                  <option value="vacation">假期奖励</option>
                </select>
              </div>
              {rewardForm.reward_type === 'cash' ? (
                <div className="form-group">
                  <label className="form-label">奖励金额（元）</label>
                  <input
                    type="number"
                    className="form-input"
                    value={rewardForm.reward_amount}
                    onChange={(e) => setRewardForm({ ...rewardForm, reward_amount: e.target.value })}
                    placeholder="请输入奖励金额"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">假期天数</label>
                  <input
                    type="number"
                    className="form-input"
                    value={rewardForm.reward_days}
                    onChange={(e) => setRewardForm({ ...rewardForm, reward_days: e.target.value })}
                    placeholder="请输入假期天数"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">规则说明（可选）</label>
                <textarea
                  className="form-textarea"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="填写奖励规则的额外说明..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRewardModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateReward} disabled={submitting}>
                {submitting ? '创建中...' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
