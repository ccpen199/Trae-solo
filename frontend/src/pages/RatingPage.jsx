import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi, paymentApi } from '../api';

const RatingPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [alreadyRated, setAlreadyRated] = useState(false);

  const tags = [
    '服务态度好', '驾驶平稳', '车辆整洁', '准时准点', '路线熟悉',
    '乐于助人', '车内无异味', '开车礼貌'
  ];

  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderRes, ratingRes] = await Promise.all([
        orderApi.getOrderById(orderId),
        paymentApi.getRating(orderId).catch(() => ({ data: { success: true, data: null } }))
      ]);
      
      if (orderRes.data.success) {
        setOrder(orderRes.data.data);
      }

      if (ratingRes.data.success && ratingRes.data.data) {
        setAlreadyRated(true);
        setRating(ratingRes.data.data.rating);
        setComment(ratingRes.data.data.comment || '');
      }
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const fullComment = selectedTags.length > 0 
        ? comment + (comment ? ' ' : '') + selectedTags.join('、')
        : comment;
      
      const res = await paymentApi.submitRating({
        orderId,
        rating,
        comment: fullComment
      });
      
      if (res.data.success) {
        alert('评价提交成功！感谢您的反馈');
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '120px' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{ fontSize: '20px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
          {alreadyRated ? '我的评价' : '评价司机'}
        </div>
        <div style={{ width: '20px' }}></div>
      </div>

      {!alreadyRated && (
        <div style={{ 
          background: 'linear-gradient(180deg, #fff5ee 0%, white 100%)', 
          margin: '16px', 
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            本次行程服务如何？
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            您的评价将帮助我们改进服务
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <div
                key={star}
                onClick={() => setRating(star)}
                style={{ fontSize: '40px', cursor: 'pointer' }}
              >
                {star <= rating ? '⭐' : '☆'}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '8px', color: '#ff6a00', fontWeight: '500' }}>
            {rating === 5 ? '非常满意' : 
             rating === 4 ? '比较满意' : 
             rating === 3 ? '一般' : 
             rating === 2 ? '不太满意' : '非常不满意'}
          </div>
        </div>
      )}

      {alreadyRated && (
        <div style={{ 
          background: 'white', 
          margin: '16px', 
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            感谢您的评价
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ fontSize: '28px' }}>
                {star <= rating ? '⭐' : '☆'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>司机信息</div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: '#fff5ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            {order?.driver_avatar || '👨'}
          </div>
          <div style={{ marginLeft: '12px' }}>
            <div style={{ fontWeight: '600' }}>{order?.driver_name}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {order?.car_model} · {order?.car_number}
            </div>
            <div style={{ fontSize: '12px', color: '#faad14', marginTop: '2px' }}>
              ⭐ {order?.driver_rating} 分
            </div>
          </div>
        </div>
      </div>

      {!alreadyRated && (
        <>
          <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>选择标签</div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tags.map(tag => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    background: selectedTags.includes(tag) ? '#fff5ee' : '#f5f5f5',
                    color: selectedTags.includes(tag) ? '#ff6a00' : '#666',
                    border: selectedTags.includes(tag) ? '1px solid #ff6a00' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>写点什么</div>
            
            <textarea
              placeholder="请输入您的评价（选填）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              style={{ 
                width: '100%', 
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
        </>
      )}

      {!alreadyRated && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          maxWidth: '480px',
          margin: '0 auto',
          background: 'white',
          padding: '16px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: submitting ? '#ccc' : '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '提交中...' : '提交评价'}
          </button>
        </div>
      )}

      {alreadyRated && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          maxWidth: '480px',
          margin: '0 auto',
          background: 'white',
          padding: '16px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            返回首页
          </button>
        </div>
      )}
    </div>
  );
};

export default RatingPage;