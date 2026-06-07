import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ROLE_CONFIG = {
  jobseeker: { 
    label: '我要求职', 
    icon: '👤', 
    color: '#10b981',
    desc: '求职者',
    dashboard: '/jobseeker/dashboard',
    features: ['录制视频简历', 'AI智能匹配', '视频投递', '面试追踪']
  },
  company: { 
    label: '我要招聘', 
    icon: '🏢', 
    color: '#3b82f6',
    desc: '企业HR',
    dashboard: '/company/dashboard',
    features: ['岗位视频上传', '视频简历接收', '招聘漏斗', '人才筛选']
  },
  university: { 
    label: '高校就业办', 
    icon: '🎓', 
    color: '#8b5cf6',
    desc: '就业指导',
    dashboard: '/university/dashboard',
    features: ['校招协同', '就业数据', '企业对接', '学生推荐']
  },
  admin: { 
    label: '后台管理', 
    icon: '⚙️', 
    color: '#f59e0b',
    desc: '平台管理员',
    dashboard: '/admin/dashboard',
    features: ['视频审核', '企业评级', '数据报表', '系统管理']
  }
};

function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: searchParams.get('role') || 'jobseeker',
    companyName: '',
    jobseekerName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: searchParams.get('role') || 'jobseeker'
    }));
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!formData.email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    if (formData.role === 'company' && !formData.companyName.trim()) {
      setError('请输入企业名称');
      return;
    }
    if (formData.role === 'jobseeker' && !formData.jobseekerName.trim()) {
      setError('请输入您的姓名');
      return;
    }

    setLoading(true);

    try {
      const data = await register(formData);
      setSuccess(true);
      
      setTimeout(() => {
        if (data.user.role === 'company') {
          navigate('/company/dashboard?guide=upload_video');
        } else if (data.user.role === 'jobseeker') {
          navigate('/jobseeker/dashboard?guide=record_video');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '注册失败，请重试';
      if (errorMsg.includes('已存在')) {
        setError('用户名或邮箱已被注册，请直接登录');
      } else if (errorMsg.includes('角色')) {
        setError('请选择有效的注册角色');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              ▶
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              创建账号
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              加入视聘，开启新的职业旅程
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'jobseeker' }))}
              className={`btn w-full ${formData.role === 'jobseeker' ? 'btn-primary' : 'btn-outline'}`}
            >
              我要求职
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'company' }))}
              className={`btn w-full ${formData.role === 'company' ? 'btn-primary' : 'btn-outline'}`}
            >
              我要招聘
            </button>
          </div>

          {success ? (
            <div style={{ 
              padding: '24px', 
              background: '#f0fdf4', 
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                注册成功！
              </h3>
              <p style={{ color: '#15803d', fontSize: '14px' }}>
                {formData.role === 'jobseeker' 
                  ? '正在进入求职中心，您可以开始录制视频简历...' 
                  : '正在进入企业中心，您可以上传岗位视频...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#fef2f2', 
                  color: '#dc2626',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">用户名</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱"
                  required
                />
              </div>

              {formData.role === 'company' ? (
                <div className="form-group">
                  <label className="form-label">企业名称</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-input"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="请输入企业名称"
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    name="jobseekerName"
                    className="form-input"
                    value={formData.jobseekerName}
                    onChange={handleChange}
                    placeholder="请输入您的姓名"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码（至少6位）"
                  minLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          {!success && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px', 
              fontSize: '14px',
              color: '#6b7280'
            }}>
              已有账号？
              <Link to="/login" style={{ color: '#4f46e5', marginLeft: '4px' }}>
                立即登录
              </Link>
            </div>
          )}

          <div style={{ marginTop: '28px' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '16px', 
              fontSize: '13px', 
              color: '#6b7280',
              fontWeight: '500'
            }}>
              四大角色工作台，直接进入可办理业务
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (user && user.role === key) {
                      navigate(config.dashboard);
                    } else if (!user) {
                      setFormData(prev => ({ ...prev, role: key }));
                    }
                  }}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '10px',
                    border: formData.role === key ? `2px solid ${config.color}` : '1px solid #e5e7eb',
                    background: formData.role === key ? `${config.color}10` : '#f9fafb',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>{config.icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>
                      {config.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {config.features.slice(0, 2).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: `${ROLE_CONFIG[formData.role].color}10`, 
            borderRadius: '10px',
            border: `1px solid ${ROLE_CONFIG[formData.role].color}30`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '12px', 
              fontWeight: '600', 
              color: ROLE_CONFIG[formData.role].color,
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '18px' }}>{ROLE_CONFIG[formData.role].icon}</span>
              <span>{ROLE_CONFIG[formData.role].label} · 注册后立即进入</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ROLE_CONFIG[formData.role].features.map((feature, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '12px',
                  color: '#4b5563'
                }}>
                  <span style={{ color: ROLE_CONFIG[formData.role].color }}>✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
