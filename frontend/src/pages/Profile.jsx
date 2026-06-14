import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user, verifyIdentity, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [myListings, setMyListings] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [message, setMessage] = useState('');
  const [certType, setCertType] = useState('');
  const [ocrResult, setOcrResult] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (activeTab === 'info') {
      loadMyListings();
    } else if (activeTab === 'certificates') {
      loadCertificates();
    }
  }, [user, activeTab]);

  const loadMyListings = async () => {
    try {
      const res = await api.get('/listings', { params: { pageSize: 100 } });
      setMyListings(res.data.listings.filter(l => l.user_id === user.id));
    } catch (err) {
      console.error('加载我的发布失败', err);
    }
  };

  const loadCertificates = async () => {
    try {
      const res = await api.get('/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error('加载证书失败', err);
    }
  };

  const handleOcr = async () => {
    if (!certType) {
      setMessage('请选择证书类型');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('cert_type', certType);
      const res = await api.post('/certificates/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setOcrResult(res.data);
      setShowOcrModal(true);
    } catch (err) {
      setMessage(err.response?.data?.error || 'OCR识别失败');
    }
  };

  const handleSaveCert = async () => {
    if (!ocrResult) return;
    try {
      await api.post('/certificates', {
        cert_type: ocrResult.cert_type,
        ...ocrResult.ocr_data,
        ocr_data: ocrResult.ocr_data
      });
      setMessage('证书保存成功！');
      setShowOcrModal(false);
      setShowCertModal(false);
      setOcrResult(null);
      setCertType('');
      loadCertificates();
      refreshUser();
    } catch (err) {
      setMessage(err.response?.data?.error || '保存失败');
    }
  };

  const handleDeleteCert = async (id) => {
    if (!confirm('确定要删除这个证书吗？')) return;
    try {
      await api.delete(`/certificates/${id}`);
      loadCertificates();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleVerify = async () => {
    try {
      await verifyIdentity(realName, idCard);
      setMessage('实名认证成功！');
      setShowVerifyModal(false);
    } catch (err) {
      setMessage(err.response?.data?.error || '认证失败');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm('确定要删除这条信息吗？')) return;
    try {
      await api.delete(`/listings/${id}`);
      loadMyListings();
    } catch (err) {
      alert('删除失败');
    }
  };

  if (!user) return null;

  return (
    <div className="container">
      <div className="sidebar-layout">
        <div className="sidebar">
          <div className="sidebar-menu">
            <div
              className={`sidebar-item ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              📋 我的信息
            </div>
            <div
              className={`sidebar-item ${activeTab === 'certificates' ? 'active' : ''}`}
              onClick={() => setActiveTab('certificates')}
            >
              📜 资质证书
            </div>
          </div>
        </div>
        <div className="sidebar-content">
          {activeTab === 'info' && (
            <>
              <div className="card">
                <h2 className="card-title">个人信息</h2>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '5rem' }}>👤</div>
                  <div>
                    <h3>{user.nickname}</h3>
                    <p style={{ color: '#666' }}>手机号：{user.phone}</p>
                    <p style={{ color: '#666' }}>
                      认证状态：
                      {user.is_verified ? (
                        <span className="badge badge-verified">已实名认证</span>
                      ) : (
                        <span className="badge">未认证</span>
                      )}
                    </p>
                    <p style={{ color: '#666' }}>信用分：{user.credit_score}</p>
                  </div>
                </div>
                {!user.is_verified && (
                  <button className="btn btn-primary" onClick={() => setShowVerifyModal(true)}>
                    去实名认证
                  </button>
                )}
              </div>

              <div className="card">
                <h3 className="card-title">我的发布 ({myListings.length})</h3>
                {myListings.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                    暂无发布信息，<a href="/create" style={{ color: '#4f46e5' }}>去发布</a>
                  </p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>标题</th>
                        <th>分类</th>
                        <th>价格</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <a href={`/listing/${item.id}`} style={{ color: '#333' }}>
                              {item.title}
                            </a>
                          </td>
                          <td>{item.category_name}</td>
                          <td>¥{item.price}</td>
                          <td>
                            {item.status === 1 ? (
                              <span className="tag tag-success">正常</span>
                            ) : (
                              <span className="tag">已下线</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteListing(item.id)}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'certificates' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>我的资质证书</h2>
                <button className="btn btn-primary" onClick={() => setShowCertModal(true)}>
                  + 添加证书
                </button>
              </div>
              {certificates.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                  暂无证书，添加证书可提升信息可信度
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>证书类型</th>
                      <th>证书名称</th>
                      <th>编号</th>
                      <th>发证机构</th>
                      <th>有效期</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.id}>
                        <td>{cert.cert_type}</td>
                        <td>{cert.cert_name}</td>
                        <td>{cert.cert_number}</td>
                        <td>{cert.issuer}</td>
                        <td>{cert.expiry_date || '长期'}</td>
                        <td>
                          {cert.verified_status ? (
                            <span className="tag tag-success">已核验</span>
                          ) : (
                            <span className="tag">待核验</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCert(cert.id)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">实名认证</div>
              <button className="close-btn" onClick={() => setShowVerifyModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-error">{message}</div>}
            <div className="form-group">
              <label>真实姓名</label>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="请输入真实姓名"
              />
            </div>
            <div className="form-group">
              <label>身份证号</label>
              <input
                type="text"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="请输入身份证号码"
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              您的实名信息仅用于身份核验，平台将严格保护您的隐私
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowVerifyModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleVerify}>
                提交认证
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">添加资质证书</div>
              <button className="close-btn" onClick={() => setShowCertModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-error">{message}</div>}
            <div className="form-group">
              <label>选择证书类型</label>
              <select value={certType} onChange={(e) => setCertType(e.target.value)}>
                <option value="">请选择证书类型</option>
                <option value="身份证">身份证</option>
                <option value="电工证">电工证</option>
                <option value="驾驶证">驾驶证</option>
                <option value="房产证">房产证</option>
                <option value="营业执照">营业执照</option>
                <option value="教师资格证">教师资格证</option>
                <option value="健康证">健康证</option>
                <option value="其他">其他证书</option>
              </select>
            </div>
            <div className="form-group">
              <label>上传证书照片</label>
              <input type="file" accept="image/*" style={{ width: '100%', padding: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                支持JPG、PNG格式，大小不超过5MB
              </p>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              系统将自动进行OCR识别并与官方数据交叉验证
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCertModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOcr} disabled={!certType}>
                开始OCR识别
              </button>
            </div>
          </div>
        </div>
      )}

      {showOcrModal && ocrResult && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <div className="modal-title">OCR识别结果</div>
              <button className="close-btn" onClick={() => setShowOcrModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-success">{message}</div>}
            
            <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ color: '#16a34a', marginBottom: '0.5rem' }}>
                ✅ {ocrResult.message}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {ocrResult.verification_suggestion}
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}>识别信息</h4>
            <table className="table">
              <tbody>
                <tr>
                  <td style={{ width: '100px', fontWeight: '500' }}>证书类型</td>
                  <td>{ocrResult.cert_type}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>证书名称</td>
                  <td>{ocrResult.ocr_data.cert_name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>证书编号</td>
                  <td>{ocrResult.ocr_data.cert_number}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>发证机构</td>
                  <td>{ocrResult.ocr_data.issuer}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>发证日期</td>
                  <td>{ocrResult.ocr_data.issue_date}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>有效期至</td>
                  <td>{ocrResult.ocr_data.expiry_date}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: '0.85rem', color: '#999', margin: '1rem 0' }}>
              请核对以上信息是否正确，确认无误后点击保存
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowOcrModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveCert}>
                保存证书
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
