import { useState } from 'react';
import { FileText, Eye, Check, X, RefreshCw, User, Clock, Filter, ChevronRight, AlertTriangle } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ReviewItem {
  id: number;
  title: string;
  reviewer: string;
  targetName: string;
  category: string;
  overallScore: number;
  status: 'submitted' | 'reviewing' | 'cross_validating' | 'approved' | 'rejected' | 'published';
  submittedAt: string;
  currentStage: number;
  crossReviewers?: string[];
  issues?: string[];
}

const mockReviews: ReviewItem[] = [
  {
    id: 105, title: '携程旅行用户满意度调查', reviewer: '王芳',
    targetName: '携程旅行', category: '旅游出行', overallScore: 89,
    status: 'submitted', submittedAt: '2025-06-12', currentStage: 0,
  },
  {
    id: 104, title: '新东方教育服务质量评测', reviewer: '李华',
    targetName: '新东方教育', category: '教育服务', overallScore: 91,
    status: 'reviewing', submittedAt: '2025-06-08', currentStage: 1,
    issues: ['部分数据来源需补充说明'],
  },
  {
    id: 103, title: '海天酱油添加剂安全分析报告', reviewer: '张明',
    targetName: '海天味业', category: '消费品牌', overallScore: 85,
    status: 'cross_validating', submittedAt: '2025-06-02', currentStage: 2,
    crossReviewers: ['刘伟', '陈静'],
  },
  {
    id: 102, title: '农夫山泉水源品质评测', reviewer: '张明',
    targetName: '农夫山泉', category: '消费品牌', overallScore: 89,
    status: 'approved', submittedAt: '2025-05-28', currentStage: 3,
  },
  {
    id: 101, title: '蒙牛乳业综合可信评价报告', reviewer: '张明',
    targetName: '蒙牛乳业', category: '消费品牌', overallScore: 92,
    status: 'published', submittedAt: '2025-05-20', currentStage: 4,
  },
  {
    id: 95, title: '某产品性价比评价报告', reviewer: '李华',
    targetName: '某品牌', category: '消费品牌', overallScore: 75,
    status: 'rejected', submittedAt: '2025-05-10', currentStage: 1,
    issues: ['样本量不足，数据支撑不够', '分析深度不够'],
  },
];

const stages = [
  { name: '提交', key: 'submitted' },
  { name: '初审', key: 'reviewing' },
  { name: '交叉验证', key: 'cross_validating' },
  { name: '终审', key: 'approved' },
  { name: '发布', key: 'published' },
];

const statusFilters = [
  { code: 'all', name: '全部' },
  { code: 'submitted', name: '待初审' },
  { code: 'reviewing', name: '初审中' },
  { code: 'cross_validating', name: '交叉验证' },
  { code: 'approved', name: '待发布' },
  { code: 'rejected', name: '已驳回' },
];

export function ReviewWorkflow() {
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filteredReviews = mockReviews.filter(
    (r) => activeStatus === 'all' || r.status === activeStatus
  );

  const counts = {
    all: mockReviews.length,
    submitted: mockReviews.filter(r => r.status === 'submitted').length,
    reviewing: mockReviews.filter(r => r.status === 'reviewing').length,
    cross_validating: mockReviews.filter(r => r.status === 'cross_validating').length,
    approved: mockReviews.filter(r => r.status === 'approved').length,
    rejected: mockReviews.filter(r => r.status === 'rejected').length,
  };

  const getStageActions = (review: ReviewItem) => {
    switch (review.status) {
      case 'submitted':
        return [
          { label: '通过初审', icon: Check, action: 'pass', style: 'btn-primary' },
          { label: '驳回', icon: X, action: 'reject', style: 'btn-danger' },
        ];
      case 'reviewing':
        return [
          { label: '进入交叉验证', icon: RefreshCw, action: 'cross', style: 'btn-primary' },
          { label: '驳回', icon: X, action: 'reject', style: 'btn-danger' },
        ];
      case 'cross_validating':
        return [
          { label: '通过终审', icon: Check, action: 'approve', style: 'btn-primary' },
          { label: '驳回', icon: X, action: 'reject', style: 'btn-danger' },
        ];
      case 'approved':
        return [
          { label: '发布报告', icon: Check, action: 'publish', style: 'btn-primary' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          报告审核工作流
        </h1>
        <p className="text-slate-400 text-sm">初审 → 交叉验证 → 终审 → 发布，四级审核流程</p>
      </div>

      {/* Status Tabs */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex border-b border-slate-700/50 overflow-x-auto">
          {statusFilters.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setActiveStatus(tab.code)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeStatus === tab.code
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-light/50'
              }`}
            >
              {tab.name}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                activeStatus === tab.code ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'
              }`}>
                {counts[tab.code as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const actions = getStageActions(review);
          return (
            <div key={review.id} className="card p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <ScoreRing score={review.overallScore} size={56} strokeWidth={5} showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusBadge status={review.status} />
                      <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{review.category}</span>
                    </div>
                    <h3 className="font-medium text-white truncate">{review.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        评测员：{review.reviewer}
                      </span>
                      <span>·</span>
                      <span>评测对象：{review.targetName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {review.submittedAt}
                      </span>
                    </div>

                    {/* Workflow Progress */}
                    <div className="mt-4">
                      <div className="flex items-center gap-1">
                        {stages.map((stage, idx) => (
                          <div key={stage.key} className="flex items-center gap-1 flex-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                idx <= review.currentStage
                                  ? review.status === 'rejected' && idx === review.currentStage
                                    ? 'bg-danger text-white'
                                    : 'bg-primary text-white'
                                  : 'bg-surface-light text-slate-500'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span className={`text-xs ${idx <= review.currentStage ? 'text-slate-300' : 'text-slate-600'}`}>
                              {stage.name}
                            </span>
                            {idx < stages.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${
                                idx < review.currentStage ? 'bg-primary' : 'bg-surface-light'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {review.issues && review.issues.length > 0 && (
                      <div className="mt-3 p-3 rounded bg-warning/10 border border-warning/30">
                        <div className="text-sm text-warning flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          存在问题
                        </div>
                        <ul className="text-xs text-slate-400 space-y-0.5">
                          {review.issues.map((issue, idx) => (
                            <li key={idx}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.crossReviewers && (
                      <div className="mt-3 text-xs text-slate-500">
                        交叉验证员：{review.crossReviewers.join('、')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="btn btn-outline text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看详情
                  </button>
                  {actions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => {
                        if (action.action === 'reject') {
                          setSelectedReview(review);
                          setShowRejectModal(true);
                        }
                      }}
                      className={`btn ${action.style} text-sm`}
                    >
                      <action.icon className="w-4 h-4 mr-1" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-fade-in">
            <h3 className="font-serif font-semibold text-white text-lg mb-4 flex items-center gap-2">
              <X className="w-5 h-5 text-danger" />
              驳回报告
            </h3>
            <div>
              <label className="label">驳回原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请详细说明驳回原因，帮助评测员改进..."
                rows={4}
                className="input resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn btn-outline flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn btn-danger flex-1"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && !showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <h3 className="font-serif font-semibold text-white text-lg mb-4">{selectedReview.title}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-slate-500">评测对象</span>
                <div className="text-white">{selectedReview.targetName}</div>
              </div>
              <div>
                <span className="text-slate-500">所属领域</span>
                <div className="text-white">{selectedReview.category}</div>
              </div>
              <div>
                <span className="text-slate-500">评测员</span>
                <div className="text-white">{selectedReview.reviewer}</div>
              </div>
              <div>
                <span className="text-slate-500">综合评分</span>
                <div className="text-white">{selectedReview.overallScore} 分</div>
              </div>
            </div>
            <div className="border-t border-slate-700/50 pt-4 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">报告摘要</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                本报告基于多源数据对{selectedReview.targetName}进行了综合评价，涵盖产品质量、服务体验、品牌信誉、价格公道等维度。
                经过数据采集、清洗、分析等环节，最终得出综合评分{selectedReview.overallScore}分。
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedReview(null)}
                className="btn btn-outline"
              >
                关闭
              </button>
              <button className="btn btn-primary">
                查看完整报告
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewWorkflow;
