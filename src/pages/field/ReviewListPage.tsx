import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, Star, ThumbsUp, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, Reply, CheckCircle, XCircle } from 'lucide-react';
import { getReviews } from '../../services/api';
import type { Review } from '../../../shared/types';

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [activeRating, setActiveRating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getReviews();
      if (res.code === 0) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: number) => {
    if (!replyContent.trim()) return;
    try {
      setReviews(reviews.map(r => 
        r.id === reviewId 
          ? { ...r, reply: replyContent, replyAt: new Date().toISOString(), hasReplied: true }
          : r
      ));
      setReplyContent('');
      setReplyingId(null);
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const ratingDistribution = [
    { value: reviews.filter(r => r.rating === 5).length, name: '5星' },
    { value: reviews.filter(r => r.rating === 4).length, name: '4星' },
    { value: reviews.filter(r => r.rating === 3).length, name: '3星' },
    { value: reviews.filter(r => r.rating === 2).length, name: '2星' },
    { value: reviews.filter(r => r.rating === 1).length, name: '1星' },
  ];

  const ratingOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
    yAxis: { 
      type: 'category', 
      data: ['5星', '4星', '3星', '2星', '1星'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'bar',
        data: ratingDistribution.map(r => ({ ...r, itemStyle: { 
          color: r.name === '5星' ? '#059669' : 
                 r.name === '4星' ? '#10b981' :
                 r.name === '3星' ? '#f59e0b' :
                 r.name === '2星' ? '#f97316' : '#ef4444' 
        }})),
        label: { show: true, position: 'right', formatter: '{c} ({d}%)' },
        barWidth: 20,
        itemStyle: { borderRadius: [0, 4, 4, 0] }
      }
    ]
  };

  const sentimentOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 18, fontWeight: 'bold', formatter: '{b}\n{d}%' }
        },
        data: [
          { value: reviews.filter(r => r.sentiment === 'positive').length, name: '好评', itemStyle: { color: '#059669' } },
          { value: reviews.filter(r => r.sentiment === 'neutral').length, name: '中评', itemStyle: { color: '#f59e0b' } },
          { value: reviews.filter(r => r.sentiment === 'negative').length, name: '差评', itemStyle: { color: '#ef4444' } },
        ]
      }
    ]
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const stats = [
    { label: '总评价数', value: reviews.length, icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '平均评分', value: avgRating, icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '好评率', value: `${reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%`, icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '待回复', value: reviews.filter(r => !r.hasReplied).length, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

  const filteredReviews = reviews.filter(r => 
    activeRating === null || r.rating === activeRating
  );

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">评分分布</h3>
          <ReactECharts option={ratingOption} style={{ height: 220 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">情感分析</h3>
          <ReactECharts option={sentimentOption} style={{ height: 220 }} />
        </div>
        <div className="card p-6 bg-gradient-to-br from-amber-50 to-primary-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">综合评价</h3>
          <div className="text-center py-4">
            <p className="text-6xl font-bold text-primary-600 mb-2">{avgRating}</p>
            <div className="flex justify-center mb-3">
              {renderStars(Math.round(parseFloat(avgRating)))}
            </div>
            <p className="text-sm text-gray-500">基于 {reviews.length} 条真实客户评价</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-gray-500">服务态度</p>
              <p className="text-lg font-bold text-gray-900">4.9</p>
            </div>
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-gray-500">专业度</p>
              <p className="text-lg font-bold text-gray-900">4.8</p>
            </div>
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-gray-500">环境</p>
              <p className="text-lg font-bold text-gray-900">4.9</p>
            </div>
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-gray-500">性价比</p>
              <p className="text-lg font-bold text-gray-900">4.7</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRating(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeRating === null ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            全部
          </button>
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => setActiveRating(rating)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${activeRating === rating ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Star className="w-3 h-3 fill-current" />
              {rating}星
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索评价内容..."
              className="input pl-10 w-60"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      {reviews.filter(r => r.rating <= 2 && !r.hasReplied).length > 0 && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-800">差评预警</p>
            <p className="text-sm text-danger-700">
              发现 {reviews.filter(r => r.rating <= 2 && !r.hasReplied).length} 条差评尚未回复，请及时处理，提升客户满意度。
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const isExpanded = expandedId === review.id;
          const isNegative = review.rating <= 2;
          return (
            <div key={review.id} className={`card overflow-hidden ${isNegative && !review.hasReplied ? 'ring-2 ring-danger-200' : ''}`}>
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : review.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {review.customerName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{review.customerName}</span>
                        {renderStars(review.rating)}
                        {isNegative && !review.hasReplied && (
                          <span className="px-2 py-0.5 bg-danger-100 text-danger-700 rounded text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            待处理
                          </span>
                        )}
                        {review.hasReplied && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            已回复
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{review.storeName}</span>
                        <span>·</span>
                        <span>{review.serviceType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      review.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                      review.sentiment === 'neutral' ? 'bg-amber-100 text-amber-700' :
                      'bg-danger-100 text-danger-700'
                    }`}>
                      {review.sentiment === 'positive' ? '好评' : review.sentiment === 'neutral' ? '中评' : '差评'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="mt-3 text-gray-700 line-clamp-2">{review.content}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.slice(0, 3).map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-2xl">
                        📷
                      </div>
                    ))}
                    {review.images.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        +{review.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-gray-700">{review.content}</p>
                  
                  {!review.hasReplied ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyingId === review.id ? replyContent : ''}
                        onChange={(e) => {
                          setReplyingId(review.id);
                          setReplyContent(e.target.value);
                        }}
                        placeholder="请输入回复内容..."
                        className="input w-full h-24"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingId(null);
                            setReplyContent('');
                          }}
                          className="btn btn-secondary"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyContent.trim()}
                          className="btn btn-primary"
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          回复评价
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                          商家回复
                        </span>
                        <span className="text-sm text-gray-500">
                          {review.replyAt ? new Date(review.replyAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.reply}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
