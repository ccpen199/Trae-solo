import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const skillOptions = [
  '问卷填写', '内容审核', '数据录入', '文案写作', '图片处理', '试玩推广',
  '客服服务', '地推活动', '促销销售', '物流配送', '活动执行',
  '摄影摄像', '翻译服务', '设计服务', '编程开发', '家教辅导',
  '社区运营', '销售推广', '家政服务', 'Excel', 'Photoshop', '视频编辑'
];

const timeSlotOptions = [
  '周一至周五 上午', '周一至周五 下午', '周一至周五 晚上',
  '周六 上午', '周六 下午', '周六 晚上',
  '周日 上午', '周日 下午', '周日 晚上',
  '周末全天', '节假日'
];

function Register({ showToast }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    real_name: '',
    user_type: 'student',
    id_card: '',
    skills: [],
    location: '',
    available_hours: [],
    company_name: '',
    business_license: '',
    contact_name: '',
    contact_phone: '',
    qualification: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const currentSkills = formData.skills || [];
      setFormData(prev => ({
        ...prev,
        skills: checked
          ? [...currentSkills, value]
          : currentSkills.filter(s => s !== value)
      }));
    } else if (name === 'available_hours') {
      const currentSlots = formData.available_hours || [];
      setFormData(prev => ({
        ...prev,
        available_hours: currentSlots.includes(value)
          ? currentSlots.filter(s => s !== value)
          : [...currentSlots, value]
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      showToast('请填写用户名和密码', 'error');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }
    
    if (formData.user_type === 'employer' && !formData.company_name) {
      showToast('请填写企业名称', 'error');
      return;
    }
    
    setLoading(true);
    
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    setLoading(false);
    
    if (result.success) {
      showToast('注册成功', 'success');
      const redirectPath = formData.user_type === 'employer' ? '/create-task' : '/tasks';
      navigate(redirectPath);
    } else {
      showToast(result.error || '注册失败', 'error');
    }
  };

  const userTypeOptions = [
    { value: 'student', label: '在校学生', icon: '👨‍🎓', desc: '利用课余时间' },
    { value: 'homemaker', label: '居家宝妈', icon: '👩‍👧', desc: '灵活时间' },
    { value: 'parttime', label: '兼职上班族', icon: '💼', desc: '增加收入' },
    { value: 'employer', label: '企业雇主', icon: '🏢', desc: '发布任务' }
  ];

  const isWorker = ['student', 'homemaker', 'parttime'].includes(formData.user_type);
  const isEmployer = formData.user_type === 'employer';

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '60px 20px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px' }}>注册账号</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">用户类型 *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {userTypeOptions.map(option => (
              <div
                key={option.value}
                onClick={() => setFormData(prev => ({ ...prev, user_type: option.value }))}
                style={{
                  padding: '16px 8px',
                  border: `2px solid ${formData.user_type === option.value ? '#667eea' : '#e1e8ed'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: formData.user_type === option.value ? '#f0f2ff' : 'white'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{option.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: formData.user_type === option.value ? '#667eea' : '#333' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {option.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">用户名 *</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">真实姓名 *</label>
              <input
                type="text"
                name="real_name"
                className="form-input"
                value={formData.real_name}
                onChange={handleChange}
                placeholder="请输入真实姓名"
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">密码 *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="请设置密码"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">确认密码 *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入密码"
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">手机号 *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="请输入手机号"
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
              />
            </div>
          </div>

          {isWorker && (
            <>
              <div className="form-group">
              <label className="form-label">身份证号 <span style={{ color: '#64748b' }}>(实名认证</span></label>
              <input
                type="text"
                name="id_card"
                className="form-input"
                value={formData.id_card}
                onChange={handleChange}
                placeholder="请输入18位身份证号码，用于实名认证"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">所在城市</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="如：北京市海淀区"
              />
            </div>

            <div className="form-group">
              <label className="form-label">技能标签 <span style={{ color: '#64748b' }}>(可多选，用于任务匹配</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {skillOptions.map(skill => (
                  <label key={skill} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: formData.skills?.includes(skill) ? '#667eea' : '#f1f5f9',
                    color: formData.skills?.includes(skill) ? 'white' : '#475569',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      checked={formData.skills?.includes(skill)}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">空闲时段 <span style={{ color: '#64748b' }}>(可多选)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {timeSlotOptions.map(slot => (
                  <label key={slot} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: formData.available_hours?.includes(slot) ? '#667eea' : '#f1f5f9',
                    color: formData.available_hours?.includes(slot) ? 'white' : '#475569',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      name="available_hours"
                      value={slot}
                      checked={formData.available_hours?.includes(slot)}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    {slot}
                  </label>
                ))}
              </div>
            </div>

            <div className="card" style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: '500', color: '#92400e', marginBottom: '8px' }}>
                📋 实名认证说明
              </div>
              <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
                注册后您可以先浏览任务，但接单前需要完成实名认证（提交身份证正反面照片。
                您可以在"个人中心-实名认证页面提交审核材料。
              </div>
            </div>
          </>
          )}
          
          {isEmployer && (
            <>
              <div className="form-group">
                <label className="form-label">企业名称 *</label>
                <input
                  type="text"
                  name="company_name"
                  className="form-input"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="请输入企业全称"
                />
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">统一社会信用代码</label>
                  <input
                    type="text"
                    name="business_license"
                    className="form-input"
                    value={formData.business_license}
                    onChange={handleChange}
                    placeholder="18位统一社会信用代码"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">联系人</label>
                  <input
                    type="text"
                    name="contact_name"
                    className="form-input"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="联系人姓名"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="tel"
                  name="contact_phone"
                  className="form-input"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="企业联系电话"
                />
              </div>

              <div className="form-group">
                <label className="form-label">企业资质说明</label>
                <textarea
                  name="qualification"
                  className="form-input"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="简述企业主营业务和资质情况（选填）"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="card" style={{
                backgroundColor: '#dbeafe',
                border: '1px solid #93c5fd',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '500', color: '#1e40af', marginBottom: '8px' }}>
                  🏢 企业资质审核说明
                </div>
                <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
                  注册后需要上传营业执照完成企业资质审核。审核通过后获得信用评级，即可发布任务。
                  资质审核通常在1-2个工作日完成。
                </div>
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '立即注册'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          已有账号？<Link to="/login" style={{ color: '#667eea', fontWeight: 500 }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
