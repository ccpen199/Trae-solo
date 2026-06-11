import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { reviewApi } from '../api';
import { Review } from '../types';

const ReviewPage = () => {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [sentimentStats, setSentimentStats] = useState<any[]>([]);
  const [reviewTrend, setReviewTrend] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'stats'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const data = await reviewApi.getPendingReviews();
        setPendingReviews(data || []);
      } else {
        const [stats, trend] = await Promise.all([
          reviewApi.getSentimentStats(),
          reviewApi.getTrend(7),
        ]);
        setSentimentStats(stats || []);
        setReviewTrend(trend || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await reviewApi.approveReview(reviewId);
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await reviewApi.rejectReview(reviewId);
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to reject review:', err);
    }
  };

  const getSentimentOption = () => {
    const positive = sentimentStats.find(s => s.sentiment === 'positive')?.count || 0;
    const neutral = sentimentStats.find(s => s.sentiment === 'neutral')?.count || 0;
    const negative = sentimentStats.find(s => s.sentiment === 'negative')?.count || 0;

    return {
      title: {
        text: '用户情感分布',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '情感分析',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: positive, name: '正面', itemStyle: { color: '#52c41a' } },
            { value: neutral, name: '中性', itemStyle: { color: '#999' } },
            { value: negative, name: '负面', itemStyle: { color: '#ff4d4f' } },
          ],
        },
      ],
    };
  };

  const getTrendOption = () => ({
    title: {
      text: '近7日评论趋势',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['正面评价', '负面评价', '平均评分'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: reviewTrend.map(item => item.date?.slice(5) || ''),
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left',
      },
      {
        type: 'value',
        name: '评分',
        position: 'right',
        min: 0,
        max: 5,
      },
    ],
    series: [
      {
        name: '正面评价',
        type: 'bar',
        stack: 'total',
        data: reviewTrend.map(item => item.positive_count || 0),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '负面评价',
        type: 'bar',
        stack: 'total',
        data: reviewTrend.map(item => item.negative_count || 0),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: '平均评分',
        type: 'line',
        yAxisIndex: 1,
        data: reviewTrend.map(item => item.avg_rating || 0),
        smooth: true,
        itemStyle: { color: '#faad14' },
      },
    ],
  });

  const getSentimentLabel = (sentiment: string) => {
    const map: Record<string, string> = {
      positive: '正面',
      neutral: '中性',
      negative: '负面',
    };
    return map[sentiment] || sentiment;
  };

  const getSentimentClass = (sentiment: string) => {
    return `review-sentiment sentiment-${sentiment}`;
  };

  return (
    <div>
      <h1 className="page-title">评论审核与情感分析</h1>

      <div className="card">
        <div className="tabs">
          <div
            className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            待审核评论
            {pendingReviews.length > 0 && (
              <span style={{
                marginLeft: 6,
                background: '#ff4d4f',
                color: 'white',
                padding: '0 6px',
                borderRadius: 10,
                fontSize: 12,
              }}>
                {pendingReviews.length}
              </span>
            )}
          </div>
          <div
            className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            情感分析看板
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
        ) : activeTab === 'pending' ? (
          pendingReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div>暂无待审核评论</div>
            </div>
          ) : (
            <div>
              {pendingReviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-user">用户 {review.user_id?.slice(0, 8)}</span>
                    <span className="review-rating">
                      {'★'.repeat(Math.floor(review.rating))}
                      {'☆'.repeat(5 - Math.floor(review.rating))}
                      <span style={{ color: '#999', marginLeft: 4, fontSize: 12 }}>
                        {review.rating.toFixed(1)}
                      </span>
                    </span>
                  </div>
                  <div className="review-content">{review.content || '（无文字评价）'}</div>
                  <div className={getSentimentClass(review.sentiment)}>
                    情感分析：{getSentimentLabel(review.sentiment)}
                    （置信度：{(review.sentiment_score * 100).toFixed(0)}%）
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-success"
                      style={{ padding: '6px 16px', fontSize: 13 }}
                      onClick={() => handleApprove(review.id)}
                    >
                      ✓ 通过
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 16px', fontSize: 13 }}
                      onClick={() => handleReject(review.id)}
                    >
                      ✕ 驳回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid-2">
            <div className="chart-container" style={{ boxShadow: 'none', padding: 0 }}>
              <ReactECharts option={getSentimentOption()} style={{ height: 300 }} />
            </div>
            <div>
              <h4 style={{ marginBottom: 16 }}>情感统计</h4>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#52c41a' }}>正面评价</span>
                  <span>
                    {sentimentStats.find(s => s.sentiment === 'positive')?.count || 0} 条
                  </span>
                </div>
                <div className="soc-bar">
                  <div
                    className="soc-fill high"
                    style={{
                      width: `${(
                        (sentimentStats.find(s => s.sentiment === 'positive')?.count || 0) /
                        (sentimentStats.reduce((sum, s) => sum + s.count, 0) || 1)
                      ) * 100}%`,
                      background: '#52c41a',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#999' }}>中性评价</span>
                  <span>
                    {sentimentStats.find(s => s.sentiment === 'neutral')?.count || 0} 条
                  </span>
                </div>
                <div className="soc-bar">
                  <div
                    className="soc-fill"
                    style={{
                      width: `${(
                        (sentimentStats.find(s => s.sentiment === 'neutral')?.count || 0) /
                        (sentimentStats.reduce((sum, s) => sum + s.count, 0) || 1)
                      ) * 100}%`,
                      background: '#999',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#ff4d4f' }}>负面评价</span>
                  <span>
                    {sentimentStats.find(s => s.sentiment === 'negative')?.count || 0} 条
                  </span>
                </div>
                <div className="soc-bar">
                  <div
                    className="soc-fill low"
                    style={{
                      width: `${(
                        (sentimentStats.find(s => s.sentiment === 'negative')?.count || 0) /
                        (sentimentStats.reduce((sum, s) => sum + s.count, 0) || 1)
                      ) * 100}%`,
                      background: '#ff4d4f',
                    }}
                  />
                </div>
              </div>
              <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>综合满意度</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#52c41a' }}>
                  {(
                    (sentimentStats.find(s => s.sentiment === 'positive')?.count || 0) /
                    (sentimentStats.reduce((sum, s) => sum + s.count, 0) || 1) * 100
                  ).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'stats' && !loading && (
        <div className="card" style={{ marginTop: 24 }}>
          <ReactECharts option={getTrendOption()} style={{ height: 320 }} />
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
