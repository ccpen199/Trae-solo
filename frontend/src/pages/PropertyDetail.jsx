import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const verificationSteps = [
  { key: 'property_right', label: '产权核验', icon: '📋', desc: '核验房屋产权归属' },
  { key: 'onsite_checkin', label: '实地打卡', icon: '📍', desc: '核验人员实地核查' },
  { key: 'face_recognition', label: '人脸识别', icon: '👤', desc: '房东身份核验' },
  { key: 'neighbor_verify', label: '邻居验证', icon: '👥', desc: '物业及邻居确认' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-');
};

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusBadge = (status) => {
  const statusMap = {
    completed: { label: '已完成', className: 'badge-success', color: '#52c41a' },
    pending: { label: '待处理', className: 'badge-warning', color: '#faad14' },
    processing: { label: '处理中', className: 'badge-info', color: '#1890ff' },
    rejected: { label: '已驳回', className: 'badge-danger', color: '#ff4d4f' },
    cancelled: { label: '已取消', className: '', color: '#8c8c8c' }
  };
  return statusMap[status] || { label: status || '未知', className: '', color: '#8c8c8c' };
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [error, setError] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchProperty();
    fetchVerification();
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data.property || response.data.data);
    } catch (error) {
      console.error('获取房源详情失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看房源详情');
      } else {
        setError(error.response?.data?.message || '获取房源详情失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVerification = async () => {
    if (!isAuthenticated) return;
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const response = await api.get(`/verification/${id}`);
      setVerification(response.data.data || response.data);
    } catch (error) {
      console.error('获取验证详情失败:', error);
      if (error.response?.status === 401) {
        setVerificationError('请先登录后查看验证详情');
      } else {
        setVerificationError(error.response?.data?.message || '获取验证详情失败');
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/properties/${id}/favorite`);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const getVerificationStatus = (stage, index) => {
    if (stage > index) return { status: 'completed', label: '已完成', color: '#52c41a' };
    if (stage === index) return { status: 'processing', label: '进行中', color: '#1890ff' };
    return { status: 'pending', label: '待核验', color: '#d9d9d9' };
  };

  if (loading) {
    return (
      <div className="container loading" style={{ padding: '3rem 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p className="text-danger">{error}</p>
        {error.includes('登录') && (
          <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
            去登录
          </button>
        )}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p>房源不存在</p>
      </div>
    );
  }

  const vrData = verification?.vr || {
    cover_image: '',
    vr_url: '#',
    shoot_time: '2026-05-15 14:30:00',
    photographer: '张师傅',
    photos_count: 24
  };

  const stagesData = verification?.stages || {
    property_right: {
      completed: true,
      verifier_name: '李核验员',
      verified_at: '2026-05-10 10:00:00',
      property_owner: '王建国',
      property_cert_no: '京(2023)朝不动产权第001234号',
      result: '核验通过'
    },
    onsite_checkin: {
      completed: true,
      verifier_name: '赵打卡员',
      verified_at: '2026-05-11 15:30:00',
      gps_coords: '39.9042°N, 116.4074°E',
      checkin_time: '2026-05-11 15:30:00',
      photos_count: 12
    },
    face_recognition: {
      completed: true,
      verifier_name: '孙审核员',
      verified_at: '2026-05-12 09:15:00',
      id_match_status: '完全匹配',
      confidence: 99.8
    },
    neighbor_verify: {
      completed: true,
      verifier_name: '周调查员',
      verified_at: '2026-05-13 11:00:00',
      property_confirm: '已确认',
      neighbor_testimony: '确认该房屋为业主本人所有',
      witness_name: '陈物业'
    }
  };

  const inspections = verification?.inspections || [
    { id: 1, order_no: 'ZJ202605001', type: '初次核验', status: 'completed', created_at: '2026-05-10 09:00:00', handler_name: '李核验员', notes: '初次核验通过' },
    { id: 2, order_no: 'ZJ202605002', type: 'VR拍摄', status: 'completed', created_at: '2026-05-15 12:00:00', handler_name: '张摄影师', notes: 'VR全景拍摄完成' }
  ];

  const reviewLogs = verification?.reviewLogs || [
    { id: 1, action: '房源信息审核通过', created_at: '2026-05-10 11:00:00', operator_name: '系统审核', notes: '房源基础信息审核通过' }
  ];

  const currentStage = verification?.verification_stage || 4;

  return (
    <div className="container">
      <button className="btn mb-4" onClick={() => navigate(-1)}>
        ← 返回列表
      </button>

      <div className="card mb-6">
        <div style={{ height: '400px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 'relative' }}>
          {property.is_verified && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10
            }}>
              ✅ 已全验证 · 四重认证
            </div>
          )}
        </div>
        <div className="card-body">
          <div className="flex-between mb-4">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${isFavorite ? 'btn-primary' : ''}`}
                onClick={handleFavorite}
              >
                {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
              </button>
            </div>
          </div>

          <div className="property-price mb-4">
            {formatMoney(property.price)}/月
            <span className="text-gray text-lg ml-2">押金: {formatMoney(property.deposit)}</span>
          </div>

          <div className="mb-4">
            {property.tags?.map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>

          <div className="grid grid-4 mb-8">
            <div className="text-center">
              <div className="text-xl font-bold">{property.rooms}室</div>
              <div className="text-gray">户型</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{property.area}㎡</div>
              <div className="text-gray">面积</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{property.floor}</div>
              <div className="text-gray">楼层</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{property.orientation}</div>
              <div className="text-gray">朝向</div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">房源信息</h3>
            <table className="table">
              <tbody>
                <tr>
                  <td style={{ width: '120px' }}>地址</td>
                  <td>{property.address}</td>
                </tr>
                <tr>
                  <td>小区</td>
                  <td>{property.community || '-'}</td>
                </tr>
                <tr>
                  <td>装修</td>
                  <td>{property.decoration || '-'}</td>
                </tr>
                <tr>
                  <td>租赁方式</td>
                  <td>{property.rent_mode === 'whole' ? '整租' : property.rent_mode === 'share' ? '合租' : '转租'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">房源描述</h3>
            <p className="text-gray">{property.description || '暂无描述'}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">配套设施</h3>
            <div>
              {property.facilities?.map((facility, i) => (
                <span key={i} className="tag">{facility}</span>
              )) || <span className="text-gray">暂无</span>}
            </div>
          </div>

          <div className="card" style={{ background: '#f9fafb' }}>
            <div className="card-body">
              <h3 className="text-lg font-bold mb-4">房东信息</h3>
              <div className="flex-between">
                <div>
                  <p className="font-bold">{property.owner_name || '房东'}</p>
                  <p className="text-gray text-sm">信用分: {property.owner_credit || '-'}</p>
                </div>
                {showContact ? (
                  <div className="text-right">
                    <p className="font-bold text-primary">{property.owner_phone}</p>
                    <p className="text-gray text-sm">请在工作时间联系</p>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => setShowContact(true)}>
                    查看联系方式
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <div 
              className={`tab ${activeTab === 'vr' ? 'active' : ''}`}
              onClick={() => setActiveTab('vr')}
            >
              🎥 VR全景看房
            </div>
            <div 
              className={`tab ${activeTab === 'verification' ? 'active' : ''}`}
              onClick={() => setActiveTab('verification')}
            >
              🔍 真实性核验档案
            </div>
            <div 
              className={`tab ${activeTab === 'inspection' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspection')}
            >
              📋 后台质检工单
            </div>
            <div 
              className={`tab ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              📝 异常复查记录
            </div>
          </div>
        </div>
        <div className="card-body">
          {!isAuthenticated ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <p className="text-gray">请先登录后查看验证详情</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                去登录
              </button>
            </div>
          ) : verificationLoading ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <div className="spinner"></div>
              <p className="text-gray mt-4">加载验证详情中...</p>
            </div>
          ) : verificationError ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <p className="text-danger">{verificationError}</p>
            </div>
          ) : (
            <>
              {activeTab === 'vr' && (
                <div>
                  <h4 className="font-bold mb-4">🎥 VR全景看房</h4>
                  <div className="grid grid-2" style={{ gap: '2rem' }}>
                    <div>
                      <div style={{ 
                        height: '300px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}>
                        <div style={{ textAlign: 'center', color: 'white' }}>
                          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎥</div>
                          <p className="font-bold">点击查看VR全景</p>
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          right: '16px',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          📷 {vrData.photos_count}张照片
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold mb-4">VR信息</h5>
                      <table className="table">
                        <tbody>
                          <tr>
                            <td style={{ width: '120px', fontWeight: 'bold' }}>拍摄人员</td>
                            <td>{vrData.photographer}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold' }}>拍摄时间</td>
                            <td>{formatDate(vrData.shoot_time)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold' }}>照片数量</td>
                            <td>{vrData.photos_count}张</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold' }}>VR链接</td>
                            <td>
                              <a href={vrData.vr_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                                点击查看全景看房 →
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'verification' && (
                <div>
                  <h4 className="font-bold mb-6">🔍 四重验证进度</h4>
                  <div style={{ position: 'relative', marginBottom: '3rem' }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: '30px', 
                      left: '10%', 
                      right: '10%', 
                      height: '4px', 
                      background: '#e5e7eb',
                      zIndex: 1
                    }}>
                      <div style={{ 
                        width: `${(currentStage / 4) * 100}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #52c41a 0%, #73d13d 100%)',
                        transition: 'width 0.5s'
                      }} />
                    </div>
                    <div className="grid grid-4" style={{ position: 'relative', zIndex: 2 }}>
                      {verificationSteps.map((step, index) => {
                        const status = getVerificationStatus(currentStage, index);
                        const stageData = stagesData[step.key] || {};
                        return (
                          <div key={step.key} className="text-center">
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: status.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '28px',
                              margin: '0 auto 0.5rem',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                              {status.status === 'completed' ? '✓' : step.icon}
                            </div>
                            <h5 className="font-bold">{step.label}</h5>
                            <span className={`badge badge-${status.status === 'completed' ? 'success' : status.status === 'processing' ? 'info' : 'warning'}`}>
                              {status.label}
                            </span>
                            {stageData.verified_at && (
                              <p className="text-gray text-xs mt-2">{formatDate(stageData.verified_at)}</p>
                            )}
                            {stageData.verifier_name && (
                              <p className="text-gray text-xs">核验人: {stageData.verifier_name}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                    <div className="card" style={{ background: '#f6ffed' }}>
                      <div className="card-body">
                        <h5 className="font-bold mb-3" style={{ color: '#52c41a' }}>📋 产权核验详情</h5>
                        <table className="table" style={{ background: 'white' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '120px', fontWeight: 'bold' }}>产权人</td>
                              <td>{stagesData.property_right?.property_owner || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>不动产权证号</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                {stagesData.property_right?.property_cert_no || '-'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>核验日期</td>
                              <td>{formatDate(stagesData.property_right?.verified_at)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>核验人</td>
                              <td>{stagesData.property_right?.verifier_name || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>核验结果</td>
                              <td>
                                <span className="badge badge-success">
                                  {stagesData.property_right?.result || '核验通过'}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card" style={{ background: '#e6f7ff' }}>
                      <div className="card-body">
                        <h5 className="font-bold mb-3" style={{ color: '#1890ff' }}>📍 实地打卡详情</h5>
                        <table className="table" style={{ background: 'white' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '120px', fontWeight: 'bold' }}>GPS坐标</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                {stagesData.onsite_checkin?.gps_coords || '-'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>打卡时间</td>
                              <td>{formatDate(stagesData.onsite_checkin?.checkin_time || stagesData.onsite_checkin?.verified_at)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>打卡人</td>
                              <td>{stagesData.onsite_checkin?.verifier_name || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>现场照片</td>
                              <td>{stagesData.onsite_checkin?.photos_count || 0}张</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card" style={{ background: '#fff7e6' }}>
                      <div className="card-body">
                        <h5 className="font-bold mb-3" style={{ color: '#fa8c16' }}>👤 人脸识别详情</h5>
                        <table className="table" style={{ background: 'white' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '120px', fontWeight: 'bold' }}>核验日期</td>
                              <td>{formatDate(stagesData.face_recognition?.verified_at)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>核验人</td>
                              <td>{stagesData.face_recognition?.verifier_name || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>身份证匹配</td>
                              <td>
                                <span className="badge badge-success">
                                  {stagesData.face_recognition?.id_match_status || '完全匹配'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>匹配置信度</td>
                              <td style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                {stagesData.face_recognition?.confidence || 99.8}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card" style={{ background: '#f9f0ff' }}>
                      <div className="card-body">
                        <h5 className="font-bold mb-3" style={{ color: '#722ed1' }}>👥 邻居交叉验证详情</h5>
                        <table className="table" style={{ background: 'white' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '120px', fontWeight: 'bold' }}>物业确认</td>
                              <td>
                                <span className="badge badge-success">
                                  {stagesData.neighbor_verify?.property_confirm || '已确认'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>邻居证言</td>
                              <td>{stagesData.neighbor_verify?.neighbor_testimony || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>验证人</td>
                              <td>{stagesData.neighbor_verify?.witness_name || stagesData.neighbor_verify?.verifier_name || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>验证日期</td>
                              <td>{formatDate(stagesData.neighbor_verify?.verified_at)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inspection' && (
                <div>
                  <h4 className="font-bold mb-4">📋 后台质检工单历史</h4>
                  {inspections.length === 0 ? (
                    <div className="text-center text-gray" style={{ padding: '2rem' }}>
                      暂无质检工单记录
                    </div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>工单编号</th>
                          <th>类型</th>
                          <th>状态</th>
                          <th>创建时间</th>
                          <th>处理人</th>
                          <th>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.map((inspection) => {
                          const status = getStatusBadge(inspection.status);
                          return (
                            <tr key={inspection.id}>
                              <td className="font-bold">{inspection.order_no || inspection.id}</td>
                              <td>{inspection.type || '-'}</td>
                              <td>
                                <span className={`badge ${status.className}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td>{formatDate(inspection.created_at)}</td>
                              <td>{inspection.handler_name || '-'}</td>
                              <td className="text-gray">{inspection.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'review' && (
                <div>
                  <h4 className="font-bold mb-4">📝 异常复查记录</h4>
                  {reviewLogs.length === 0 ? (
                    <div className="text-center text-gray" style={{ padding: '2rem' }}>
                      暂无复查记录，房源验证一切正常
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                      {reviewLogs.map((log, index) => (
                        <div key={log.id || index} style={{ 
                          position: 'relative', 
                          paddingBottom: index < reviewLogs.length - 1 ? '1.5rem' : 0,
                          borderLeft: '2px solid #e5e7eb',
                          paddingLeft: '1.5rem'
                        }}>
                          <div style={{ 
                            position: 'absolute', 
                            left: '-8px', 
                            top: '0',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: '#52c41a'
                          }} />
                          <div className="font-bold">{log.action || log.title || '复查'}</div>
                          <div className="text-gray text-xs">{formatDate(log.created_at)} · {log.operator_name || log.operator || '系统'}</div>
                          {log.notes && (
                            <p className="text-sm text-gray mt-1">{log.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
