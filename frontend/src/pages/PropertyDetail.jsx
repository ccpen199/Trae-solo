import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyAPI } from '../api/client';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const res = await propertyAPI.getProperty(id);
      setProperty(res.data.property);
      setVerifications(res.data.verifications || []);
    } catch (err) {
      alert('加载失败');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!property) return <div className="empty">未找到该房源</div>;

  const isVerified = property.property_verified === 1 && property.landlord_id_verified === 1;
  const isSecondhand = property.type === 'secondhand';
  const isRent = property.type === 'rent';

  return (
    <div className="page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>← 返回列表</button>
      
      <div className="detail-header">
        <h1>{property.title}</h1>
        <div className="detail-meta">
          <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`}>
            {isVerified ? '已核验' : '待核验'}
          </span>
          <span className="badge badge-info">{isRent ? '租房' : '二手房'}</span>
          <span className="price-large">
            ¥{property.price.toLocaleString()}{isRent ? '/月' : '万'}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>房源信息</button>
        <button className={`tab ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>核验记录</button>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item">
              <label>区域</label>
              <span>{property.region_name}</span>
            </div>
            <div className="detail-item">
              <label>地址</label>
              <span>{property.address}</span>
            </div>
            <div className="detail-item">
              <label>面积</label>
              <span>{property.area}㎡</span>
            </div>
            <div className="detail-item">
              <label>户型</label>
              <span>{property.rooms}室</span>
            </div>
            <div className="detail-item">
              <label>房东</label>
              <span>{property.landlord_name}</span>
            </div>
            <div className="detail-item">
              <label>发布时间</label>
              <span>{new Date(property.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="detail-section">
            <h3>房源描述</h3>
            <p>{property.description}</p>
          </div>

          {isSecondhand && (
            <div className="detail-section">
              <h3>不动产登记核验</h3>
              <div className="info-box">
                <p><strong>不动产登记编号：</strong>{property.property_reg_no || '暂无'}</p>
                <p><strong>产权校验结果：</strong>
                  {property.property_verified === 1
                    ? <span style={{ color: '#28a745' }}>✅ 已通过官方校验</span>
                    : <span style={{ color: '#dc3545' }}>❌ 未校验</span>}
                </p>
                <p><strong>校验来源：</strong>
                  {property.property_verified === 1
                    ? '北京市不动产登记中心在线校验系统'
                    : '暂无校验记录'}
                </p>
                <p><strong>校验时间：</strong>
                  {verifications.find(v => v.verification_type === 'property_reg')
                    ? new Date(verifications.find(v => v.verification_type === 'property_reg').created_at).toLocaleString()
                    : '暂无'}
                </p>
                <p><strong>复查状态：</strong>
                  {verifications.filter(v => v.verification_type === 'property_reg').length > 1
                    ? <span style={{ color: '#28a745' }}>已有{verifications.filter(v => v.verification_type === 'property_reg').length}次校验记录</span>
                    : '首次校验'}
                </p>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>房东身份核验</h3>
            <div className="info-box">
              <p><strong>房东姓名：</strong>{property.landlord_name}</p>
              <p><strong>身份证号：</strong>{property.landlord_id_card ? `${property.landlord_id_card.substring(0, 6)}****${property.landlord_id_card.substring(14)}` : '暂无'}</p>
              <p><strong>身份核验凭证上传：</strong>
                {property.landlord_id_card
                  ? <span style={{ color: '#28a745' }}>✅ 已上传身份证件</span>
                  : <span style={{ color: '#dc3545' }}>❌ 未上传身份证件</span>}
              </p>
              <p><strong>审核状态：</strong>
                {property.landlord_id_verified === 1
                  ? <span style={{ color: '#28a745' }}>✅ 审核通过</span>
                  : <span style={{ color: '#ffc107' }}>⏳ 待审核/未通过</span>}
              </p>
              {property.landlord_id_verified !== 1 && (
                <p><strong>异常反馈：</strong><span style={{ color: '#dc3545' }}>房东身份核验未通过，建议核实后再交易</span></p>
              )}
              <p><strong>联系电话：</strong>{property.contact_phone || '联系后获取'}</p>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary">联系房东</button>
            <button className="btn btn-secondary">预约看房</button>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="card">
          <h3>核验历史记录</h3>
          {verifications && verifications.length > 0 ? (
            <div className="timeline">
              {verifications.map((v, idx) => (
                <div key={idx} className="timeline-item">
                  <div className={`timeline-dot ${v.verification_passed ? 'dot-success' : 'dot-fail'}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-type">
                        {v.verification_type === 'property_reg' ? '不动产登记核验' : '房东身份核验'}
                      </span>
                      <span className="timeline-date">{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                    <p className="timeline-status">
                      {v.verification_passed ? '✅ 核验通过' : '❌ 核验未通过'}
                    </p>
                    {v.verification_message && (
                      <p className="timeline-msg">{v.verification_message}</p>
                    )}
                    <p className="timeline-operator">
                      核验来源：{v.verification_type === 'property_reg' ? '不动产登记中心' : '身份核验系统'} |
                      操作员：{v.verifier_name || '系统自动'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>暂无核验记录</p>
              <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                核验记录将在发布房源后由系统自动生成
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PropertyDetail;
