import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  AlertTriangle,
  Scale,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  Gavel,
  ClipboardList,
  User,
} from 'lucide-react';
import StatCard from '@/components/features/StatCard';
import ProcessTimeline from '@/components/features/ProcessTimeline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminStore } from '@/stores/admin.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import type { ServiceEvaluation, DisputeStage } from '@/types';
import { formatDate } from '@/utils/format';
import { timeAgo } from '@/utils/date';
import { cn } from '@/lib/utils';

type DisputeTab = 'evaluation' | 'appeal' | 'arbitration';

const disputeTabConfig: {
  key: DisputeTab;
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { key: 'evaluation', label: '服务评价（全部）', icon: MessageSquare },
  { key: 'appeal', label: '申诉处理', icon: AlertTriangle },
  { key: 'arbitration', label: '仲裁裁决', icon: Scale },
];

const appealStatusLabels: Record<string, { label: string; variant: 'default' | 'pending' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending_mediation: { label: '待调解', variant: 'pending' },
  mediating: { label: '调解中', variant: 'warning' },
  mediated: { label: '已调解', variant: 'success' },
  to_arbitration: { label: '转仲裁', variant: 'danger' },
};

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i <= rating
              ? 'text-accent-gold fill-accent-gold'
              : 'text-primary-200'
          )}
        />
      ))}
    </div>
  );
}

interface DisputeRowProps {
  evaluation: ServiceEvaluation;
  index: number;
  tabKey: DisputeTab;
  onUpdateStage: (id: string, stage: DisputeStage) => void;
}

function DisputeRow({ evaluation, index, tabKey, onUpdateStage }: DisputeRowProps) {
  const { lawyers } = useLawyerStore();
  const [expanded, setExpanded] = useState(false);
  const [arbitrationModalOpen, setArbitrationModalOpen] = useState(false);
  const [mediationNote, setMediationNote] = useState('');
  const [arbitrationResult, setArbitrationResult] = useState('');
  const [arbitrationCommittee, setArbitrationCommittee] = useState('');
  const [mediationModalOpen, setMediationModalOpen] = useState(false);

  const lawyer = lawyers.find((l) => l.id === evaluation.lawyerId);

  const isComplaintOrLowRating = evaluation.isComplaint || evaluation.rating <= 2;

  const getAppealStatus = () => {
    if (!evaluation.disputeStage || evaluation.disputeStage === 'evaluation') {
      return appealStatusLabels.pending_mediation;
    }
    if (evaluation.disputeStage === 'appeal') {
      return appealStatusLabels.mediating;
    }
    if (evaluation.disputeStage === 'arbitration') {
      return appealStatusLabels.to_arbitration;
    }
    if (evaluation.disputeStage === 'resolved') {
      return appealStatusLabels.mediated;
    }
    return appealStatusLabels.pending_mediation;
  };

  const handleMediationSave = () => {
    if (mediationNote.trim()) {
      onUpdateStage(evaluation.id, 'resolved');
      setMediationModalOpen(false);
      setMediationNote('');
    }
  };

  const handleToArbitration = () => {
    onUpdateStage(evaluation.id, 'arbitration');
  };

  const handleArbitrationSave = () => {
    if (arbitrationResult.trim() && arbitrationCommittee.trim()) {
      onUpdateStage(evaluation.id, 'resolved');
      setArbitrationModalOpen(false);
      setArbitrationResult('');
      setArbitrationCommittee('');
    }
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'transition-colors duration-200 cursor-pointer',
          isComplaintOrLowRating && 'bg-red-50/30 hover:bg-red-50/60',
          !isComplaintOrLowRating && 'hover:bg-primary-50/30'
        )}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-primary-800">
                用户{evaluation.userId.split('-')[1]}
              </p>
              <p className="text-xs text-primary-400">
                {timeAgo(evaluation.createdAt)}
              </p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="text-sm text-primary-800">
            律师{evaluation.lawyerId.split('-')[1]}
          </p>
          {lawyer && (
            <p className="text-xs text-primary-400">{lawyer.firmName}</p>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">{renderStars(evaluation.rating)}</td>
        <td className="px-6 py-4">
          <p className="text-sm text-primary-600 max-w-xs truncate">
            {evaluation.content || '（无评价内容）'}
          </p>
          {isComplaintOrLowRating && (
            <Badge variant="danger" dot className="mt-1">
              {evaluation.isComplaint ? '投诉' : '差评'}
            </Badge>
          )}
        </td>
        {tabKey !== 'evaluation' && (
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={getAppealStatus().variant} dot>
              {getAppealStatus().label}
            </Badge>
          </td>
        )}
        {tabKey === 'arbitration' && (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
            北京市仲裁委员会
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <td colSpan={tabKey === 'arbitration' ? 7 : tabKey === 'evaluation' ? 6 : 6} className="px-6 pb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ProcessTimeline
                      stages={evaluation.disputeStage || 'evaluation'}
                      disputedAt={evaluation.disputedAt}
                      resolvedAt={evaluation.resolvedAt}
                    />
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="flex items-center gap-2 font-medium text-primary-800 mb-3">
                          <FileText className="w-4 h-4 text-accent-gold-dark" />
                          咨询摘要
                        </h4>
                        <p className="text-sm text-primary-600 leading-relaxed">
                          关于咨询案件 {evaluation.consultationId}
                          的法律服务。用户在咨询过程中对律师服务质量提出异议。
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="flex items-center gap-2 font-medium text-primary-800 mb-3">
                          <MessageCircle className="w-4 h-4 text-primary-600" />
                          评价内容
                        </h4>
                        <p className="text-sm text-primary-600 leading-relaxed">
                          {evaluation.content || '用户未填写评价内容'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-primary-100/50">
                          <p className="text-xs text-primary-400 mb-1">申诉内容</p>
                          <p className="text-sm text-primary-600">
                            {evaluation.isComplaint
                              ? '用户认为律师服务态度消极，响应不及时，未解决实际问题，要求平台介入处理。'
                              : '无申诉'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="flex items-center gap-2 font-medium text-primary-800 mb-3">
                          <ClipboardList className="w-4 h-4 text-primary-600" />
                          举证材料
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-primary-50/50">
                            <span className="text-sm text-primary-600">
                              <FileText className="w-4 h-4 inline mr-2 text-primary-400" />
                              聊天记录截图_20240115.png
                            </span>
                            <Badge variant="info">用户举证</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-primary-50/50">
                            <span className="text-sm text-primary-600">
                              <FileText className="w-4 h-4 inline mr-2 text-primary-400" />
                              律师服务日志.pdf
                            </span>
                            <Badge variant="default">律师举证</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {(tabKey === 'appeal' || tabKey === 'arbitration') && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="flex items-center gap-2 font-medium text-primary-800 mb-3">
                            <Gavel className="w-4 h-4 text-primary-600" />
                            处理操作
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                            >
                              协商记录
                            </Button>
                            {tabKey === 'appeal' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  leftIcon={<Scale className="w-3.5 h-3.5" />}
                                  onClick={() => setMediationModalOpen(true)}
                                >
                                  调解
                                </Button>
                                <Button
                                  size="sm"
                                  variant="gold"
                                  leftIcon={<Gavel className="w-3.5 h-3.5" />}
                                  onClick={handleToArbitration}
                                >
                                  转仲裁
                                </Button>
                              </>
                            )}
                            {tabKey === 'arbitration' && (
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                onClick={() => setArbitrationModalOpen(true)}
                              >
                                仲裁裁决
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>

      <Modal
        open={mediationModalOpen}
        onClose={() => setMediationModalOpen(false)}
        title="纠纷调解"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMediationModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleMediationSave}
              disabled={!mediationNote.trim()}
            >
              完成调解
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-primary-600">请记录调解内容和结果：</p>
          <textarea
            value={mediationNote}
            onChange={(e) => setMediationNote(e.target.value)}
            placeholder="请输入调解记录和结果说明..."
            className="input-base min-h-[120px] resize-none"
          />
        </div>
      </Modal>

      <Modal
        open={arbitrationModalOpen}
        onClose={() => setArbitrationModalOpen(false)}
        title="仲裁裁决"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setArbitrationModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleArbitrationSave}
              disabled={!arbitrationResult.trim() || !arbitrationCommittee.trim()}
            >
              提交裁决
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              仲裁委员会
            </label>
            <input
              type="text"
              value={arbitrationCommittee}
              onChange={(e) => setArbitrationCommittee(e.target.value)}
              placeholder="请输入仲裁委员会名称"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              裁决结果
            </label>
            <textarea
              value={arbitrationResult}
              onChange={(e) => setArbitrationResult(e.target.value)}
              placeholder="请输入仲裁裁决结果..."
              className="input-base min-h-[120px] resize-none"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function DisputeCenterPage() {
  const { evaluations, fetchEvaluations, updateDisputeStage } = useAdminStore();
  const [activeTab, setActiveTab] = useState<DisputeTab>('evaluation');

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const appealCount = evaluations.filter(
    (e) => e.disputeStage === 'appeal'
  ).length;
  const arbitrationCount = evaluations.filter(
    (e) => e.disputeStage === 'arbitration'
  ).length;
  const resolvedCount = evaluations.filter(
    (e) => e.disputeStage === 'resolved'
  ).length;

  const filteredEvaluations = evaluations.filter((e) => {
    if (activeTab === 'evaluation') return true;
    if (activeTab === 'appeal')
      return e.disputeStage === 'appeal' || e.disputeStage === 'evaluation';
    if (activeTab === 'arbitration') return e.disputeStage === 'arbitration';
    return true;
  });

  const tabCounts = {
    evaluation: evaluations.length,
    appeal: appealCount + evaluations.filter((e) => !e.disputeStage || e.disputeStage === 'evaluation').length,
    arbitration: arbitrationCount,
  };

  return (
    <div className="min-h-screen bg-neutral-warm p-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-primary-800 mb-2">
            纠纷处理中心
          </h1>
          <p className="text-primary-500">处理用户评价、申诉与仲裁案件</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="待处理申诉"
            value={appealCount + 1}
            icon={AlertTriangle}
            trend={3}
            trendLabel="较昨日"
          />
          <StatCard
            label="仲裁中"
            value={arbitrationCount}
            icon={Scale}
            trend={0}
            trendLabel="较昨日"
          />
          <StatCard
            label="已解决"
            value={resolvedCount}
            icon={CheckCircle}
            trend={15}
            trendLabel="较昨日"
          />
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex border-b border-primary-100/50 overflow-x-auto">
              {disputeTabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'text-primary-800'
                        : 'text-primary-400 hover:text-primary-600 hover:bg-primary-50/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <Badge
                      variant={isActive ? 'pending' : 'default'}
                      className="ml-1"
                    >
                      {tabCounts[tab.key]}
                    </Badge>
                    {isActive && (
                      <motion.div
                        layoutId="disputeTabIndicator"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold-gradient rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary-100/50 bg-primary-50/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      律师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      评分
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      评价内容
                    </th>
                    {activeTab !== 'evaluation' && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                        状态
                      </th>
                    )}
                    {activeTab === 'arbitration' && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                        仲裁委
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      展开
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100/50">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTab === 'arbitration' ? 6 : activeTab === 'evaluation' ? 5 : 6}
                        className="px-6 py-16 text-center text-primary-400"
                      >
                        暂无相关纠纷记录
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((evaluation, index) => (
                      <DisputeRow
                        key={evaluation.id}
                        evaluation={evaluation}
                        index={index}
                        tabKey={activeTab}
                        onUpdateStage={updateDisputeStage}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
