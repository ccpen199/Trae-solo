import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Clock,
  AlertTriangle,
  Plus,
  Inbox,
  ChevronRight,
  Star,
  FileText,
  Shield,
  Scale,
  CheckCircle,
  Edit3,
  MapPin,
  Paperclip,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Gavel,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConsultationStore } from '@/stores/consultation.store';
import { useAuthStore } from '@/stores/auth.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  getCategoryLabel,
  getStatusLabel,
  getUrgencyLabel,
  formatDate,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import type {
  Consultation,
  ConsultationDraft,
  ConsultationStatus,
  MatchedLawyer,
  DispatchBasis,
  DisputeStage,
  Lawyer,
} from '@/types';

type TabKey = 'all' | 'drafts' | 'pending' | 'matched' | 'chatting' | 'closed' | 'reviewed';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'drafts', label: '草稿箱' },
  { key: 'pending', label: '待分派' },
  { key: 'matched', label: '已匹配' },
  { key: 'chatting', label: '咨询中' },
  { key: 'closed', label: '已结案' },
  { key: 'reviewed', label: '已评价' },
];

const statusConfig: Record<
  ConsultationStatus,
  { label: string; className: string; dotClass: string; variant: 'pending' | 'info' | 'success' | 'warning' | 'default' }
> = {
  pending: {
    label: '待分派',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    variant: 'pending',
  },
  matched: {
    label: '已匹配',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    variant: 'info',
  },
  chatting: {
    label: '咨询中',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    variant: 'info',
  },
  closed: {
    label: '已结案',
    className: 'bg-green-50 text-green-700 border-green-200',
    dotClass: 'bg-green-500',
    variant: 'success',
  },
  reviewed: {
    label: '已评价',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    variant: 'default',
  },
};

const urgencyConfig: Record<string, { label: string; className: string; variant: 'success' | 'warning' | 'danger' }> = {
  low: { label: '低', className: 'text-green-600 bg-green-50', variant: 'success' },
  medium: { label: '中', className: 'text-amber-600 bg-amber-50', variant: 'warning' },
  high: { label: '高', className: 'text-red-600 bg-red-50', variant: 'danger' },
};

const disputeStageLabels: Record<DisputeStage, string> = {
  evaluation: '纠纷评估中',
  appeal: '申诉处理中',
  arbitration: '平台仲裁中',
  resolved: '纠纷已解决',
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

interface DispatchBasisModalProps {
  open: boolean;
  onClose: () => void;
  consultation: Consultation | null;
  basis: DispatchBasis | undefined;
  onAssign: (consultationId: string, lawyerId: string) => void;
}

function DispatchBasisModal({
  open,
  onClose,
  consultation,
  basis,
  onAssign,
}: DispatchBasisModalProps) {
  if (!consultation || !basis) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="律师分派依据"
      width="max-w-2xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-base font-semibold text-primary-800">综合匹配度</h4>
            <div className="flex items-center gap-2">
              <div className="relative h-2 w-32 overflow-hidden rounded-full bg-primary-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${basis.overallScore}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500"
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="font-serif text-lg font-bold text-amber-600">
                {basis.overallScore}分
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg bg-white p-3 border border-primary-50">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  basis.caseCategoryMatch
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">案由匹配</p>
                <p className="text-xs text-primary-500">{basis.caseCategoryLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white p-3 border border-primary-50">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  basis.regionMatch
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">地域匹配</p>
                <p className="text-xs text-primary-500">{basis.regionLabel || '未指定'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white p-3 border border-primary-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">专长匹配</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {basis.specialtyMatches.length > 0 ? (
                    basis.specialtyMatches.map((s) => (
                      <span
                        key={s.category}
                        className="text-xs text-primary-500"
                      >
                        {s.label}({s.score}分)
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-primary-400">暂无</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-base font-semibold text-primary-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            推荐律师列表
          </h4>
          <div className="space-y-3">
            {basis.recommendedLawyers.map((lawyer, index) => (
              <motion.div
                key={lawyer.lawyerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-primary-100 bg-white p-4 transition-all hover:border-amber-300/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      {lawyer.avatar ? (
                        <img
                          src={lawyer.avatar}
                          alt={lawyer.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-lg font-semibold text-primary-900">
                          {lawyer.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-primary-800">{lawyer.name} 律师</p>
                        {index === 0 && (
                          <Badge variant="warning" className="bg-amber-100 text-amber-700">
                            <Award className="h-3 w-3 mr-0.5" />
                            最佳匹配
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-primary-500 mt-0.5 truncate">
                        {lawyer.firmName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-0.5 text-xs text-primary-500">
                          <Clock className="h-3 w-3" />
                          {lawyer.practiceYears}年经验
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-primary-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {lawyer.averageRating}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-primary-500">
                          <MessageCircle className="h-3 w-3" />
                          {lawyer.consultationCount}次
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lawyer.specialtyLabels.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 border border-primary-100"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-primary-400">匹配度</p>
                      <p className="font-serif text-xl font-bold text-amber-600">
                        {lawyer.matchScore}
                      </p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      onClick={() => {
                        onAssign(consultation.id, lawyer.lawyerId);
                        onClose();
                      }}
                    >
                      指派律师
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface DraftCardProps {
  draft: ConsultationDraft;
  onClick: () => void;
}

function DraftCard({ draft, onClick }: DraftCardProps) {
  const urgency = draft.urgency ? urgencyConfig[draft.urgency] : null;

  return (
    <motion.div
      variants={fadeInUp}
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-xl border border-primary-100/50 bg-white p-5 cursor-pointer relative overflow-hidden border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" className="bg-slate-100 text-slate-700">
            <FileText className="h-3 w-3 mr-1" />
            草稿
          </Badge>
          <Badge variant="default" className="bg-amber-50 text-amber-700 border-amber-200">
            {draft.draftNumber}
          </Badge>
          {draft.category && (
            <Badge variant="default">
              {getCategoryLabel(draft.category)}
            </Badge>
          )}
          {urgency && draft.urgency !== 'low' && (
            <Badge variant={urgency.variant}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {urgency.label}紧急
            </Badge>
          )}
        </div>
        <span className="text-xs text-primary-400 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {formatDate(draft.updatedAt)}
        </span>
      </div>

      <h3 className="font-serif text-lg font-semibold text-primary-800 mb-1.5">
        {draft.title || '（未填写标题）'}
      </h3>
      <p className="text-sm text-primary-500 mb-4 line-clamp-2">
        {draft.description || '（未填写详情描述）'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-primary-100/50">
        <div className="flex items-center gap-4 text-sm text-primary-500 flex-wrap">
          {(draft.province || draft.city) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {[draft.province, draft.city].filter(Boolean).join(' ')}
            </span>
          )}
          {draft.evidenceFiles.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              {draft.evidenceFiles.length}个证据文件
            </span>
          )}
        </div>
        <Button variant="gold" size="sm" rightIcon={<Edit3 className="w-3.5 h-3.5" />}>
          继续编辑
        </Button>
      </div>
    </motion.div>
  );
}

interface ConsultationCardProps {
  consultation: Consultation;
  onClick: () => void;
  onViewDispatch: () => void;
}

function ConsultationCard({
  consultation,
  onClick,
  onViewDispatch,
}: ConsultationCardProps) {
  const navigate = useNavigate();
  const { getLawyerById } = useLawyerStore();
  const status = statusConfig[consultation.status];
  const urgency = urgencyConfig[consultation.urgency];
  const lawyer = consultation.lawyerId
    ? getLawyerById(consultation.lawyerId)
    : null;
  const basis = consultation.dispatchBasis;
  const topLawyers = basis?.recommendedLawyers.slice(0, 3) || [];

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-click]')) return;
    onClick();
  };

  const handleLegalOpinionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/legal-opinion/${consultation.id}`);
  };

  const renderLawyerInfo = () => {
    if (lawyer) {
      const lawyerInitial = (lawyer as Lawyer & { realName?: string; nickname?: string }).realName
        ? (lawyer as Lawyer & { realName?: string }).realName.charAt(0)
        : 'L';
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
            {lawyerInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary-800 truncate">
              {(lawyer as Lawyer & { realName?: string; nickname?: string }).realName ||
                (lawyer as Lawyer & { realName?: string; nickname?: string }).nickname ||
                '律师'}
            </p>
            <p className="text-xs text-primary-400 truncate">
              {(lawyer.specialties || []).slice(0, 2).map((s) => getCategoryLabel(s)).join(' · ')}
            </p>
          </div>
        </div>
      );
    }

    if (consultation.status === 'matched' && !lawyer) {
      return (
        <div className="flex items-center gap-2 text-primary-500" data-no-click>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDispatch();
            }}
            className="flex items-center gap-1.5 text-sm hover:text-amber-600 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>已匹配待指派，点击查看匹配详情</span>
          </button>
        </div>
      );
    }

    if (consultation.status === 'pending') {
      return (
        <div className="flex items-center gap-1.5 text-sm text-primary-400">
          <Clock className="h-4 w-4" />
          <span>智能匹配中...</span>
        </div>
      );
    }

    return null;
  };

  const renderEvaluationSection = () => {
    if (!consultation.evaluation) return null;
    const evaluation = consultation.evaluation;
    const stages: DisputeStage[] = ['evaluation', 'appeal', 'arbitration', 'resolved'];
    const currentStageIndex = evaluation.disputeStage
      ? stages.indexOf(evaluation.disputeStage)
      : -1;

    return (
      <div
        data-no-click
        className="mt-3 rounded-lg border border-green-100 bg-green-50/50 p-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {evaluation.isComplaint ? (
              <Gavel className="h-4 w-4 text-amber-500" />
            ) : (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-3.5 w-3.5',
                    s <= evaluation.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-primary-700">
              {evaluation.rating}分
            </span>
            {evaluation.isComplaint && (
              <Badge variant="warning" className="text-xs">
                纠纷投诉
              </Badge>
            )}
          </div>
        </div>
        {evaluation.isComplaint && evaluation.disputeStage && (
          <div className="mt-3 flex items-center gap-1">
            {stages.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-1">
                <div
                  className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium border',
                    idx <= currentStageIndex
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-400 border-gray-200'
                  )}
                >
                  {idx < currentStageIndex ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] whitespace-nowrap',
                    idx <= currentStageIndex
                      ? 'text-primary-700 font-medium'
                      : 'text-gray-400'
                  )}
                >
                  {disputeStageLabels[stage]}
                </span>
                {idx < stages.length - 1 && (
                  <div
                    className={cn(
                      'h-px w-4 shrink-0',
                      idx < currentStageIndex ? 'bg-amber-400' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLegalOpinionEntry = () => {
    if (!consultation.legalOpinion) return null;
    return (
      <div
        data-no-click
        onClick={handleLegalOpinionClick}
        className="mt-3 rounded-lg border border-green-200 bg-emerald-50 p-3 cursor-pointer hover:bg-emerald-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800">
              查看法律意见书
            </p>
            <p className="text-xs text-emerald-600 truncate">
              {consultation.legalOpinion.title}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0" />
        </div>
      </div>
    );
  };

  const renderDispatchPanel = () => {
    if (consultation.status !== 'pending') return null;

    return (
      <div
        data-no-click
        className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3"
      >
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-amber-200 shrink-0">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                style={{
                  width: basis ? `${basis.overallScore}%` : '60%',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-amber-700">
              匹配度 {basis ? basis.overallScore : '--'}%
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {basis?.specialtyMatches.slice(0, 2).map((s) => (
                <Badge
                  key={s.category}
                  variant="warning"
                  className="bg-amber-100 text-amber-700 text-[10px] py-0"
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-2">
            {topLawyers.length > 0 ? (
              topLawyers.map((l) => (
                <div
                  key={l.lawyerId}
                  className="relative h-7 w-7 rounded-full border-2 border-amber-50 bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center text-[11px] font-semibold text-primary-900"
                  title={l.name}
                >
                  {l.name.charAt(0)}
                </div>
              ))
            ) : (
              <div className="h-7 w-7 rounded-full border-2 border-amber-50 bg-amber-200 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-amber-600" />
              </div>
            )}
            {topLawyers.length > 0 && (
              <span className="text-xs text-amber-600 ml-3 font-medium">
                {topLawyers.length}位候选
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDispatch();
            }}
            className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors shrink-0"
          >
            查看匹配详情
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={fadeInUp}
      layout
      whileHover={{ y: -2 }}
      onClick={handleCardClick}
      className="rounded-xl border border-primary-100/50 bg-white p-5 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
          <Badge variant="default">
            {getCategoryLabel(consultation.category)}
          </Badge>
          {consultation.urgency !== 'low' && (
            <Badge variant={urgency.variant}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {urgency.label}紧急
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {consultation.hasUnread && consultation.unreadCount && consultation.unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-medium">
              {consultation.unreadCount}
            </span>
          )}
          <span className="text-xs text-primary-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(consultation.lastMessageTime || consultation.updatedAt)}
          </span>
        </div>
      </div>

      <h3 className="font-serif text-lg font-semibold text-primary-800 mb-1.5">
        {consultation.title}
      </h3>
      <p className="text-sm text-primary-500 line-clamp-2">
        {consultation.lastMessage || consultation.description}
      </p>

      {renderDispatchPanel()}
      {renderLegalOpinionEntry()}
      {renderEvaluationSection()}

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary-100/50">
        <div className="min-w-0 flex-1 pr-3">
          {renderLawyerInfo()}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-600">
            <Shield className="h-3 w-3" />
            <span className="text-[10px] font-medium">加密会话</span>
          </div>
          <ChevronRight className="h-4 w-4 text-primary-300" />
        </div>
      </div>
    </motion.div>
  );
}

interface EmptyStateProps {
  activeTab: TabKey;
}

function EmptyState({ activeTab }: EmptyStateProps) {
  const emptyMessages: Record<TabKey, { title: string; desc: string }> = {
    all: {
      title: '暂无咨询记录',
      desc: '开始您的第一次法律咨询，专业律师将为您保驾护航',
    },
    drafts: {
      title: '暂无草稿',
      desc: '您可以将咨询内容保存为草稿，稍后继续编辑',
    },
    pending: {
      title: '暂无待分派咨询',
      desc: '提交咨询后，系统将自动为您匹配最合适的律师',
    },
    matched: {
      title: '暂无已匹配咨询',
      desc: '匹配完成后，您可以在这里查看并指派律师',
    },
    chatting: {
      title: '暂无咨询中案件',
      desc: '指派律师后，您可以进入加密会话开始咨询',
    },
    closed: {
      title: '暂无已结案咨询',
      desc: '咨询完成后，案件将归档到这里',
    },
    reviewed: {
      title: '暂无已评价咨询',
      desc: '评价完成的咨询服务将保存在这里',
    },
  };

  const msg = emptyMessages[activeTab];

  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary-100/50 blur-xl scale-110" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
          <Inbox className="h-10 w-10 text-primary-300" />
        </div>
      </div>
      <h3 className="font-serif text-xl font-semibold text-primary-800 mb-2">
        {msg.title}
      </h3>
      <p className="text-sm text-primary-500 text-center max-w-sm">
        {msg.desc}
      </p>
    </motion.div>
  );
}

export default function ConsultationListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [currentBasis, setCurrentBasis] = useState<DispatchBasis | undefined>(
    undefined
  );

  const {
    consultations,
    drafts,
    fetchConsultations,
    fetchDrafts,
    getConsultationsByUser,
    getDraftsByUser,
    assignLawyer,
    getOrCreateDispatchBasis,
  } = useConsultationStore();

  const { getCurrentUserId } = useAuthStore();

  useEffect(() => {
    fetchConsultations();
    fetchDrafts();
  }, [fetchConsultations, fetchDrafts]);

  const userId = getCurrentUserId();
  const userConsultations = useMemo(
    () => getConsultationsByUser(userId),
    [consultations, userId, getConsultationsByUser]
  );
  const userDrafts = useMemo(
    () => getDraftsByUser(userId),
    [drafts, userId, getDraftsByUser]
  );

  const filteredConsultations = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return userConsultations.filter((c) => c.status === 'pending');
      case 'matched':
        return userConsultations.filter((c) => c.status === 'matched');
      case 'chatting':
        return userConsultations.filter((c) => c.status === 'chatting');
      case 'closed':
        return userConsultations.filter((c) => c.status === 'closed');
      case 'reviewed':
        return userConsultations.filter((c) => c.status === 'reviewed');
      default:
        return userConsultations;
    }
  }, [activeTab, userConsultations]);

  const tabCounts: Record<TabKey, number> = {
    all: userConsultations.length,
    drafts: userDrafts.length,
    pending: userConsultations.filter((c) => c.status === 'pending').length,
    matched: userConsultations.filter((c) => c.status === 'matched').length,
    chatting: userConsultations.filter((c) => c.status === 'chatting').length,
    closed: userConsultations.filter((c) => c.status === 'closed').length,
    reviewed: userConsultations.filter((c) => c.status === 'reviewed').length,
  };

  const handleViewDispatch = (consultation: Consultation) => {
    const basis = getOrCreateDispatchBasis(consultation.id);
    setSelectedConsultation(consultation);
    setCurrentBasis(basis);
    setModalOpen(true);
  };

  const handleAssign = (consultationId: string, lawyerId: string) => {
    assignLawyer(consultationId, lawyerId);
    navigate(`/consultation/${consultationId}`);
  };

  const handleDraftClick = (draft: ConsultationDraft) => {
    navigate(`/submit?draftId=${draft.id}`);
  };

  const handleConsultationClick = (consultation: Consultation) => {
    navigate(`/consultation/${consultation.id}`);
  };

  const showDrafts = activeTab === 'drafts';
  const displayItems = showDrafts ? userDrafts : filteredConsultations;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-primary-50/20">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary-900 sm:text-3xl">
              我的咨询
            </h1>
            <p className="mt-1 text-sm text-primary-500">
              管理您的法律咨询记录和草稿
            </p>
          </div>
          <Button
            variant="gold"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/submit')}
          >
            发起咨询
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-900 text-white shadow-md'
                      : 'bg-white text-primary-600 border border-primary-100 hover:border-primary-200 hover:bg-primary-50'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold px-1.5',
                      isActive
                        ? 'bg-white/20 text-white'
                        : count > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary-100 text-primary-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {displayItems.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              <>
                {showDrafts
                  ? userDrafts.map((draft) => (
                      <DraftCard
                        key={draft.id}
                        draft={draft}
                        onClick={() => handleDraftClick(draft)}
                      />
                    ))
                  : filteredConsultations.map((consultation) => (
                      <ConsultationCard
                        key={consultation.id}
                        consultation={consultation}
                        onClick={() => handleConsultationClick(consultation)}
                        onViewDispatch={() => handleViewDispatch(consultation)}
                      />
                    ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <DispatchBasisModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        consultation={selectedConsultation}
        basis={currentBasis}
        onAssign={handleAssign}
      />
    </div>
  );
}
