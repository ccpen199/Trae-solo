import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsAPI } from '../api/client';

function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [id]);

  const loadNews = async () => {
    try {
      const res = await newsAPI.getNewsDetail(id);
      setNews(res.data.news);
      setReviews(res.data.reviews || []);
    } catch (err) {
      alert('加载失败');
      navigate('/news');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!news) return <div className="empty">未找到该资讯</div>;

  return (
    <div className="page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>← 返回列表</button>

      <article className="card article-card">
        <header className="article-header">
          <h1>{news.title}</h1>
          <div className="article-meta">
            <span className={`badge badge-${news.type === 'government' ? 'warning' : news.type === 'hot' ? 'danger' : news.source === 'ugc' ? 'success' : 'info'}`}>
              {news.source === 'ugc' ? '居民爆料' : news.type === 'government' ? '政务通知' : news.type === 'hot' ? '本地热点' : news.type === 'life' ? '便民资讯' : news.type === 'event' ? '活动预告' : '资讯'}
            </span>
            {news.review_status && (
              <span className={`badge badge-${news.review_status === '社区审核员已通过' ? 'success' : news.review_status === '待审核' ? 'warning' : news.review_status === '审核拒绝' ? 'danger' : 'info'}`}>
                {news.review_status === '社区审核员已通过' ? '🟢已审' : news.review_status === '待审核' ? '🟡待审' : news.review_status === '审核拒绝' ? '🔴已拒' : '📢已发布'}
              </span>
            )}
            <span>📍 {news.region_name}</span>
            <span>👁 {news.views || 0} 阅读</span>
            <span>{new Date(news.created_at).toLocaleString()}</span>
          </div>
          <div className="article-publisher">
            {news.author_name && <span>发布者：{news.author_name}</span>}
            {news.push_region_name && <span className="badge badge-info">📌 推送至：{news.push_region_name}辖区</span>}
          </div>
        </header>

        {news.summary && (
          <div className="article-summary">
            <strong>摘要：</strong>{news.summary}
          </div>
        )}

        <div className="article-content">
          {news.content.split('\n').map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {news.type === 'government' && (
          <div className="article-notice">
            <div className="info-box">
              <p><strong>📢 政务通知说明：</strong>本通知由{news.author_name || '区县管理员'}定向推送至{news.region_name}辖区用户。如对通知内容有疑问，请联系当地政务服务中心。</p>
              {news.push_region_name && <p><strong>推送辖区：</strong>{news.push_region_name}</p>}
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="article-review">
            <h4>审核信息</h4>
            {reviews.map((review, idx) => (
              <div key={review.id || idx} className="info-box" style={{ marginBottom: '8px' }}>
                <p><strong>审核员：</strong>{review.real_name || review.username || '未知'}</p>
                <p><strong>审核时间：</strong>{new Date(review.created_at).toLocaleString()}</p>
                <p><strong>审核结果：</strong>{review.review_result === 1 ? '通过' : '拒绝'}</p>
                <p><strong>审核意见：</strong>{review.review_comment || '符合发布要求'}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

export default NewsDetail;
