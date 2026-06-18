import { useEffect, useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Eye, Mic, FileText, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { getSpeechReviews, detectSensitiveContent, updateSpeechReview } from '../../services/api';
import type { SpeechReview } from '../../../shared/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
};

const riskLevelColors: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

const mockSensitiveWords = ['包治百病', '根治', '100%有效', '零风险', '暴富', '躺赚', '金字塔', '拉人头', '返利'];

export default function SpeechReviewPage() {
  const [reviews, setReviews] = useState<SpeechReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'test'>('review');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, [activeStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getSpeechReviews({ status: activeStatus === 'all' ? undefined : activeStatus });
      if (res.code === 0) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    if (!testText.trim()) return;
    try {
      const res = await detectSensitiveContent({ content: testText });
      if (res.code === 0) {
        setTestResult(res.data);
      }
    } catch (err) {
      const foundWords = mockSensitiveWords.filter(w => testText.includes(w));
      setTestResult({
        hasSensitive: foundWords.length > 0,
        riskLevel: foundWords.length > 2 ? 'high' : foundWords.length > 0 ? 'medium' : 'low',
        matchedWords: foundWords,
        score: foundWords.length * 20,
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await updateSpeechReview(id, { status: 'approved' });
      if (res.code === 0) {
        fetchReviews();
      }
    } catch (err) {
      setReviews(reviews.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await updateSpeechReview(id, { status: 'rejected' });
      if (res.code === 0) {
        fetchReviews();
      }
    } catch (err) {
      setReviews(reviews.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    }
  };

  const stats = [
    { label: '待审核', value: reviews.filter(r => r.status === 'pending').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '今日检测', value: 156, icon: Mic, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '敏感内容', value: 23, icon: Shield, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '通过率', value: '85.2%', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const filteredReviews = reviews.filter(r => 
    activeStatus === 'all' || r.status === activeStatus
  );

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const highlightSensitiveWords = (text: string, words: string[]) => {
    if (!words || words.length === 0) return text;
    let result = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, '<mark class="bg-red-200 text-red-700 px-0.5 rounded">$1</mark>');
    });
    return result;
  };

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

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('review')}
          className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'review' ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          话术审核
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'test' ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          AI敏感词检测
        </button>
      </div>

      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">输入检测内容</h3>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="请输入需要检测的话术内容，AI将自动识别敏感词和违规内容..."
              className="input w-full h-48"
            />
            <button
              onClick={handleDetect}
              disabled={!testText.trim()}
              className="btn btn-primary w-full mt-4"
            >
              <Shield className="w-4 h-4 mr-2" />
              开始AI检测
            </button>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">常见敏感词提示：</p>
              <div className="flex flex-wrap gap-2">
                {mockSensitiveWords.map((word, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">检测结果</h3>
            {testResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${riskLevelColors[testResult.riskLevel]}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">风险等级</span>
                    <span className="text-2xl font-bold">
                      {testResult.riskLevel === 'high' ? '高风险' : testResult.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </span>
                  </div>
                  <div className="mt-2 w-full h-3 bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${testResult.riskLevel === 'high' ? 'bg-red-500' : testResult.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${testResult.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-2">风险评分: {testResult.score}/100</p>
                </div>

                {testResult.matchedWords && testResult.matchedWords.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm font-medium text-red-800 mb-2">检测到敏感词 ({testResult.matchedWords.length}个):</p>
                    <div className="flex flex-wrap gap-2">
                      {testResult.matchedWords.map((word: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.hasSensitive === false && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">检测通过</p>
                      <p className="text-sm text-green-600">未检测到敏感内容</p>
                    </div>
                  </div>
                )}

                {testResult.suggestion && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-800 mb-1">AI建议:</p>
                    <p className="text-sm text-blue-700">{testResult.suggestion}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>请在左侧输入内容进行检测</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <>
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStatus === tab.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="搜索内容..." className="input pl-10 w-60" />
              </div>
              <button className="btn btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const isExpanded = expandedId === review.id;
              return (
                <div key={review.id} className="card overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {review.userName[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">{review.userName}</span>
                            <span className="text-sm text-gray-500">{review.source}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[review.status].color}`}>
                              {statusConfig[review.status].label}
                            </span>
                            {review.riskLevel && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskLevelColors[review.riskLevel]}`}>
                                {review.riskLevel === 'high' ? '高风险' : review.riskLevel === 'medium' ? '中风险' : '低风险'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 line-clamp-2">{review.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{new Date(review.createdAt).toLocaleString()}</span>
                            {review.matchedWords && review.matchedWords.length > 0 && (
                              <span className="text-red-500">
                                敏感词: {review.matchedWords.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-700 mb-2">完整内容:</p>
                        <p 
                          className="text-gray-800"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSensitiveWords(review.content, review.matchedWords || []) 
                          }}
                        ></p>
                      </div>
                      
                      {review.status === 'pending' && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(review.id);
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
                          >
                            驳回
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(review.id);
                            }}
                            className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100"
                          >
                            通过
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
