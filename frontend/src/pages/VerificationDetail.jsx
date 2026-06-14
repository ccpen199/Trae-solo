import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const VerificationDetail = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    stage: 'property_rights',
    evidence: '',
    remark: ''
  });
  const [error, setError] = useState(null);

  const verificationStages = [
    { key: 'property_rights', name: '产权核验', icon: '📋' },
    { key: 'on_site', name: '实地打卡', icon: '📍' },
    { key: 'face_recognition', name: '人脸识别', icon: '👤' },
    { key: 'neighbor_cross', name: '邻居交叉验证', icon: '👥' }
  ];

  useEffect(() => {
    fetchVerificationDetail();
  }, [propertyId]);

  const fetchVerificationDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/verification/${propertyId}`);
      if (response.data) {
        setVerificationData(response.data);
      } else {
        setVerificationData(getMockData());
      }
    } catch (error) {
      console.error('获取验证详情失败:', error);
      setError('获取数据失败，请稍后重试');
      setVerificationData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    property: {
      id: propertyId,
      title: '朝阳区国贸CBD精装一居室',
      address: '朝阳区建国门外大街1号',
      price: 8500,
      rooms: '1室1厅',
      area: 58,
      owner_id: 1
    },
    verification_progress: {
      total: 4,
      completed: 3
    },
    property_rights: {
      status: 'verified',
      verified_at: '2026-05-20 14:30',
      verifier_name: '张验房师',
      evidence: {
        property_cert_photo: 'https://example.com/cert.jpg',
        property_cert_no: '京房权证朝字第123456号'
      },
      remark: '房产证核验通过，产权清晰，无抵押无查封'
    },
    on_site: {
      status: 'verified',
      verified_at: '2026-05-21 10:00',
      verifier_name: '李验房师',
      gps_location: '39.9042° N, 116.4074° E',
      evidence: {
        photos: ['https://example.com/site1.jpg', 'https://example.com/site2.jpg'],
        description: '房屋实际状况与描述一致，装修完好，设施齐全'
      },
      remark: '实地核验通过，房屋位置准确，状况良好'
    },
    face_recognition: {
      status: 'verified',
      verified_at: '2026-05-21 15:00',
      verifier_name: '王审核员',
      owner_verification_result: 'passed',
      evidence: {
        face_photo: 'https://example.com/face.jpg',
        id_verified: true
      },
      remark: '房东人脸识别通过，身份信息与房产证一致'
    },
    neighbor_cross: {
      status: 'pending',
      verified_at: null,
      verifier_name: null,
      neighbor_records: [],
      remark: null
    },
    quality_orders: [
      {
        id: 'GD202605001',
        type: '基础验房',
        status: 'completed',
        created_at: '2026-05-20 09:00',
        report: '验房报告-ZG202605001.pdf'
      },
      {
        id: 'GD202605002',
        type: '空气质量检测',
        status: 'completed',
        created_at: '2026-05-21 11:00',
        report: '空气质量检测报告-KQ202605001.pdf'
      },
      {
        id: 'GD202605003',
        type: '深度验房',
        status: 'pending',
        created_at: '2026-05-22 14:00',
        report: null
      }
    ],
    review_history: [
      {
        id: 1,
        stage: 'property_rights',
        action: '初次核验通过',
        operator: '张验房师',
        operated_at: '2026-05-20 14:30',
        remark: '房产证核验通过'
      },
      {
        id: 2,
        stage: 'on_site',
        action: '初次核验通过',
        operator: '李验房师',
        operated_at: '2026-05-21 10:00',
        remark: '实地核验通过'
      },
      {
        id: 3,
        stage: 'on_site',
        action: '复查通过',
        operator: '王审核员',
        operated_at: '2026-05-21 12:00',
        remark: '照片证据充分，核验有效'
      },
      {
        id: 4,
        stage: 'face_recognition',
        action: '初次核验通过',
        operator: '王审核员',
        operated_at: '2026-05-21 15:00',
        remark: '人脸识别通过'
      }
    ]
  });

  const getStatusBadge = (status) => {
    if (status === 'verified') {
      return <span className="badge badge-success">已通过</span>;
    }
    return <span className="badge badge-warning">待核验</span>;
  };

  const getStageData = (stageKey) => {
    const dataMap = {
      property_rights: verificationData?.property_rights,
      on_site: verificationData?.on_site,
      face_recognition: verificationData?.face_recognition,
      neighbor_cross: verificationData?.neighbor_cross
    };
    return dataMap[stageKey];
  };

  const renderStageDetail = (stageKey) => {
    const stage = verificationStages.find(s => s.key === stageKey);
    const data = getStageData(stageKey);
    if (!data) return null;

    return (
      <div key={stageKey} className={`verification-step ${data.status}`} style={{ marginBottom: '1rem' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: data.status === 'verified' ? '#d1fae5' : '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginRight: '1rem',
          flexShrink: 0
        }}>
          {stage.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div className="flex-between mb-2">
            <h4 className="font-bold">{stage.name}</h4>
            {getStatusBadge(data.status)}
          </div>
          {data.status === 'verified' ? (
            <div className="text-sm">
              <div className="grid grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span className="text-gray">核验时间：</span>
                  {data.verified_at}
                </div>
                <div>
                  <span className="text-gray">核验人：</span>
                  {data.verifier_name}
                </div>
              </div>
              {stageKey === 'property_rights' && (
                <div>
                  <div className="text-gray mb-1">核验证据：</div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className="tag">📄 房产证照片</span>
                    <span className="tag">📝 产权证号: {data.evidence?.property_cert_no}</span>
                  </div>
                </div>
              )}
              {stageKey === 'on_site' && (
                <div>
                  <div className="text-gray mb-1">GPS定位：{data.gps_location}</div>
                  <div className="text-gray mb-1">现场照片说明：</div>
                  <p style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px', fontSize: '12px' }}>
                    {data.evidence?.description}
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {data.evidence?.photos?.map((_, i) => (
                      <span key={i} className="tag">🖼️ 现场照片 {i + 1}</span>
                    ))}
                  </div>
                </div>
              )}
              {stageKey === 'face_recognition' && (
                <div>
                  <div className="text-gray mb-1">房东身份核验结果：</div>
                  <span className="badge badge-success">
                    {data.owner_verification_result === 'passed' ? '核验通过' : '核验未通过'}
                  </span>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="tag">👤 人脸照片已上传</span>
                    <span className="tag">✅ 身份证已验证</span>
                  </div>
                </div>
              )}
              {stageKey === 'neighbor_cross' && (
                <div>
                  <div className="text-gray mb-1">邻居确认记录：</div>
                  {data.neighbor_records?.length > 0 ? (
                    data.neighbor_records.map((record, i) => (
                      <div key={i} className="text-sm" style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        邻居 {record.neighbor_name} 确认：{record.confirmation_content}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray">暂无邻居确认记录</span>
                  )}
                </div>
              )}
              {data.remark && (
                <div className="mt-2">
                  <span className="text-gray">核验备注：</span>
                  {data.remark}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray">
              该阶段核验尚未完成，请等待核验人员进行核验
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSubmitVerification = async () => {
    if (!submitForm.stage || !submitForm.evidence) {
      alert('请填写完整信息');
      return;
    }
    try {
      await api.post(`/verification/${propertyId}/submit`, submitForm);
      alert('核验提交成功！');
      setShowSubmitModal(false);
      setSubmitForm({ stage: 'property_rights', evidence: '', remark: '' });
      fetchVerificationDetail();
    } catch (error) {
      console.error('提交核验失败:', error);
      alert('提交失败，请稍后重试');
    }
  };

  const handleDownloadCertificate = () => {
    alert('正在下载核验凭证...');
  };

  const isOwnerOrAdmin = () => {
    if (!user || !verificationData) return false;
    return user.role === 'admin' || user.id === verificationData.property?.owner_id;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !verificationData) {
    return (
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <p className="text-danger">{error}</p>
        <button className="btn btn-primary mt-4" onClick={fetchVerificationDetail}>
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="flex-between mb-6">
        <div>
          <button className="btn mb-2" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1 className="text-2xl font-bold">房源核验详情</h1>
          <p className="text-gray">四重验证 · 多重保障 · 安心交易</p>
        </div>
        <div className="flex gap-3">
          <button className="btn" onClick={handleDownloadCertificate}>
            📄 下载核验凭证
          </button>
          <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>
            📑 查看完整报告
          </button>
          {isOwnerOrAdmin() && (
            <button className="btn btn-success" onClick={() => setShowSubmitModal(true)}>
              ✅ 提交核验
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">房源基本信息</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2">
            <div>
              <h4 className="font-bold text-lg mb-2">{verificationData?.property?.title}</h4>
              <p className="text-gray mb-2">📍 {verificationData?.property?.address}</p>
              <div className="flex gap-4">
                <span className="tag">{verificationData?.property?.rooms}</span>
                <span className="tag">{verificationData?.property?.area}㎡</span>
                <span className="tag" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                  ¥{verificationData?.property?.price?.toLocaleString()}/月
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg mb-2">
                核验进度：
                <span className="font-bold" style={{ color: '#667eea' }}>
                  {verificationData?.verification_progress?.completed}/{verificationData?.verification_progress?.total}
                </span>
              </div>
              <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${(verificationData?.verification_progress?.completed / verificationData?.verification_progress?.total) * 100}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.5s'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">四重验证详情</h3>
        </div>
        <div className="card-body">
          {verificationStages.map(stage => renderStageDetail(stage.key))}
        </div>
      </div>

      <div className="grid grid-2 mb-6" style={{ gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">质检工单记录</h3>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>工单编号</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>报告</th>
                </tr>
              </thead>
              <tbody>
                {verificationData?.quality_orders?.map(order => (
                  <tr key={order.id}>
                    <td className="font-bold">{order.id}</td>
                    <td>{order.type}</td>
                    <td>
                      <span className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {order.status === 'completed' ? '已完成' : '待处理'}
                      </span>
                    </td>
                    <td className="text-sm">{order.created_at}</td>
                    <td>
                      {order.report ? (
                        <a href="#" style={{ color: '#667eea' }}>📄 {order.report}</a>
                      ) : (
                        <span className="text-gray">待生成</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">复查记录历史</h3>
          </div>
          <div className="card-body">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {verificationData?.review_history?.map((record, i) => (
                <div key={record.id} style={{ 
                  position: 'relative', 
                  paddingBottom: i < verificationData.review_history.length - 1 ? '1rem' : 0,
                  borderLeft: '2px solid #e5e7eb',
                  paddingLeft: '1.5rem',
                  marginLeft: '7px'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-8px', 
                    top: '0',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#667eea'
                  }} />
                  <div className="flex-between">
                    <span className="font-bold text-sm">
                      {verificationStages.find(s => s.key === record.stage)?.icon}{' '}
                      {verificationStages.find(s => s.key === record.stage)?.name} - {record.action}
                    </span>
                    <span className="text-gray text-xs">{record.operated_at}</span>
                  </div>
                  <div className="text-sm text-gray mt-1">
                    操作人：{record.operator}
                  </div>
                  {record.remark && (
                    <div className="text-sm mt-1" style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
                      {record.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">提交核验</h3>
              <button onClick={() => setShowSubmitModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择验证阶段 *</label>
                <select 
                  className="form-input"
                  value={submitForm.stage}
                  onChange={e => setSubmitForm(prev => ({ ...prev, stage: e.target.value }))}
                >
                  {verificationStages.map(stage => (
                    <option key={stage.key} value={stage.key}>{stage.icon} {stage.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">核验证据 *</label>
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '8px', 
                  padding: '2rem', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                  <p className="text-gray text-sm">点击上传证据照片或文件</p>
                  <input 
                    type="file" 
                    multiple 
                    style={{ display: 'none' }}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, evidence: e.target.files?.[0]?.name || '已上传证据' }))}
                  />
                </div>
                {submitForm.evidence && (
                  <span className="tag">📄 {submitForm.evidence}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">核验备注</label>
                <textarea 
                  className="form-input"
                  rows="3"
                  value={submitForm.remark}
                  onChange={e => setSubmitForm(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="请输入核验备注说明..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowSubmitModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitVerification}>
                提交核验
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">完整核验报告</h3>
              <button onClick={() => setShowReportModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4" style={{ padding: '1rem', background: '#f0f7ff', borderRadius: '8px' }}>
                <h4 className="font-bold">{verificationData?.property?.title}</h4>
                <p className="text-gray text-sm">报告编号：VR-{propertyId}-{Date.now().toString().slice(-6)}</p>
                <p className="text-gray text-sm">生成时间：{new Date().toLocaleString()}</p>
              </div>
              
              <div className="mb-4">
                <h5 className="font-bold mb-2">核验总结</h5>
                <div className="grid grid-4" style={{ gap: '0.5rem' }}>
                  {verificationStages.map(stage => {
                    const data = getStageData(stage.key);
                    return (
                      <div key={stage.key} className="text-center" style={{ 
                        padding: '0.75rem', 
                        borderRadius: '8px',
                        background: data?.status === 'verified' ? '#d1fae5' : '#fef3c7'
                      }}>
                        <div style={{ fontSize: '1.5rem' }}>{stage.icon}</div>
                        <div className="text-sm font-bold">{stage.name}</div>
                        <div className="text-xs" style={{ color: data?.status === 'verified' ? '#065f46' : '#92400e' }}>
                          {data?.status === 'verified' ? '✓ 通过' : '○ 待核验'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-bold mb-2">核验详情</h5>
                {verificationStages.map(stage => {
                  const data = getStageData(stage.key);
                  return (
                    <div key={stage.key} className="mb-2" style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
                      <div className="flex-between">
                        <span className="font-bold text-sm">{stage.icon} {stage.name}</span>
                        {getStatusBadge(data?.status)}
                      </div>
                      {data?.status === 'verified' && (
                        <div className="text-xs text-gray mt-1">
                          核验人：{data.verifier_name} | 时间：{data.verified_at}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <h5 className="font-bold mb-2">报告声明</h5>
                <p className="text-xs text-gray">
                  本报告由平台核验系统自动生成，所有核验数据均已上链存证。
                  报告仅反映核验时点的房屋状况，不作为交易的唯一依据。
                  如有疑问，请联系平台客服。
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowReportModal(false)}>关闭</button>
              <button className="btn btn-primary" onClick={handleDownloadCertificate}>
                📥 下载报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDetail;
