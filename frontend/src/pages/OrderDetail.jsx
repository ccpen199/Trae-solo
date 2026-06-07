import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const STATUS_MAP = {
  pending: { text: '待接单', class: 'status-pending', step: 0 },
  accepted: { text: '已接单', class: 'status-accepted', step: 1 },
  picked: { text: '已取货', class: 'status-picked', step: 2 },
  delivered: { text: '已送达', class: 'status-delivered', step: 3 },
  completed: { text: '已完成', class: 'status-completed', step: 4 },
  cancelled: { text: '已取消', class: 'status-pending', step: -1 }
};

const STEPS = [
  { key: 'pending', title: '发布订单', desc: '等待司机接单' },
  { key: 'accepted', title: '司机接单', desc: '司机已接单，前往取货' },
  { key: 'picked', title: '已取货', desc: '货物已提取，运输中' },
  { key: 'delivered', title: '已送达', desc: '货物已送达，等待确认' },
  { key: 'completed', title: '已完成', desc: '订单已完成，感谢使用' }
];

export default function OrderDetail() {
  const { id } = useParams();
  const { userType, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewData, setReviewData] = useState({ score: 5, content: '' });
  const [showReview, setShowReview] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintData, setComplaintData] = useState({ type: 'service', content: '' });
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [evidenceType, setEvidenceType] = useState('image');
  const [evidenceRemark, setEvidenceRemark] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setData(res.data);
    } catch (err) {
      alert('获取订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/${action}`);
      alert('操作成功！');
      fetchOrder();
    } catch (err) {
      alert('操作失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/review`, reviewData);
      alert('评价成功！');
      setShowReview(false);
      fetchOrder();
    } catch (err) {
      alert('评价失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplaint = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/complaint`, complaintData);
      alert('投诉已提交，我们会尽快处理！');
      setShowComplaint(false);
    } catch (err) {
      alert('提交失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', id);
    formData.append('type', evidenceType);
    formData.append('remark', evidenceRemark);

    setActionLoading(true);
    try {
      await api.post('/drivers/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('凭证上传成功！');
      setShowEvidenceUpload(false);
      fetchOrder();
    } catch (err) {
      alert('上传失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSign = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/sign`, { sign_type: 'driver' });
      alert('电子签署成功！');
      setShowSignModal(false);
      fetchOrder();
    } catch (err) {
      alert('签署失败');
    } finally {
      setActionLoading(false);
    }
  };

  const queryTracking = async () => {
    setTrackingLoading(true);
    try {
      const res = await api.get(`/tracking/query?order_no=${data.order.order_no}`);
      setTrackingData(res.data);
    } catch (err) {
      alert('查询轨迹失败');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleInsuranceClaim = () => {
    if (confirm('确认发起保险赔付申请？请准备好相关证据材料。')) {
      alert('赔付申请已提交，请等待客服联系。');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        订单不存在
      </div>
    );
  }

  const { order, driver, shipper, evidences, insurance } = data;
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const currentStep = status.step;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      {/* Order Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2>订单详情</h2>
            <div style={{ color: '#666', fontSize: '14px' }}>订单号：{order.order_no}</div>
            <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
              创建时间：{new Date(order.created_at).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`status-badge ${status.class}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
              {status.text}
            </span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', marginTop: '8px' }}>
              ¥{order.price}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div style={{ marginBottom: '24px', padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '20px' }}>📋 订单进度</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {STEPS.map((step, i) => (
              <div key={step.key} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: i <= currentStep ? '#52c41a' : '#d9d9d9',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '13px', fontWeight: i <= currentStep ? 600 : 400, color: i <= currentStep ? '#333' : '#999' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {step.desc}
                </div>
              </div>
            ))}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '8%',
              right: '8%',
              height: '2px',
              background: '#d9d9d9',
              zIndex: 0
            }}>
              <div style={{
                height: '100%',
                background: '#52c41a',
                width: `${Math.max(0, currentStep) * 25}%`,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div style={{ 
          display: 'flex', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f7ff 100%)', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '16px' }}>📍 {order.start_address}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>出发地</div>
          </div>
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', color: '#1677ff' }}>
            <span>→</span>
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>{order.distance}km</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '16px' }}>🏁 {order.end_address}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>目的地</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '12px' }}>📦 货物信息</h4>
            <div className="card" style={{ background: '#fafafa' }}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>货物类型</span>
                  <span>{order.cargo_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>重量</span>
                  <span>{order.cargo_weight} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>体积</span>
                  <span>{order.cargo_volume} m³</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>车型</span>
                  <span>{order.vehicle_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>搬运需求</span>
                  <span>{order.loading_requirement === 'need_help' ? '需要协助' : order.loading_requirement === 'heavy' ? '重物搬运' : '无需搬运'}</span>
                </div>
                {order.cargo_desc && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>货物描述</span>
                    <span>{order.cargo_desc}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '12px' }}>💰 费用明细</h4>
            <div className="card" style={{ background: '#fff7e6' }}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>基础费用</span>
                  <span>¥{order.price_detail?.base || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>里程费用 ({order.distance}km)</span>
                  <span>¥{order.price_detail?.distance || 0}</span>
                </div>
                {order.price_detail?.loading_surcharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>搬运服务费</span>
                    <span>¥{order.price_detail.loading_surcharge}</span>
                  </div>
                )}
                {order.price_detail?.weight_surcharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>超重附加费</span>
                    <span>¥{order.price_detail.weight_surcharge}</span>
                  </div>
                )}
                {order.price_detail?.time_multiplier > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>时段溢价 (x{order.price_detail.time_multiplier})</span>
                    <span style={{ color: '#fa8c16' }}>+¥{Math.round(order.price * (1 - 1/order.price_detail.time_multiplier))}</span>
                  </div>
                )}
                {insurance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>货运险 (保额¥{insurance.insured_value})</span>
                    <span>¥{insurance.premium}</span>
                  </div>
                )}
              </div>
              <div style={{ 
                borderTop: '2px dashed #fa8c16', 
                paddingTop: '12px',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>订单总价</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  ¥{order.price}
                </span>
              </div>
              {order.remark && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                  备注：{order.remark}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        {insurance && (
          <div className="card" style={{ marginBottom: '24px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ marginBottom: '8px', color: '#389e0d' }}>🛡️ 货运保障</h4>
                <div style={{ fontSize: '14px' }}>
                  <span style={{ marginRight: '20px' }}>保单号：{insurance.policy_no}</span>
                  <span style={{ marginRight: '20px' }}>保额：¥{insurance.insured_value}</span>
                  <span>保费：¥{insurance.premium}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  投保时间：{new Date(insurance.created_at).toLocaleString()}
                </div>
              </div>
              {(order.status === 'delivered' || order.status === 'completed') && (
                <button 
                  className="btn btn-outline" 
                  style={{ color: '#cf1322', borderColor: '#ffa39e' }}
                  onClick={handleInsuranceClaim}
                >
                  申请赔付
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tracking Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>📍 物流轨迹</h4>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 16px', fontSize: '13px' }}
              onClick={queryTracking}
              disabled={trackingLoading}
            >
              {trackingLoading ? '查询中...' : '刷新轨迹'}
            </button>
          </div>
          
          {trackingData ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {trackingData.traces?.length > 0 ? (
                trackingData.traces.map((trace, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    padding: '12px 0', 
                    borderBottom: i < trackingData.traces.length - 1 ? '1px solid #f0f0f0' : 'none',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '16px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: i === 0 ? '#52c41a' : '#d9d9d9'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: i === 0 ? '#333' : '#666' }}>{trace.desc}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{trace.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无轨迹信息
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              点击"刷新轨迹"查看最新物流信息
            </div>
          )}
        </div>

        {/* Shipper Info */}
        {shipper && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>👤 货主信息</h4>
            <div className="card" style={{ background: '#fafafa' }}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div>姓名：{shipper.name || '未填写'}</div>
                <div>电话：{shipper.phone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Info */}
        {driver && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>🚚 司机信息</h4>
            <div className="card" style={{ background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fa8c16, #d46b08)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {driver.name?.[0] || '司'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '15px' }}>{driver.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {driver.vehicle_type} · {driver.vehicle_number} · ⭐ {driver.service_score}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`tel:${driver.phone}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    📞 联系司机
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evidences */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0 }}>📷 运输凭证</h4>
            {userType === 'driver' && order.status !== 'completed' && order.status !== 'cancelled' && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 16px', fontSize: '13px' }}
                onClick={() => setShowEvidenceUpload(true)}
              >
                + 上传凭证
              </button>
            )}
          </div>
          {evidences && evidences.length > 0 ? (
            <div className="grid grid-4">
              {evidences.map(ev => (
                <div key={ev.id} className="card" style={{ padding: '10px' }}>
                  {ev.type === 'image' ? (
                    <img 
                      src={ev.file_url} 
                      alt="凭证" 
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100px', 
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      fontSize: '32px'
                    }}>
                      🎬
                    </div>
                  )}
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                    {ev.type === 'image' ? '照片' : '视频'} · {new Date(ev.created_at).toLocaleString()}
                  </div>
                  {ev.remark && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{ev.remark}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#999', background: '#fafafa' }}>
              暂无运输凭证
            </div>
          )}
        </div>

        {/* Electronic Sign */}
        {(order.status === 'accepted' || order.status === 'picked') && (
          <div className="card" style={{ marginBottom: '24px', background: '#e6fffb', border: '1px solid #87e8de' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ marginBottom: '4px', color: '#08979c' }}>✍️ 电子运单</h4>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                  {order.signed_at ? `已签署 · ${new Date(order.signed_at).toLocaleString()}` : '请在取货后完成电子签署'}
                </p>
              </div>
              {userType === 'driver' && !order.signed_at && (
                <button 
                  className="btn btn-primary" 
                  style={{ background: '#13c2c2' }}
                  onClick={() => setShowSignModal(true)}
                >
                  电子签署
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {userType === 'driver' && order.status === 'pending' && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleAction('accept')}
              disabled={actionLoading}
            >
              🎯 立即接单
            </button>
          )}
          {userType === 'driver' && order.status === 'accepted' && (
            <>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowSignModal(true)}
                disabled={actionLoading}
              >
                ✍️ 电子签署
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('pickup')}
                disabled={actionLoading}
              >
                📦 确认取货
              </button>
            </>
          )}
          {userType === 'driver' && order.status === 'picked' && (
            <>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowEvidenceUpload(true)}
              >
                📷 上传凭证
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('deliver')}
                disabled={actionLoading}
              >
                🚚 确认送达
              </button>
            </>
          )}
          {userType === 'shipper' && order.status === 'delivered' && (
            <>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowReview(true)}
              >
                ⭐ 评价司机
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('complete')}
                disabled={actionLoading}
              >
                ✅ 确认完成
              </button>
            </>
          )}
          {(order.status === 'completed' || order.status === 'delivered') && (
            <button 
              className="btn btn-outline" 
              style={{ color: '#cf1322', borderColor: '#ffa39e' }}
              onClick={() => setShowComplaint(true)}
            >
              ⚠️ 投诉/纠纷
            </button>
          )}
          {userType === 'driver' && order.status === 'pending' && (
            <Link to="/orders" className="btn btn-outline">
              📋 返回订单大厅
            </Link>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowReview(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>⭐ 评价司机服务</h3>
              <button onClick={() => setShowReview(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <div className="form-group">
              <label>服务评分</label>
              <select 
                value={reviewData.score} 
                onChange={e => setReviewData({ ...reviewData, score: parseInt(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map(s => (
                  <option key={s} value={s}>{'⭐'.repeat(s)} {s}星 - {s === 5 ? '非常满意' : s === 4 ? '满意' : s === 3 ? '一般' : s === 2 ? '不满意' : '非常不满意'}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>评价内容</label>
              <textarea
                value={reviewData.content}
                onChange={e => setReviewData({ ...reviewData, content: e.target.value })}
                placeholder="请描述您的服务体验（选填）"
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowReview(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReview} disabled={actionLoading}>
                {actionLoading ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaint && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowComplaint(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>⚠️ 提交投诉</h3>
              <button onClick={() => setShowComplaint(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <div className="form-group">
              <label>投诉类型</label>
              <select 
                value={complaintData.type} 
                onChange={e => setComplaintData({ ...complaintData, type: e.target.value })}
              >
                <option value="service">服务态度</option>
                <option value="delay">运输延误</option>
                <option value="damage">货物破损</option>
                <option value="overprice">价格争议</option>
                <option value="other">其他问题</option>
              </select>
            </div>
            <div className="form-group">
              <label>问题描述</label>
              <textarea
                value={complaintData.content}
                onChange={e => setComplaintData({ ...complaintData, content: e.target.value })}
                placeholder="请详细描述您遇到的问题，我们会尽快处理"
                rows={4}
                required
              />
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              投诉提交后，我们会在24小时内与您联系处理
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowComplaint(false)}>取消</button>
              <button className="btn btn-primary" style={{ background: '#cf1322' }} onClick={handleComplaint} disabled={actionLoading || !complaintData.content}>
                {actionLoading ? '提交中...' : '提交投诉'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Upload Modal */}
      {showEvidenceUpload && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowEvidenceUpload(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📷 上传运输凭证</h3>
              <button onClick={() => setShowEvidenceUpload(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <div className="form-group">
              <label>凭证类型</label>
              <select value={evidenceType} onChange={e => setEvidenceType(e.target.value)}>
                <option value="image">照片</option>
                <option value="video">视频</option>
              </select>
            </div>
            <div className="form-group">
              <label>选择文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={evidenceType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleEvidenceUpload}
                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group">
              <label>备注说明（选填）</label>
              <textarea
                value={evidenceRemark}
                onChange={e => setEvidenceRemark(e.target.value)}
                placeholder="例如：货物完好、已送达等"
                rows={3}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              支持 JPG、PNG、MP4 格式，单文件不超过 50MB
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowEvidenceUpload(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowSignModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>✍️ 电子运单签署</h3>
              <button onClick={() => setShowSignModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            
            <div className="card" style={{ background: '#fafafa', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px' }}>运单信息确认</h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div>订单号：{order.order_no}</div>
                <div>出发地：{order.start_address}</div>
                <div>目的地：{order.end_address}</div>
                <div>货物：{order.cargo_type} {order.cargo_weight}kg</div>
                <div>车型：{order.vehicle_type}</div>
                <div style={{ fontWeight: 'bold', marginTop: '8px' }}>运费：¥{order.price}</div>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 8px' }}>📋 签署须知：</p>
              <p style={{ margin: '0 0 4px' }}>1. 本人确认已核对上述运单信息无误</p>
              <p style={{ margin: '0 0 4px' }}>2. 确认货物已完整接收，包装完好</p>
              <p style={{ margin: '0 0 4px' }}>3. 同意平台《电子运单使用协议》</p>
              <p style={{ margin: '0' }}>4. 签署后运单即时生效，具有法律效力</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowSignModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSign} disabled={actionLoading}>
                {actionLoading ? '签署中...' : '✍️ 确认签署'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
