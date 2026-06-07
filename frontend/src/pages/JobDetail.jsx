
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useStore from '../store.js';
import { jobAPI, userAPI, referralAPI, messageAPI } from '../api.js';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const [job, setJob] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, friendsRes] = await Promise.all([
          jobAPI.detail(id),
          userAPI.getFriends()
        ]);
        setJob(jobRes.data.job);
        setPhotos(jobRes.data.photos || []);
        setRewards(jobRes.data.rewards || []);
        setFriends(friendsRes.data.friends || []);
      } catch (e) {
        console.error('获取职位详情失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReferral = async () => {
    if (!selectedFriend) {
      alert('请选择要推荐的好友');
      return;
    }
    setSubmitting(true);
    try {
      await referralAPI.create({
        job_id: id,
        candidate_id: selectedFriend,
        message: referralMessage
      });
      setSuccess('内推申请已提交成功！');
      setShowReferralModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      alert(e.response?.data?.error || '内推失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    try {
      const jobData = job;
      const referrerId = jobData.posted_by;
      if (referrerId) {
        await messageAPI.sendMessage({
          receiver_id: referrerId,
          content: `您好，我对您公司的「${jobData.title}」职位很感兴趣，希望能获得内推机会！`,
          content_type: 'text'
        });
        alert('已向推荐人发送申请消息，请等待回复！');
      }
    } catch (e) {
      alert(e.response?.data?.error || '申请失败，请重试');
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

  if (!job) {
    return (
      <div className="container page-content">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-text">职位不存在</div>
            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>返回职位列表</Link>
          </div>
        </div>
      </div>
    );
  }

  const canRefer = user?.current_company_id === job.company_id && user?.role !== 'jobseeker';

  return (
    <div className="container page-content">
      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="page-title">{job.title}</h1>
            <div style={{ color: '#666', marginTop: 8 }}>
              {job.company_verified && <span className="tag verified">✓ 企业已认证</span>}
              {' '}{job.company_name} · {job.location}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {canRefer && (
              <button className="btn btn-primary" onClick={() => setShowReferralModal(true)}>
                🤝 推荐给好友
              </button>
            )}
            {user?.role === 'jobseeker' && (
              <button className="btn btn-primary" onClick={handleApply}>
                📨 申请内推
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="job-salary" style={{ fontSize: 24, marginBottom: 16 }}>
            {job.salary_min}-{job.salary_max}K
          </div>
          <div className="job-tags">
            <span className="tag">{job.position_level === 'senior' ? '高级' : job.position_level === 'middle' ? '中级' : '初级'}</span>
            <span className="tag">{job.location}</span>
            {job.benefits?.map((b, i) => (
              <span key={i} className="benefit-badge highlight">
                ✓ {b.benefit_type} {b.benefit_value && `(${b.benefit_value})`}
              </span>
            ))}
          </div>
        </div>

        {rewards.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>🎁 内推奖励</h3>
            {rewards.map((r, i) => (
              <div key={i} className="card" style={{ background: '#fffbe6', padding: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: '#fa8c16' }}>
                  {r.position_level === 'senior' ? '高级' : r.position_level === 'middle' ? '中级' : '初级'}岗位
                </div>
                <div style={{ marginTop: 4 }}>
                  {r.reward_type === 'cash' ? `💰 现金奖励 ¥${r.reward_amount}` : `🏖️  假期奖励 ${r.reward_days}天`}
                </div>
                {r.description && <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{r.description}</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12, color: '#333' }}>📝 职位描述</h3>
          <div style={{ lineHeight: 1.8, color: '#555', whiteSpace: 'pre-wrap' }}>{job.description}</div>
        </div>

        {job.requirements && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>📋 任职要求</h3>
            <div style={{ lineHeight: 1.8, color: '#555', whiteSpace: 'pre-wrap' }}>{job.requirements}</div>
          </div>
        )}

        {photos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>📸 公司实景</h3>
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

        <div>
          <h3 style={{ marginBottom: 12, color: '#333' }}>🏢 公司信息</h3>
          <div className="card" style={{ background: '#fafafa', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>公司名称</span>
              <span style={{ fontWeight: 500 }}>{job.company_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>营业执照</span>
              <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{job.license_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>公司地址</span>
              <span style={{ fontWeight: 500 }}>{job.company_address}</span>
            </div>
            {job.company_description && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                <div style={{ color: '#666', marginBottom: 4 }}>公司简介</div>
                <div style={{ color: '#555' }}>{job.company_description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReferralModal && (
        <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🤝 推荐给好友</h3>
              <button className="modal-close" onClick={() => setShowReferralModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择好友</label>
                <select
                  className="form-select"
                  value={selectedFriend}
                  onChange={(e) => setSelectedFriend(e.target.value)}
                >
                  <option value="">请选择要推荐的好友</option>
                  {friends.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.username} {f.wechat_verified && '✓ (微信已验证)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">推荐留言（可选）</label>
                <textarea
                  className="form-textarea"
                  value={referralMessage}
                  onChange={(e) => setReferralMessage(e.target.value)}
                  placeholder="写点什么给你的好友和HR..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReferralModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleReferral}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交推荐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
