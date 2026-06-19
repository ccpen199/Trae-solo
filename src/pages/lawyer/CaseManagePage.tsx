import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  MessageCircle,
  FileText,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Sparkles,
  ArrowRight,
  Inbox,
  Briefcase,
  FolderCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/ui/Empty';
import { useConsultationStore } from '@/stores/consultation.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { getCategoryLabel, getStatusLabel, formatDate } from '@/utils/format';
import { timeAgo } from '@/utils/date';
import type { Consultation, Lawyer, ChatMessage, ServiceEvaluation } from '@/types';
import { mockEvaluations, mockUsers } from '@/mock/data';
import { cn } from '@/lib/utils';

type TabType = 'pending' | 'ongoing' | 'closed';

interface CaseWithDetails extends Consultation {
  userNickname?: string;
  userAvatar?: string;
  lastMessage?: ChatMessage;
  evaluation?: ServiceEvaluation;
  remainingTime?: number;
}

export default function CaseManagePage() {
  const navigate = useNavigate();
  const { getConsultationsByLawyer, updateConsultationStatus } = useConsultationStore();
  const { lawyers, getLawyerById } = useLawyerStore();
  const { currentUser, role } = useAuthStore();
  const { messages } = useChatStore();

  const [activeTab, setActiveTab] = useState<TabType>('ongoing');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLawyer = useMemo(() => {
    if (role === 'lawyer' && currentUser) {
      return getLawyerById((currentUser as Lawyer).id) || (currentUser as Lawyer);
    }
    return lawyers.find((l) => l.verifyStatus === 'approved') || null;
  }, [currentUser, role, getLawyerById, lawyers]);

  const lawyerCases = useMemo(() => {
    if (!currentLawyer) return [];
    return getConsultationsByLawyer(currentLawyer.id);
  }, [currentLawyer, getConsultationsByLawyer]);

  const enrichCase = useCallback(
    (c: Consultation): CaseWithDetails => {
      const user = mockUsers.find((u) => u.id === c.userId);
      const caseMessages = messages[c.id] || [];
      const lastMessage = caseMessages.length > 0 ? caseMessages[caseMessages.length - 1] : undefined;
      const evaluation = mockEvaluations.find((e) => e.consultationId === c.id);

      let remainingTime: number | undefined;
      if (c.status === 'matched' && c.matchedAt) {
        const matchedTime = new Date(c.matchedAt).getTime();
        const deadline = matchedTime + 30 * 60 * 1000;
        remainingTime = Math.max(0, deadline - now);
      }

      return {
        ...c,
        userNickname: user?.nickname || user?.realName || '匿名用户',
        userAvatar: user?.avatar,
        lastMessage,
        evaluation,
        remainingTime,
      };
    },
    [messages, now]
  );

  const enrichedCases = useMemo(
    () => lawyerCases.map(enrichCase),
    [lawyerCases, enrichCase]
  );

  const pendingCases = useMemo(
    () => enrichedCases.filter((c) => c.status === 'matched'),
    [enrichedCases]
  );

  const ongoingCases = useMemo(
    () => enrichedCases.filter((c) => c.status === 'chatting'),
    [enrichedCases]
  );

  const closedCases = useMemo(
    () => enrichedCases.filter((c) => c.status === 'closed' || c.status === 'reviewed'),
    [enrichedCases]
  );

  const getActiveCases = () => {
    switch (activeTab) {
      case 'pending':
        return pendingCases;
      case 'ongoing':
        return ongoingCases;
      case 'closed':
        return closedCases;
    }
  };

  const formatRemainingTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleAccept = (caseItem: CaseWithDetails) => {
    updateConsultationStatus(caseItem.id, 'chatting');
  };

  const handleReject = (caseItem: CaseWithDetails) => {
    updateConsultationStatus(caseItem.id, 'pending');
  };

  const handleContinue = (caseItem: CaseWithDetails) => {
    navigate(`/consultation/${caseItem.id}`);
  };

  const handleGenerateOpinion = (caseItem: CaseWithDetails) => {
    navigate(`/lawyer-opinion/${caseItem.id}`);
  };

  const handleViewDetail = (caseItem: CaseWithDetails) => {
    navigate(`/consultation/${caseItem.id}`);
  };

  const TabButton = ({
    type,
    label,
    count,
    icon: Icon,
  }: {
    type: TabType;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={cn(
        'flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
        activeTab === type
          ? 'bg-white text-primary-800 shadow-sm'
          : 'text-primary-500 hover:text-primary-700'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          activeTab === type && type === 'pending' && 'text-amber-500',
          activeTab === type && type === 'ongoing' && 'text-primary-600',
          activeTab === type && type === 'closed' && 'text-emerald-500'
        )}
      />
      {label}
      <span
        className={cn(
          'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
          activeTab === type
            ? 'bg-primary-100 text-primary-700'
            : 'bg-primary-50 text-primary-500'
        )}
      >
        {count}
      </span>
    </button>
  );

  const PendingCaseCard = ({ caseItem }: { caseItem: CaseWithDetails }) => {
    const isUrgent = caseItem.remainingTime !== undefined && caseItem.remainingTime < 5 * 60 * 1000;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <Card hover={true} shadow={true} bordered={true}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">{getCategoryLabel(caseItem.category)}</Badge>
                <Badge variant={isUrgent ? 'danger' : 'warning'} dot>
                  待响应
                </Badge>
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                  isUrgent
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                )}
              >
                <Clock className={cn('h-3.5 w-3.5', isUrgent && 'animate-pulse')} />
                <span className="font-mono text-sm font-semibold">
                  {caseItem.remainingTime !== undefined
                    ? formatRemainingTime(caseItem.remainingTime)
                    : '--:--'}
                </span>
              </div>
            </div>

            <h3 className="font-serif text-lg font-semibold text-primary-900 mb-2">
              {caseItem.title}
            </h3>

            <p className="text-sm leading-relaxed text-primary-500 line-clamp-2 mb-4">
              {caseItem.description}
            </p>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-primary-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800">{caseItem.userNickname}</p>
                  <p className="text-xs text-primary-400">
                    {caseItem.region || '未知地区'} · {timeAgo(caseItem.createdAt)}发布
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                size="md"
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => handleReject(caseItem)}
                className="flex-1"
              >
                拒绝
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleAccept(caseItem)}
                className="flex-1"
              >
                接受咨询
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const OngoingCaseCard = ({ caseItem }: { caseItem: CaseWithDetails }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <Card hover={true} shadow={true} bordered={true}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">{getCategoryLabel(caseItem.category)}</Badge>
              <Badge variant="success" dot>
                {getStatusLabel(caseItem.status)}
              </Badge>
            </div>
            <span className="text-xs text-primary-400">
              {caseItem.matchedAt ? `匹配于 ${formatDate(caseItem.matchedAt, 'MM-DD HH:mm')}` : ''}
            </span>
          </div>

          <h3 className="font-serif text-lg font-semibold text-primary-900 mb-2">
            {caseItem.title}
          </h3>

          <div className="mb-4 rounded-lg bg-primary-50/60 p-3 border border-primary-100/50">
            <div className="flex items-start gap-2">
              <MessageCircle className="h-4 w-4 text-primary-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-primary-400 mb-0.5">
                  {caseItem.lastMessage
                    ? caseItem.lastMessage.senderRole === 'lawyer'
                      ? '我'
                      : caseItem.userNickname
                    : '暂无消息'}
                  {caseItem.lastMessage && (
                    <span className="ml-1">· {formatDate(caseItem.lastMessage.createdAt, 'HH:mm')}</span>
                  )}
                </p>
                <p className="text-sm text-primary-600 line-clamp-1">
                  {caseItem.lastMessage?.content || '开始咨询，与用户沟通了解案件详情'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800">{caseItem.userNickname}</p>
                <p className="text-xs text-primary-400">
                  {caseItem.evidenceFiles.length > 0
                    ? `${caseItem.evidenceFiles.length} 份证据材料`
                    : '暂无证据材料'}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => handleContinue(caseItem)}
            >
              继续咨询
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ClosedCaseCard = ({ caseItem }: { caseItem: CaseWithDetails }) => {
    const hasOpinion = false;
    const hasEvaluation = !!caseItem.evaluation;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <Card hover={true} shadow={true} bordered={true}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">{getCategoryLabel(caseItem.category)}</Badge>
                <Badge variant="default" dot>
                  {getStatusLabel(caseItem.status)}
                </Badge>
              </div>
              <span className="text-xs text-primary-400">
                {caseItem.closedAt ? `结案于 ${formatDate(caseItem.closedAt, 'YYYY-MM-DD')}` : ''}
              </span>
            </div>

            <h3 className="font-serif text-lg font-semibold text-primary-900 mb-3">
              {caseItem.title}
            </h3>

            <div className="mb-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <FileText
                  className={cn(
                    'h-4 w-4',
                    hasOpinion ? 'text-emerald-500' : 'text-primary-400'
                  )}
                />
                <span className="text-sm text-primary-600">法律意见：</span>
                <Badge variant={hasOpinion ? 'success' : 'warning'}>
                  {hasOpinion ? '已生成' : '待生成'}
                </Badge>
              </div>

              {hasEvaluation && caseItem.evaluation && (
                <div className="rounded-lg bg-primary-50/60 p-3 border border-primary-100/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i <= (caseItem.evaluation?.rating || 0)
                              ? 'text-accent-gold fill-accent-gold'
                              : 'text-primary-200'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-primary-500">用户评价</span>
                    {caseItem.evaluation.isComplaint && (
                      <Badge variant="danger">投诉</Badge>
                    )}
                  </div>
                  {caseItem.evaluation.content && (
                    <p className="text-sm text-primary-500 line-clamp-2">
                      "{caseItem.evaluation.content}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-primary-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-primary-800">
                  {caseItem.userNickname}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  onClick={() => handleViewDetail(caseItem)}
                >
                  查看详情
                </Button>
                {!hasOpinion ? (
                  <Button
                    variant="gold"
                    size="sm"
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => handleGenerateOpinion(caseItem)}
                  >
                    生成意见
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                    onClick={() => handleGenerateOpinion(caseItem)}
                  >
                    查看意见
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderEmpty = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <Empty
            title="暂无待响应案件"
            description="您当前没有需要响应的咨询，请前往抢单大厅获取新案件"
            icon={<Inbox className="h-12 w-12 text-primary-400" strokeWidth={1.5} />}
            action={
              <Button variant="primary" onClick={() => navigate('/lawyer/grab-hall')}>
                前往抢单大厅
              </Button>
            }
          />
        );
      case 'ongoing':
        return (
          <Empty
            title="暂无进行中案件"
            description="您当前没有正在进行的咨询"
            icon={<Briefcase className="h-12 w-12 text-primary-400" strokeWidth={1.5} />}
          />
        );
      case 'closed':
        return (
          <Empty
            title="暂无已结案案件"
            description="完成咨询并结案后，案件将显示在这里"
            icon={<FolderCheck className="h-12 w-12 text-primary-400" strokeWidth={1.5} />}
          />
        );
    }
  };

  const activeCases = getActiveCases();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-900 mb-1">我的案件</h1>
        <p className="text-sm text-primary-500">管理您承接的所有法律咨询案件</p>
      </div>

      <Card shadow={true} bordered={true} className="mb-5">
        <CardContent className="p-1.5">
          <div className="flex items-center gap-1 rounded-lg bg-primary-50/60">
            <TabButton type="pending" label="待响应" count={pendingCases.length} icon={AlertTriangle} />
            <TabButton type="ongoing" label="进行中" count={ongoingCases.length} icon={MessageCircle} />
            <TabButton type="closed" label="已结案" count={closedCases.length} icon={FolderCheck} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {activeCases.length === 0 ? (
            renderEmpty()
          ) : (
            activeCases.map((caseItem) => (
              <div key={caseItem.id}>
                {activeTab === 'pending' && <PendingCaseCard caseItem={caseItem} />}
                {activeTab === 'ongoing' && <OngoingCaseCard caseItem={caseItem} />}
                {activeTab === 'closed' && <ClosedCaseCard caseItem={caseItem} />}
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
