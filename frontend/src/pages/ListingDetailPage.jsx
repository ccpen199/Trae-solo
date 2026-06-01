import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { useStore } from '../store';

const CATEGORY_LABELS = { job: '招聘', rent: '租房', house: '二手房', car: '二手车', service: '本地服务' };

function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ report_type: '虚假信息', reason: '', description: '' });
  const { user, showToast } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/listings/${id}`).then(res => {
      setListing(res.data.listing);
      setLoading(false);
    });
  }, [id]);

  const handleContact = async () => {
    if (!user) { showToast('请先登录', 'error'); navigate('/auth', { state: { from: { pathname: `/listing/${id}` } } }); return; }
    try {
      await api.post('/merchants/leads', { listing_id: id, contact_info: user.phone, message: '对您的信息感兴趣，请回复' });
      showToast('线索已发送，商家将尽快回复');
    } catch {
      showToast('已记录您的意向');
    }
  };

  const handleReport = async () => {
    if (!user) { showToast('请先登录', 'error'); return; }
    if (!reportForm.reason) { showToast('请填写举报原因', 'error'); return; }
    try {
      await api.post('/reports', { listing_id: id, ...reportForm });
      showToast('举报已提交，我们将尽快处理');
      setShowReport(false);
      setReportForm({ report_type: '虚假信息', reason: '', description: '' });
    } catch {
      showToast('举报提交失败', 'error');
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: 40, textAlign: 'center', color: '#999' }}>加载中...</div>;

  return (
    <div className="container detail-page">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ fontSize: 13 }}>← 返回</button>
        <span style={{ marginLeft: 12, fontSize: 13, color: '#999' }}>
          {CATEGORY_LABELS[listing.category_code] || listing.category_code}
          {listing.is_verified && <span style={{ color: '#52c41a', marginLeft: 8 }}>✓ 已认证</span>}
          {listing.is_urgent && <span style={{ color: '#fa8c16', marginLeft: 8 }}>⚡ 急售</span>}
        </span>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <h1 style={{ marginBottom: 20 }}>{listing.title}</h1>

          <div className="image-gallery">
            {listing.images?.map((img, i) => <img key={i} src={img} alt="" />)}
            {(!listing.images || listing.images.length === 0) && (
              <div style={{ gridColumn: 'span 4', height: 300, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 48 }}>
                {listing.category_code === 'job' ? '💼' : listing.category_code === 'rent' ? '🏠' : listing.category_code === 'house' ? '🏢' : listing.category_code === 'car' ? '🚗' : '🛠️'}
              </div>
            )}
          </div>

          <div className="detail-info">
            <div className="info-item"><span className="info-label">价格</span><span className="info-value">¥{listing.price_min?.toLocaleString() || '面议'}{listing.price_unit ? `/${listing.price_unit}` : ''}</span></div>
            <div className="info-item"><span className="info-label">位置</span><span className="info-value">{listing.location || listing.city || '未知'}</span></div>
            {listing.area && <div className="info-item"><span className="info-label">面积</span><span className="info-value">{listing.area}㎡</span></div>}
            {listing.rooms && <div className="info-item"><span className="info-label">户型</span><span className="info-value">{listing.rooms}室{listing.bathrooms}卫</span></div>}
            {listing.floor && <div className="info-item"><span className="info-label">楼层</span><span className="info-value">{listing.floor}</span></div>}
            {listing.car_brand && <div className="info-item"><span className="info-label">品牌</span><span className="info-value">{listing.car_brand} {listing.car_model}</span></div>}
            {listing.car_year && <div className="info-item"><span className="info-label">年份</span><span className="info-value">{listing.car_year}年</span></div>}
            {listing.car_mileage && <div className="info-item"><span className="info-label">里程</span><span className="info-value">{listing.car_mileage}万公里</span></div>}
            {listing.job_title && <div className="info-item"><span className="info-label">职位</span><span className="info-value">{listing.job_title}</span></div>}
            {listing.job_salary_min && <div className="info-item"><span className="info-label">薪资</span><span className="info-value">{listing.job_salary_min?.toLocaleString()}-{listing.job_salary_max?.toLocaleString()}元</span></div>}
            {listing.service_type && <div className="info-item"><span className="info-label">服务类型</span><span className="info-value">{listing.service_type}</span></div>}
            {listing.district && <div className="info-item"><span className="info-label">区县</span><span className="info-value">{listing.city} {listing.district}</span></div>}
            <div className="info-item"><span className="info-label">发布时间</span><span className="info-value">{new Date(listing.created_at).toLocaleString()}</span></div>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 12 }}>详情描述</h3>
            <p style={{ lineHeight: 1.8, color: '#666' }}>{listing.description || '暂无描述'}</p>
          </div>

          {listing.custom_fields?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>其他信息</h3>
              {listing.custom_fields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#999', minWidth: 80 }}>{f.field_key}</span>
                  <span>{f.field_value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-price">¥{listing.price_min?.toLocaleString() || '面议'}{listing.price_unit && <span style={{ fontSize: 16, color: '#999' }}>/{listing.price_unit}</span>}</div>

          {listing.merchant_name ? (
            <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontWeight: 'bold' }}>
                  {listing.merchant_name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {listing.merchant_name}
                    {listing.is_approved === 1 && <span style={{ background: '#52c41a', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>✓ 营业执照已核验</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>⭐ {listing.merchant_rating || 5.0} 分 | Lv.{listing.merchant_level || 1} | 成交 {listing.total_deals || 0} 单</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                <div style={{ background: '#f9f9f9', padding: '8px 12px', borderRadius: 6 }}>
                  <span style={{ color: '#999' }}>响应率</span>
                  <span style={{ float: 'right', fontWeight: 500 }}>{listing.response_rate || 100}%</span>
                </div>
                <div style={{ background: '#f9f9f9', padding: '8px 12px', borderRadius: 6 }}>
                  <span style={{ color: '#999' }}>平均响应</span>
                  <span style={{ float: 'right', fontWeight: 500 }}>{listing.avg_response_time ? Math.round(listing.avg_response_time / 60) : 5}分钟</span>
                </div>
                {listing.business_license && (
                  <div style={{ gridColumn: 'span 2', background: '#f9f9f9', padding: '8px 12px', borderRadius: 6, color: '#666' }}>
                    <span>营业执照: {listing.business_license}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{listing.author_name || '个人发布'}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>个人用户，请注意核实信息</div>
                </div>
              </div>
            </div>
          )}

          {listing.fraud_check && (
            <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: listing.fraud_check.is_flagged ? '#fff1f0' : '#f6ffed', border: `1px solid ${listing.fraud_check.is_flagged ? '#ffa39e' : '#b7eb8f'}` }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
                🔍 平台核验结论
              </div>
              <div style={{ fontSize: 12, color: listing.fraud_check.is_flagged ? '#ff4d4f' : '#52c41a' }}>
                {listing.fraud_check.is_flagged ? '⚠️ 存在风险，请注意甄别' : '✓ 未发现虚假信息特征'}
                <span style={{ marginLeft: 8, color: '#999' }}>(风险评分: {Math.round(listing.fraud_check.score * 100)}%)</span>
              </div>
              {listing.fraud_check.details && Array.isArray(listing.fraud_check.details) && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                  检测项: {listing.fraud_check.details.map(d => d.name).filter(Boolean).join('、') || '常规检查'}
                </div>
              )}
            </div>
          )}

          <button className="contact-btn" onClick={handleContact}>立即联系 / 发送线索</button>

          <div style={{ marginTop: 12, fontSize: 12, color: '#999', padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
            <div>👁 浏览 {listing.view_count} 次</div>
            <div>🕐 发布于 {new Date(listing.created_at).toLocaleDateString()}</div>
            {listing.valid_to && <div>📅 有效期至 {new Date(listing.valid_to).toLocaleDateString()}</div>}
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-outline" style={{ width: '100%', fontSize: 13 }} onClick={() => setShowReport(!showReport)}>
              🚩 举报此信息
            </button>
            {user?.user_type === 'admin' && (
              <button className="btn btn-outline" style={{ width: '100%', fontSize: 13, color: '#1890ff', borderColor: '#1890ff' }} onClick={() => navigate('/admin')}>
                🔍 后台复查
              </button>
            )}
          </div>

          {showReport && (
            <div style={{ marginTop: 12, padding: 16, background: '#fff7e6', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 8, fontSize: 14 }}>举报信息</h4>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <select className="form-input" value={reportForm.report_type} onChange={e => setReportForm(p => ({ ...p, report_type: e.target.value }))} style={{ fontSize: 13 }}>
                  <option value="虚假信息">虚假信息</option>
                  <option value="重复发布">重复发布</option>
                  <option value="价格欺诈">价格欺诈</option>
                  <option value="联系方式异常">联系方式异常</option>
                  <option value="图片盗用">图片盗用</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <input className="form-input" placeholder="举报原因" value={reportForm.reason} onChange={e => setReportForm(p => ({ ...p, reason: e.target.value }))} style={{ fontSize: 13 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <textarea className="form-input" placeholder="详细说明（选填）" value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))} style={{ fontSize: 13, minHeight: 60 }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={handleReport}>提交举报</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;
