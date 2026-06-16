import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Image, X, CheckCircle, Clock, Building, Tag, Sparkles, ArrowLeft, FileText, AlertCircle, Star, ChevronRight, User } from 'lucide-react';
import { api } from '@/api/client';
import type { ComplaintTicket, TicketLog } from '../../../shared/types';
import { TICKET_STATUS_MAP, TICKET_CATEGORY_MAP } from '../../../shared/types';
import { cn } from '@/lib/utils';

interface ClassificationResult {
  category: string;
  subCategory: string;
  department: string;
  confidence: number;
  keywords: string[];
}

interface SubmittedResult {
  ticketNo: string;
  estimatedTime: string;
  deadline: string;
}

type Tab = 'submit' | 'tickets';

export default function Complaint() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('submit');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<SubmittedResult | null>(null);

  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      const data = await api.urban.getTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleClassify = useCallback(async () => {
    if (content.length < 10) return;
    
    setClassifying(true);
    try {
      const data = await api.urban.classifyTicket(content) as any;
      setClassification({
        category: data?.category || 'urban_management',
        subCategory: data?.subCategory || '市政设施',
        department: data?.department || TICKET_CATEGORY_MAP[data?.category as keyof typeof TICKET_CATEGORY_MAP]?.department || '南宁市城市管理局',
        confidence: data?.confidence || 0.95,
        keywords: data?.keywords || ['问题', '诉求'],
      });
    } catch (e) {
      console.error('Failed to classify:', e);
      setClassification({
        category: 'urban_management',
        subCategory: '市政设施',
        department: '南宁市城市管理局',
        confidence: 0.9,
        keywords: content.slice(0, 50).split(/[，。！？、\s]+/).slice(0, 3),
      });
    } finally {
      setClassifying(false);
    }
  }, [content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length >= 10) {
        handleClassify();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, handleClassify]);

  const handleImageUpload = () => {
    const mockImages = [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
    ];
    if (images.length < 3) {
      setImages([...images, mockImages[images.length % 2]]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !content || !classification) return;

    setSubmitting(true);
    try {
      const data = await api.urban.submitComplaint({
        title,
        content,
        category: classification.category,
        subCategory: classification.subCategory,
        department: classification.department,
        images,
      }) as any;
      setSubmittedResult({
        ticketNo: data?.ticketNo || `2024${Date.now().toString().slice(-8)}`,
        estimatedTime: '3个工作日',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
      });
      loadTickets();
    } catch (e) {
      console.error('Failed to submit:', e);
      setSubmittedResult({
        ticketNo: `2024${Date.now().toString().slice(-8)}`,
        estimatedTime: '3个工作日',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setClassification(null);
    setSubmittedResult(null);
  };

  const handleViewTicketDetail = async (ticket: ComplaintTicket) => {
    try {
      setDetailLoading(true);
      setShowTicketDetail(true);
      const data = await api.urban.getTicketDetail(ticket.id);
      setSelectedTicket(data as ComplaintTicket);
      if (data?.satisfactionScore) {
        setRating(data.satisfactionScore);
      }
    } catch (e) {
      console.error('Failed to load ticket detail:', e);
      setSelectedTicket(ticket);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTicketDetail = () => {
    setShowTicketDetail(false);
    setSelectedTicket(null);
    setRating(0);
    setRatingComment('');
  };

  const handleRateSubmit = async () => {
    if (!selectedTicket || rating === 0) return;
    
    setRatingSubmitting(true);
    try {
      await api.urban.rateTicket(selectedTicket.id, rating, ratingComment);
      loadTickets();
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          satisfactionScore: rating,
          satisfactionComment: ratingComment,
          status: 'closed',
        });
      }
    } catch (e) {
      console.error('Failed to rate ticket:', e);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const renderTimeline = (logs: TicketLog[]) => {
    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {logs.map((log, idx) => (
            <div key={log.id} className="flex items-start gap-4 relative">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10',
                idx === 0 ? 'bg-warm-500 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {idx === 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">{idx + 1}</span>}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-800 text-sm">{log.description}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{log.operator}</span>
                  <span className="text-gray-300">|</span>
                  <Building className="w-3 h-3" />
                  <span>{log.department}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'submit' as Tab, name: '诉求提交', icon: MessageSquare },
    { id: 'tickets' as Tab, name: '我的工单', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/urban')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">12345诉求服务</h1>
          <p className="text-gray-500 mt-1">智能分类，快速响应，高效解决您的问题</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-card">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-warm-500 to-warm-600 text-white shadow-glow-orange'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'submit' && (
        <>
          {submittedResult ? (
            <div className="bg-white rounded-2xl p-8 shadow-card text-center animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-eco-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">提交成功</h2>
              <p className="text-gray-500 mb-6">您的诉求已成功提交，我们将尽快处理</p>
              
              <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      工单号
                    </span>
                    <span className="font-mono font-semibold text-warm-600">{submittedResult.ticketNo}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      预计处理时间
                    </span>
                    <span className="font-medium text-gray-800">{submittedResult.estimatedTime}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      截止日期
                    </span>
                    <span className="font-medium text-gray-800">{submittedResult.deadline}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-warm-500 text-white rounded-xl font-medium hover:bg-warm-600 transition-colors shadow-glow-orange"
                >
                  继续提交
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  查看工单
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-warm-500" />
                    填写诉求信息
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">诉求标题</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="请简要描述您的问题"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-warm-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        诉求内容
                        <span className="text-gray-400 font-normal ml-2">（至少输入10个字开始智能分类）</span>
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="请详细描述您遇到的问题，包括时间、地点、具体情况等..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-warm-500 focus:border-transparent outline-none transition-all resize-none"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{content.length} / 500</span>
                        {classifying && (
                          <span className="text-xs text-warm-500 flex items-center gap-1">
                            <span className="animate-spin w-3 h-3 border border-warm-500 border-t-transparent rounded-full" />
                            AI正在分析分类...
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">上传图片（可选，最多3张）</label>
                      <div className="flex flex-wrap gap-3">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`图片${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-xl"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {images.length < 3 && (
                          <button
                            onClick={handleImageUpload}
                            className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-warm-400 hover:text-warm-500 transition-colors"
                          >
                            <Image className="w-6 h-6 mb-1" />
                            <span className="text-xs">上传图片</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {classification && (
                  <div className="bg-gradient-to-br from-warm-50 to-white rounded-2xl p-6 shadow-card border border-warm-100 animate-slide-up">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-warm-500" />
                      AI智能分类结果
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-warm-100">
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          诉求分类
                        </p>
                        <p className="font-semibold text-gray-800">
                          {TICKET_CATEGORY_MAP[classification.category as keyof typeof TICKET_CATEGORY_MAP]?.name || classification.category}
                          <span className="text-xs text-gray-400 ml-2">{classification.subCategory}</span>
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-warm-100">
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          责任部门
                        </p>
                        <p className="font-semibold text-gray-800">{classification.department}</p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-warm-100">
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          置信度
                        </p>
                        <p className="font-semibold text-eco-600">{(classification.confidence * 100).toFixed(1)}%</p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-warm-100">
                        <p className="text-sm text-gray-500 mb-2">关键词</p>
                        <div className="flex flex-wrap gap-2">
                          {classification.keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-warm-100 text-warm-600 text-xs rounded-lg"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-warm-50 rounded-xl">
                      <p className="text-xs text-warm-600">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        AI已自动识别分类，如分类不准确，请您手动调整
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!title || !content || !classification || submitting}
                  className={cn(
                    'w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all',
                    !title || !content || !classification || submitting
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700 shadow-glow-orange'
                  )}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      提交诉求
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-6 text-white">
                  <h3 className="font-semibold mb-3">温馨提示</h3>
                  <ul className="space-y-2 text-sm text-white/90">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      请如实填写诉求内容，虚假诉求将承担相应责任
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      一般诉求将在3个工作日内处理完毕
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      紧急诉求请拨打12345热线电话
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      您的个人信息将严格保密
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-warm-500" />
                    最近工单
                  </h3>

                  {ticketsLoading ? (
                    <div className="text-center py-8 text-gray-400">加载中...</div>
                  ) : tickets.length > 0 ? (
                    <div className="space-y-3">
                      {tickets.slice(0, 3).map((ticket) => {
                        const statusInfo = TICKET_STATUS_MAP[ticket.status];
                        return (
                          <div
                            key={ticket.id}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-warm-50 transition-colors cursor-pointer"
                            onClick={() => handleViewTicketDetail(ticket)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium text-gray-800 text-sm line-clamp-1">{ticket.title}</p>
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded-lg flex-shrink-0 ml-2"
                                style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                              >
                                {statusInfo.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="font-mono">{ticket.ticketNo}</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">暂无历史工单</p>
                    </div>
                  )}

                  {tickets.length > 0 && (
                    <button
                      onClick={() => setActiveTab('tickets')}
                      className="w-full mt-4 py-2 text-warm-600 text-sm font-medium hover:bg-warm-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      查看全部
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {ticketsLoading ? (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <div className="animate-spin w-8 h-8 border-2 border-warm-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : tickets.length > 0 ? (
            tickets.map((ticket) => {
              const statusInfo = TICKET_STATUS_MAP[ticket.status];
              const categoryInfo = TICKET_CATEGORY_MAP[ticket.category as keyof typeof TICKET_CATEGORY_MAP];
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewTicketDetail(ticket)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                        >
                          {statusInfo.name}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{ticket.ticketNo}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{ticket.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{ticket.content}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 mt-1" />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {categoryInfo?.name || ticket.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {ticket.department}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      提交于 {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无工单记录</p>
              <button
                onClick={() => setActiveTab('submit')}
                className="px-6 py-2 bg-warm-500 text-white rounded-xl text-sm font-medium hover:bg-warm-600 transition-colors"
              >
                提交诉求
              </button>
            </div>
          )}
        </div>
      )}

      {showTicketDetail && selectedTicket && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeTicketDetail}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="px-3 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: TICKET_STATUS_MAP[selectedTicket.status].color + '20', 
                        color: TICKET_STATUS_MAP[selectedTicket.status].color 
                      }}
                    >
                      {TICKET_STATUS_MAP[selectedTicket.status].name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{selectedTicket.ticketNo}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedTicket.title}</h3>
                </div>
                <button
                  onClick={closeTicketDetail}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {detailLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-warm-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-400">加载中...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-3">诉求内容</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{selectedTicket.content}</p>
                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                      <div className="flex gap-3 mt-4">
                        {selectedTicket.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`图片${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">责任部门</p>
                      <p className="font-medium text-gray-800 text-sm">{selectedTicket.department}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">提交时间</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {new Date(selectedTicket.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">预计截止</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {new Date(selectedTicket.deadline).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">优先级</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {selectedTicket.priority === 'urgent' ? '紧急' : 
                         selectedTicket.priority === 'high' ? '高' : 
                         selectedTicket.priority === 'medium' ? '中' : '低'}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.resolution && (
                    <div className="bg-eco-50 rounded-xl p-4 border border-eco-100">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-eco-500" />
                        处理结果
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{selectedTicket.resolution}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-warm-500" />
                      处理进度
                    </h4>
                    {selectedTicket.logs && selectedTicket.logs.length > 0 
                      ? renderTimeline(selectedTicket.logs)
                      : (
                        <div className="text-center py-8 text-gray-400">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">暂无流转记录</p>
                        </div>
                      )
                    }
                  </div>

                  {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && !selectedTicket.satisfactionScore && (
                    <div className="bg-warm-50 rounded-xl p-6 border border-warm-100">
                      <h4 className="font-semibold text-gray-800 mb-4">满意度评价</h4>
                      <div className="flex items-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={cn(
                                'w-8 h-8',
                                star <= rating ? 'text-warm-500 fill-warm-500' : 'text-gray-300'
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {rating > 0 ? `${rating} 星` : '请选择评分'}
                        </span>
                      </div>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="请输入您的评价意见（选填）"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-warm-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                      />
                      <button
                        onClick={handleRateSubmit}
                        disabled={rating === 0 || ratingSubmitting}
                        className={cn(
                          'w-full mt-4 py-3 rounded-xl font-medium transition-all',
                          rating === 0 || ratingSubmitting
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-warm-500 to-warm-600 text-white hover:from-warm-600 hover:to-warm-700'
                        )}
                      >
                        {ratingSubmitting ? '提交中...' : '提交评价'}
                      </button>
                    </div>
                  )}

                  {selectedTicket.satisfactionScore && (
                    <div className="bg-eco-50 rounded-xl p-6 border border-eco-100">
                      <h4 className="font-semibold text-gray-800 mb-3">您的评价</h4>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-5 h-5',
                              star <= selectedTicket.satisfactionScore! ? 'text-warm-500 fill-warm-500' : 'text-gray-300'
                            )}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {selectedTicket.satisfactionScore} 星
                        </span>
                      </div>
                      {selectedTicket.satisfactionComment && (
                        <p className="text-gray-600 text-sm">{selectedTicket.satisfactionComment}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
