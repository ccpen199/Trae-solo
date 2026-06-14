import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewTags, setReviewTags] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      setListing(res.data);
      setTransactionAmount(res.data.price || 0);
    } catch (err) {
      console.error('加载详情失败', err);
    }
  };

  const handleCreateTransaction = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/transactions', {
        listing_id: listing.id,
        amount: transactionAmount
      });
      setMessage('交易创建成功！');
      setShowTransactionModal(false);
      setTimeout(() => navigate('/transactions'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || '创建失败');
    }
  };

  const handleReport = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/listings/${id}/report`, {
        reason: reportReason,
        description: reportDesc
      });
      setMessage('举报已提交！');
      setShowReportModal(false);
      setReportReason('');
      setReportDesc('');
    } catch (err) {
      setMessage(err.response?.data?.error || '提交失败');
    }
  };

  const handleVerify = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/listings/${id}/verify-authenticity`);
      setVerifyResult(res.data);
      setShowVerifyModal(true);
      loadListing();
    } catch (err) {
      setMessage(err.response?.data?.error || '核验失败');
    }
  };

  const handleReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/reviews', {
        listing_id: listing.id,
        reviewee_id: listing.user_id,
        rating: reviewRating,
        content: reviewContent,
        tags: reviewTags
      });
      setMessage('评价成功！');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewContent('');
      setReviewTags([]);
      loadListing();
    } catch (err) {
      setMessage(err.response?.data?.error || '评价失败');
    }
  };

  const toggleReviewTag = (tag) => {
    setReviewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!listing) {
    return <div className="container">加载中...</div>;
  }

  const isOwner = user && user.id === listing.user_id;

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '5rem', textAlign: 'center', background: '#f5f5f5', borderRadius: '12px', padding: '2rem' }}>
              {listing.category_icon}
            </div>
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span className="badge">{listing.category_name}</span>
              {listing.is_verified && <span className="badge badge-verified">信息已核验</span>}
            </div>
            <h1 style={{ marginBottom: '1rem' }}>{listing.title}</h1>
            <div style={{ fontSize: '2rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '1rem' }}>
              {listing.price > 0 ? `¥${listing.price}${listing.price_unit ? `/${listing.price_unit}` : ''}` : '面议'}
            </div>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              📍 {listing.city} {listing.district} {listing.address}
            </p>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              👁️ 浏览 {listing.view_count} 次
            </p>
            {listing.tags && listing.tags.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                {listing.tags.map((tag, i) => (
                  <span key={i} className="tag tag-success">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">📝 详情描述</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description || '暂无描述'}</p>
      </div>

      {listing.fields && Object.keys(listing.fields).length > 0 && (
        <div className="card">
          <h3 className="card-title">📋 详细信息</h3>
          <table className="table">
            <tbody>
              {Object.entries(listing.fields).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ width: '150px', fontWeight: '500' }}>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">👤 发布者信息</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '3rem' }}>{listing.author_avatar || '👤'}</div>
          <div>
            <div style={{ fontWeight: '500' }}>
              {listing.author_name}
              {listing.author_verified && <span className="badge badge-verified" style={{ marginLeft: '0.5rem' }}>已实名认证</span>}
            </div>
            <div style={{ color: '#666' }}>信用分：{listing.author_credit}</div>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <strong>联系方式：</strong>{listing.contact_phone || listing.contact_name || '点击交易按钮获取'}
        </div>
      </div>

      {!isOwner && (
        <div className="card">
          <h3 className="card-title">💼 担保交易</h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            通过平台担保交易，定金冻结后服务完成再放款，保障双方权益
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowTransactionModal(true)}>
              发起担保交易
            </button>
            <button className="btn btn-secondary" onClick={handleVerify}>
              🔍 真伪核验
            </button>
            <button className="btn btn-secondary" onClick={() => setShowReviewModal(true)}>
              ⭐ 发表评价
            </button>
            <button className="btn btn-danger" onClick={() => setShowReportModal(true)}>
              🚩 举报
            </button>
          </div>
        </div>
      )}

      {listing.reviews && listing.reviews.length > 0 && (
        <div className="card">
          <h3 className="card-title">⭐ 用户评价 ({listing.reviews.length})</h3>
          {listing.reviews.map((review) => (
            <div key={review.id} style={{ padding: '1rem 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>{review.reviewer_name}</span>
                <span style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p style={{ color: '#666' }}>{review.content}</p>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                {review.created_at}
              </div>
            </div>
          ))}
        </div>
      )}

      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">发起担保交易</div>
              <button className="close-btn" onClick={() => setShowTransactionModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-success">{message}</div>}
            <div className="form-group">
              <label>交易金额（元）</label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem' }}>
              <p><strong>交易流程：</strong></p>
              <ol style={{ marginLeft: '1.5rem', color: '#666' }}>
                <li>买家支付定金（20%），平台冻结资金</li>
                <li>双方确认服务完成</li>
                <li>平台释放资金给卖家</li>
              </ol>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTransactionModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateTransaction}>
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">举报虚假信息</div>
              <button className="close-btn" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-success">{message}</div>}
            <div className="form-group">
              <label>举报原因 *</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="">请选择原因</option>
                <option value="虚假信息">虚假信息</option>
                <option value="价格欺诈">价格欺诈</option>
                <option value="联系方式无效">联系方式无效</option>
                <option value="违禁物品">违禁物品</option>
                <option value="诈骗嫌疑">诈骗嫌疑</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>详细描述</label>
              <textarea
                rows="4"
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="请详细描述问题..."
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              您的举报将被严格保密，平台会在24小时内进行核查处理
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReportModal(false)}>
                取消
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReport} disabled={!reportReason}>
                提交举报
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">发表评价</div>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            {message && <div className="alert alert-success">{message}</div>}
            <div className="form-group">
              <label>评分</label>
              <div style={{ fontSize: '2rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{ color: star <= reviewRating ? '#f59e0b' : '#ddd' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>标签（可多选）</label>
              <div>
                {['靠谱', '专业', '价格公道', '服务好', '准时', '无中介', '维修快', '沟通顺畅'].map((tag) => (
                  <span
                    key={tag}
                    className={`tag ${reviewTags.includes(tag) ? 'tag-success' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleReviewTag(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>评价内容</label>
              <textarea
                rows="4"
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="请输入您的评价..."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReviewModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReview}>
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && verifyResult && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">真伪核验报告</div>
              <button className="close-btn" onClick={() => setShowVerifyModal(false)}>×</button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {verifyResult.isPassed ? '✅' : '⚠️'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: verifyResult.isPassed ? '#16a34a' : '#dc2626' }}>
                {verifyResult.score} 分
              </div>
              <div style={{ color: '#666' }}>
                可信度：{verifyResult.credibilityLevel}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>核验项</h4>
              {verifyResult.checks.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ marginRight: '0.5rem' }}>
                    {check.passed ? '✅' : '❌'}
                  </span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{check.check}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {verifyResult.duplicates && verifyResult.duplicates.length > 0 && (
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4 style={{ color: '#d97706', marginBottom: '0.5rem' }}>⚠️ 发现疑似重复信息</h4>
                {verifyResult.duplicates.map((dup, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#666' }}>
                    - {dup.title}
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              * 核验数据基于工商、社保、车辆登记等公共数据交叉验证
            </p>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowVerifyModal(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetail;
