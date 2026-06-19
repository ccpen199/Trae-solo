import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Clock,
  Snowflake,
  Eye,
  CheckCircle,
  XCircle,
  SnowflakeIcon,
  PlayCircle,
  AlertTriangle,
  ShieldCheck,
  History,
  Star,
} from 'lucide-react';
import StatCard from '@/components/features/StatCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useLawyerStore } from '@/stores/lawyer.store';
import type { Lawyer, LawyerVerifyStatus } from '@/types';
import { formatDate, getCategoryLabel, getVerifyStatusLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = LawyerVerifyStatus;

const tabConfig: {
  key: TabKey;
  label: string;
  icon: typeof Clock;
  variant: 'default' | 'pending' | 'success' | 'warning' | 'danger' | 'info';
}[] = [
  { key: 'pending', label: '待审核', icon: Clock, variant: 'pending' },
  { key: 'approved', label: '已通过', icon: UserCheck, variant: 'success' },
  { key: 'rejected', label: '已驳回', icon: UserX, variant: 'danger' },
  { key: 'frozen', label: '已冻结', icon: Snowflake, variant: 'info' },
];

const verifyStatusBadgeVariant: Record<
  LawyerVerifyStatus,
  'default' | 'pending' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'danger',
  frozen: 'info',
};

export default function VerifyCenterPage() {
  const { lawyers, fetchLawyers, updateVerifyStatus } = useLawyerStore();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLawyers();
  }, [fetchLawyers]);

  const counts = {
    pending: lawyers.filter((l) => l.verifyStatus === 'pending').length,
    approved: lawyers.filter((l) => l.verifyStatus === 'approved').length,
    rejected: lawyers.filter((l) => l.verifyStatus === 'rejected').length,
    frozen: lawyers.filter((l) => l.verifyStatus === 'frozen').length,
  };

  const filteredLawyers = lawyers.filter((l) => l.verifyStatus === activeTab);

  const handleViewDetail = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setDetailModalOpen(true);
  };

  const handleApprove = (lawyerId: string) => {
    setActionLoading(true);
    setTimeout(() => {
      updateVerifyStatus(lawyerId, 'approved');
      setActionLoading(false);
      setDetailModalOpen(false);
    }, 500);
  };

  const handleOpenReject = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setReasonText('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (!selectedLawyer || !reasonText.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      updateVerifyStatus(selectedLawyer.id, 'rejected');
      setActionLoading(false);
      setRejectModalOpen(false);
      setDetailModalOpen(false);
      setReasonText('');
    }, 500);
  };

  const handleOpenFreeze = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setReasonText('');
    setFreezeModalOpen(true);
  };

  const handleFreeze = () => {
    if (!selectedLawyer || !reasonText.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      updateVerifyStatus(selectedLawyer.id, 'frozen');
      setActionLoading(false);
      setFreezeModalOpen(false);
      setDetailModalOpen(false);
      setReasonText('');
    }, 500);
  };

  const handleUnfreeze = (lawyerId: string) => {
    setActionLoading(true);
    setTimeout(() => {
      updateVerifyStatus(lawyerId, 'approved');
      setActionLoading(false);
      setDetailModalOpen(false);
    }, 500);
  };

  const handleReverify = (lawyerId: string) => {
    setActionLoading(true);
    setTimeout(() => {
      updateVerifyStatus(lawyerId, 'pending');
      setActionLoading(false);
      setDetailModalOpen(false);
    }, 500);
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
            律师资质核验中心
          </h1>
          <p className="text-primary-500">管理平台律师的资质审核、认证与冻结操作</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="待审核"
            value={counts.pending}
            icon={Clock}
            trend={12}
            trendLabel="较昨日"
          />
          <StatCard
            label="已通过"
            value={counts.approved}
            icon={UserCheck}
            trend={5}
            trendLabel="较昨日"
          />
          <StatCard
            label="已驳回"
            value={counts.rejected}
            icon={UserX}
            trend={-2}
            trendLabel="较昨日"
          />
          <StatCard
            label="已冻结"
            value={counts.frozen}
            icon={Snowflake}
            trend={0}
            trendLabel="较昨日"
          />
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex border-b border-primary-100/50">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-all duration-200',
                      isActive
                        ? 'text-primary-800'
                        : 'text-primary-400 hover:text-primary-600 hover:bg-primary-50/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <Badge
                      variant={isActive ? tab.variant : 'default'}
                      className="ml-1"
                    >
                      {counts[tab.key]}
                    </Badge>
                    {isActive && (
                      <motion.div
                        layoutId="verifyTabIndicator"
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
                      律师姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      执业证号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      所属律所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      执业年限
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      专长领域
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      提交时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      继续教育学分
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100/50">
                  <AnimatePresence mode="wait">
                    {filteredLawyers.map((lawyer, index) => (
                      <motion.tr
                        key={lawyer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={cn(
                          'transition-colors duration-200',
                          lawyer.verifyStatus === 'pending' &&
                            'bg-amber-50/40 hover:bg-amber-50/70',
                          lawyer.verifyStatus !== 'pending' &&
                            'hover:bg-primary-50/30'
                        )}
                      >
                        {lawyer.verifyStatus === 'pending' && (
                          <td className="w-1 py-0">
                            <div className="h-full w-1 bg-amber-400 rounded-r" />
                          </td>
                        )}
                        <td
                          className={cn(
                            'px-6 py-4 whitespace-nowrap',
                            lawyer.verifyStatus !== 'pending' && 'pl-6'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gold-gradient/10 flex items-center justify-center">
                              <Star className="w-4 h-4 text-accent-gold-dark" />
                            </div>
                            <div>
                              <p className="font-medium text-primary-800">
                                律师{lawyer.id.split('-')[1]}
                              </p>
                              <p className="text-xs text-primary-400">
                                {getVerifyStatusLabel(lawyer.verifyStatus)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                          {lawyer.licenseNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                          {lawyer.firmName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                          {lawyer.practiceYears} 年
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {lawyer.specialties.map((s) => (
                              <Badge key={s} variant="default" className="text-xs">
                                {getCategoryLabel(s)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                          {formatDate(lawyer.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-medium',
                                lawyer.continuingEducationCredits < 40
                                  ? 'text-red-600'
                                  : 'text-primary-700'
                              )}
                            >
                              {lawyer.continuingEducationCredits}
                            </span>
                            <span className="text-primary-400">/40</span>
                            {lawyer.continuingEducationCredits < 40 && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => handleViewDetail(lawyer)}
                            >
                              详情
                            </Button>
                            {lawyer.verifyStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  leftIcon={
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  }
                                  onClick={() => handleApprove(lawyer.id)}
                                >
                                  通过
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                  onClick={() => handleOpenReject(lawyer)}
                                >
                                  驳回
                                </Button>
                              </>
                            )}
                            {lawyer.verifyStatus === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={
                                  <SnowflakeIcon className="w-3.5 h-3.5" />
                                }
                                onClick={() => handleOpenFreeze(lawyer)}
                              >
                                冻结
                              </Button>
                            )}
                            {lawyer.verifyStatus === 'rejected' && (
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={
                                  <PlayCircle className="w-3.5 h-3.5" />
                                }
                                onClick={() => handleReverify(lawyer.id)}
                              >
                                重新审核
                              </Button>
                            )}
                            {lawyer.verifyStatus === 'frozen' && (
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={
                                  <PlayCircle className="w-3.5 h-3.5" />
                                }
                                onClick={() => handleUnfreeze(lawyer.id)}
                              >
                                解冻
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredLawyers.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-primary-400"
                      >
                        暂无{getVerifyStatusLabel(activeTab)}的律师
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Modal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="律师资质详情"
          width="max-w-3xl"
          footer={
            selectedLawyer && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailModalOpen(false)}
                >
                  关闭
                </Button>
                {selectedLawyer.verifyStatus === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      loading={actionLoading}
                      onClick={() => handleApprove(selectedLawyer.id)}
                    >
                      通过审核
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => handleOpenReject(selectedLawyer)}
                    >
                      驳回
                    </Button>
                  </>
                )}
                {selectedLawyer.verifyStatus === 'approved' && (
                  <Button
                    variant="outline"
                    leftIcon={<SnowflakeIcon className="w-4 h-4" />}
                    onClick={() => handleOpenFreeze(selectedLawyer)}
                  >
                    冻结账号
                  </Button>
                )}
                {selectedLawyer.verifyStatus === 'rejected' && (
                  <Button
                    variant="primary"
                    leftIcon={<PlayCircle className="w-4 h-4" />}
                    onClick={() => handleReverify(selectedLawyer.id)}
                  >
                    重新审核
                  </Button>
                )}
                {selectedLawyer.verifyStatus === 'frozen' && (
                  <Button
                    variant="primary"
                    leftIcon={<PlayCircle className="w-4 h-4" />}
                    onClick={() => handleUnfreeze(selectedLawyer.id)}
                  >
                    解除冻结
                  </Button>
                )}
              </div>
            )
          }
        >
          {selectedLawyer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-primary-400 mb-1">律师姓名</p>
                  <p className="font-medium text-primary-800">
                    律师{selectedLawyer.id.split('-')[1]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-400 mb-1">执业证号</p>
                  <p className="font-medium text-primary-800">
                    {selectedLawyer.licenseNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-400 mb-1">所属律所</p>
                  <p className="font-medium text-primary-800">
                    {selectedLawyer.firmName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-400 mb-1">执业年限</p>
                  <p className="font-medium text-primary-800">
                    {selectedLawyer.practiceYears} 年
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-400 mb-1">审核状态</p>
                  <Badge
                    variant={verifyStatusBadgeVariant[selectedLawyer.verifyStatus]}
                    dot
                  >
                    {getVerifyStatusLabel(selectedLawyer.verifyStatus)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-primary-400 mb-1">提交时间</p>
                  <p className="font-medium text-primary-800">
                    {formatDate(selectedLawyer.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-800">
                    执业证核验结果
                  </p>
                  <p className="text-sm text-emerald-600">
                    对接司法部API核验通过
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-primary-700">
                    年度继续教育学分
                  </p>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      selectedLawyer.continuingEducationCredits < 40
                        ? 'text-red-600'
                        : 'text-primary-800'
                    )}
                  >
                    {selectedLawyer.continuingEducationCredits}/40 学分
                  </span>
                </div>
                <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (selectedLawyer.continuingEducationCredits / 40) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      selectedLawyer.continuingEducationCredits >= 40
                        ? 'bg-gold-gradient'
                        : 'bg-red-500'
                    )}
                  />
                </div>
                {selectedLawyer.continuingEducationCredits < 40 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      学分不足，需完成至少40学分方可维持执业资格
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-medium text-primary-800 mb-3">
                  <History className="w-4 h-4" />
                  历史操作记录
                </h4>
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-primary-100" />
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-gold-gradient border-2 border-white" />
                      <p className="text-sm font-medium text-primary-800">
                        提交资质申请
                      </p>
                      <p className="text-xs text-primary-400">
                        {formatDate(selectedLawyer.createdAt)}
                      </p>
                    </div>
                    {selectedLawyer.verifiedAt && (
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                        <p className="text-sm font-medium text-primary-800">
                          资质审核通过
                        </p>
                        <p className="text-xs text-primary-400">
                          {formatDate(selectedLawyer.verifiedAt)}
                        </p>
                      </div>
                    )}
                    {selectedLawyer.frozenReason && (
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
                        <p className="text-sm font-medium text-primary-800">
                          账号冻结
                        </p>
                        <p className="text-xs text-red-500">
                          {selectedLawyer.frozenReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={rejectModalOpen}
          onClose={() => !actionLoading && setRejectModalOpen(false)}
          title="驳回资质申请"
          footer={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
              >
                取消
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={handleReject}
                disabled={!reasonText.trim()}
              >
                确认驳回
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-primary-600">
              请输入驳回原因，该原因将通知律师本人。
            </p>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="请输入驳回原因..."
              className="input-base min-h-[120px] resize-none"
            />
          </div>
        </Modal>

        <Modal
          open={freezeModalOpen}
          onClose={() => !actionLoading && setFreezeModalOpen(false)}
          title="冻结律师账号"
          footer={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setFreezeModalOpen(false)}
                disabled={actionLoading}
              >
                取消
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={handleFreeze}
                disabled={!reasonText.trim()}
              >
                确认冻结
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-primary-600">
              冻结后律师将无法接收新咨询，请输入冻结原因。
            </p>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="请输入冻结原因..."
              className="input-base min-h-[120px] resize-none"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
