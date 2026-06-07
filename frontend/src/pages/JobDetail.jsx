import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [myResumes, setMyResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');

  useEffect(() => {
    fetchJobDetail();
    if (user?.role === 'jobseeker') {
      fetchMyResumes();
    }
  }, [id, user]);

  const fetchJobDetail = async () => {
    try {
      const { data } = await axios.get(`/api/jobs/${id}`);
      setJob(data.job);
    } catch (err) {
      console.error('Failed to fetch job:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResumes = async () => {
    try {
      const { data } = await axios.get('/api/resumes/my');
      setMyResumes(data.resumes);
      if (data.resumes.length > 0) {
        setSelectedResume(data.resumes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      await axios.post(`/api/applications/${id}/apply`, {
        resumeId: selectedResume || null
      });
      alert('投递成功！');
    } catch (err) {
      alert(err.response?.data?.error || '投递失败');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        岗位不存在
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '72px', 
                  height: '72px', 
                  background: '#f3f4f6', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0
                }}>
                  🏢
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                    {job.title}
                  </h1>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: '#4f46e5',
                    marginBottom: '8px'
                  }}>
                    {job.salary_min}K - {job.salary_max}K
                  </div>
                  <div style={{ display: 'flex', gap: '16px', color: '#6b7280', fontSize: '14px' }}>
                    <span>📍 {job.location || '不限'}</span>
                    <span>📊 {job.experience_required || '经验不限'}</span>
                    <span>🎓 {job.education_required || '学历不限'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {job.skills?.map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                ))}
              </div>

              {job.video_status === 'approved' && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    🎬 岗位介绍视频
                  </h3>
                  <video 
                    controls 
                    style={{ width: '100%', borderRadius: '12px', background: '#000' }}
                    src={`/api/videos/stream/${job.video_id}`}
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  岗位描述
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {job.description || '暂无描述'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                企业信息
              </h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: '#f3f4f6', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0
                }}>
                  🏢
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {job.company_name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {job.company_industry} · {job.company_size}
                  </div>
                </div>
              </div>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
                {job.company_description}
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '16px', 
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div className="badge badge-primary">
                  信用评分 {job.company_credit}
                </div>
                {job.company_verified ? (
                  <div className="badge badge-success">已认证</div>
                ) : (
                  <div className="badge badge-gray">未认证</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: '88px' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                投递简历
              </h3>

              {user?.role === 'jobseeker' ? (
                <>
                  {myResumes.length > 0 ? (
                    <div className="form-group">
                      <label className="form-label">选择简历</label>
                      <select 
                        className="form-input form-select"
                        value={selectedResume}
                        onChange={(e) => setSelectedResume(e.target.value)}
                      >
                        {myResumes.map(resume => (
                          <option key={resume.id} value={resume.id}>
                            {resume.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '16px', 
                      background: '#fef3c7', 
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      您还没有创建简历，先去
                      <span 
                        onClick={() => navigate('/jobseeker/dashboard')}
                        style={{ color: '#4f46e5', cursor: 'pointer' }}
                      >
                        创建简历
                      </span>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary w-full"
                    onClick={handleApply}
                    disabled={applying}
                  >
                    {applying ? '投递中...' : '立即投递'}
                  </button>
                </>
              ) : user?.role === 'company' ? (
                <div className="text-center text-muted">
                  企业用户无法投递岗位
                </div>
              ) : (
                <button 
                  className="btn btn-primary w-full"
                  onClick={() => navigate('/login')}
                >
                  登录后投递
                </button>
              )}

              <div style={{ 
                marginTop: '24px', 
                paddingTop: '24px', 
                borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280' }}>浏览量</span>
                  <span style={{ fontWeight: '500' }}>{job.views_count}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>发布时间</span>
                  <span style={{ fontWeight: '500' }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetail;
