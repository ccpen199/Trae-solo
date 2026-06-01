import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api.js';

function CompanyAuth() {
  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({
    business_license: '',
    legal_person_id: '',
    corporate_account: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const res = await companyAPI.getById(1);
      setCompany(res.data);
      setFormData({
        business_license: res.data.business_license || '',
        legal_person_id: res.data.legal_person_id || '',
        corporate_account: res.data.corporate_account || ''
      });
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await companyAPI.verify(1, formData);
      loadCompany();
      alert('认证信息已提交审核！');
    } catch (error) {
      console.error('Failed to submit verification:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-reviewed', text: '审核中' },
      approved: { class: 'badge-published', text: '已认证' },
      rejected: { class: 'badge-draft', text: '未通过' }
    };
    const badge = badges[status] || { class: 'badge-draft', text: '未认证' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>🔐 企业认证</h1>
        <p>企业资质认证，确保招聘合规性</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">企业信息</div>
          
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>企业名称</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{company?.name}</div>
            </div>
          </div>

          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>认证状态</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{getStatusBadge(company?.auth_status)}</div>
            </div>
          </div>

          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>创建时间</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{new Date(company?.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">认证要求</div>
          
          <div className="alert alert-warning">
            <strong>⚠️ 为确保平台招聘合规性，所有企业必须完成以下三项认证后方可发布职位：</strong>
          </div>

          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>1. 营业执照</div>
                <div style={{ fontSize: '12px', color: '#666' }}>上传营业执照扫描件或照片</div>
              </div>
              {company?.business_license ? (
                <span className="badge badge-published">已提交</span>
              ) : (
                <span className="badge badge-draft">待上传</span>
              )}
            </div>

            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>2. 法人身份证</div>
                <div style={{ fontSize: '12px', color: '#666' }}>企业法人身份证明</div>
              </div>
              {company?.legal_person_id ? (
                <span className="badge badge-published">已提交</span>
              ) : (
                <span className="badge badge-draft">待上传</span>
              )}
            </div>

            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>3. 对公账户</div>
                <div style={{ fontSize: '12px', color: '#666' }}>企业对公银行账户验证</div>
              </div>
              {company?.corporate_account ? (
                <span className="badge badge-published">已提交</span>
              ) : (
                <span className="badge badge-draft">待验证</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">提交认证信息</div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">营业执照编号</label>
            <input
              type="text"
              name="business_license"
              className="form-input"
              value={formData.business_license}
              onChange={handleChange}
              placeholder="统一社会信用代码"
            />
          </div>
          <div className="form-group">
            <label className="form-label">法人身份证号</label>
            <input
              type="text"
              name="legal_person_id"
              className="form-input"
              value={formData.legal_person_id}
              onChange={handleChange}
              placeholder="身份证号码"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">对公账户</label>
          <input
            type="text"
            name="corporate_account"
            className="form-input"
            value={formData.corporate_account}
            onChange={handleChange}
            placeholder="银行账号"
          />
        </div>

        <div className="alert alert-info">
          <strong>💡 AI合规审查说明</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>所有职位发布前将自动审查是否包含歧视性表述</li>
            <li>自动核实验证薪资信息真实性</li>
            <li>屏蔽年龄、性别、地域等敏感词汇</li>
            <li>确保符合《就业促进法》相关规定</li>
          </ul>
        </div>

        <button 
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={company?.auth_status === 'approved'}
        >
          📤 提交认证
        </button>
      </div>
    </div>
  );
}

export default CompanyAuth;
