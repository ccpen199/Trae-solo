import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  DollarSign,
  Wrench,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Filter,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { Input } from 'antd';
import dayjs from 'dayjs';

type ReviewTab = 'pending' | 'reviewing' | 'approved' | 'rejected';
type ReviewType = 'fee_adjustment' | 'maintenance_fund' | 'merchant_entry' | 'activity_approval' | 'other';
type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

interface ReviewItem {
  id: string;
  title: string;
  type: ReviewType;
  applicant: string;
  applicantDept: string;
  applyTime: string;
  status: ReviewStatus;
  description: string;
  amount?: number;
  attachments?: { name: string; size: string }[];
  reviewHistory?: {
    id: string;
    reviewer: string;
    action: string;
    opinion: string;
    time: string;
  }[];
}

const tabConfig: { key: ReviewTab; label: string; icon: typeof Clock; status: string }[] = [
  { key: 'pending', label: '待审批', icon: Clock, status: 'pending' },
  { key: 'reviewing', label: '审批中', icon: Clock3, status: 'reviewing' },
  { key: 'approved', label: '已通过', icon: CheckCircle2, status: 'approved' },
  { key: 'rejected', label: '已驳回', icon: XCircle, status: 'rejected' },
];

const reviewTypeConfig: Record<ReviewType, { label: string; icon: typeof FileText; color: string }> = {
  fee_adjustment: { label: '物业费调价', icon: DollarSign, color: 'text-primary-400' },
  maintenance_fund: { label: '维修基金使用', icon: Wrench, color: 'text-warning-400' },
  merchant_entry: { label: '商户入驻', icon: Building2, color: 'text-success-400' },
  activity_approval: { label: '活动审批', icon: Calendar, color: 'text-accent-400' },
  other: { label: '其他事项', icon: FileText, color: 'text-neutral-400' },
};

const mockReviewItems: ReviewItem[] = [
  {
    id: 'review_001',
    title: '2024年下半年物业费调整申请',
    type: 'fee_adjustment',
    applicant: '物业管理部',
    applicantDept: '物业',
    applyTime: dayjs().subtract(2, 'day').toISOString(),
    status: 'pending',
    description: '因运营成本上升，申请将物业费从3.0元/㎡调整为3.5元/㎡，调整后主要用于人员工资、公共设施维护等方面。',
    amount: 0.5,
    attachments: [
      { name: '调价方案.pdf', size: '2.3MB' },
      { name: '成本核算表.xlsx', size: '1.1MB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '张主任',
        action: '提交申请',
        opinion: '申请调整物业费',
        time: dayjs().subtract(2, 'day').toISOString(),
      },
    ],
  },
  {
    id: 'review_002',
    title: '1号楼电梯维修基金使用申请',
    type: 'maintenance_fund',
    applicant: '工程维修部',
    applicantDept: '工程',
    applyTime: dayjs().subtract(3, 'day').toISOString(),
    status: 'reviewing',
    description: '1号楼2单元电梯出现故障，需要更换主板，申请使用维修基金共计28,500元。',
    amount: 28500,
    attachments: [
      { name: '维修报价单.pdf', size: '856KB' },
      { name: '故障检测报告.pdf', size: '1.5MB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '李工程师',
        action: '提交申请',
        opinion: '电梯主板损坏，需更换',
        time: dayjs().subtract(3, 'day').toISOString(),
      },
      {
        id: 'h2',
        reviewer: '王经理',
        action: '初审通过',
        opinion: '情况属实，同意提交业委会审批',
        time: dayjs().subtract(1, 'day').toISOString(),
      },
    ],
  },
  {
    id: 'review_003',
    title: '便民超市入驻小区申请',
    type: 'merchant_entry',
    applicant: '招商部',
    applicantDept: '商业',
    applyTime: dayjs().subtract(5, 'day').toISOString(),
    status: 'approved',
    description: '小区西门底商空置，申请引入连锁便民超市，方便居民日常生活购物。',
    attachments: [
      { name: '商家资质材料.pdf', size: '3.2MB' },
      { name: '合作方案.docx', size: '520KB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '赵主管',
        action: '提交申请',
        opinion: '推荐引入该超市',
        time: dayjs().subtract(5, 'day').toISOString(),
      },
      {
        id: 'h2',
        reviewer: '业委会',
        action: '审批通过',
        opinion: '同意入驻，需签订正式合同',
        time: dayjs().subtract(2, 'day').toISOString(),
      },
    ],
  },
  {
    id: 'review_004',
    title: '小区暑期夏令营活动申请',
    type: 'activity_approval',
    applicant: '社区活动部',
    applicantDept: '活动',
    applyTime: dayjs().subtract(4, 'day').toISOString(),
    status: 'rejected',
    description: '申请举办暑期儿童夏令营活动，为期7天，预计参与人数50人，预算15,000元。',
    amount: 15000,
    attachments: [
      { name: '活动方案.pdf', size: '1.8MB' },
      { name: '预算明细.xlsx', size: '420KB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '孙活动',
        action: '提交申请',
        opinion: '丰富儿童暑假生活',
        time: dayjs().subtract(4, 'day').toISOString(),
      },
      {
        id: 'h2',
        reviewer: '业委会',
        action: '审批驳回',
        opinion: '预算偏高，建议缩减规模或寻找赞助商',
        time: dayjs().subtract(1, 'day').toISOString(),
      },
    ],
  },
  {
    id: 'review_005',
    title: '小区门禁系统升级申请',
    type: 'maintenance_fund',
    applicant: '安防部',
    applicantDept: '安防',
    applyTime: dayjs().subtract(1, 'day').toISOString(),
    status: 'pending',
    description: '现有门禁系统使用年限较长，故障率上升，申请升级为人脸识别门禁系统，预计费用85,000元。',
    amount: 85000,
    attachments: [
      { name: '升级方案.pdf', size: '2.1MB' },
      { name: '报价单.pdf', size: '680KB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '周安防',
        action: '提交申请',
        opinion: '提升小区安全等级',
        time: dayjs().subtract(1, 'day').toISOString(),
      },
    ],
  },
  {
    id: 'review_006',
    title: '中秋节业主联谊活动申请',
    type: 'activity_approval',
    applicant: '社区活动部',
    applicantDept: '活动',
    applyTime: dayjs().subtract(6, 'day').toISOString(),
    status: 'approved',
    description: '中秋节举办业主联谊活动，增进邻里关系，预计参与人数200人，预算30,000元。',
    amount: 30000,
    attachments: [
      { name: '活动策划案.pdf', size: '2.5MB' },
    ],
    reviewHistory: [
      {
        id: 'h1',
        reviewer: '孙活动',
        action: '提交申请',
        opinion: '传统节日活动',
        time: dayjs().subtract(6, 'day').toISOString(),
      },
      {
        id: 'h2',
        reviewer: '业委会',
        action: '审批通过',
        opinion: '同意举办，注意安全保障',
        time: dayjs().subtract(3, 'day').toISOString(),
      },
    ],
  },
];

function convertStatus(status: ReviewStatus): 'pending' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<ReviewStatus, 'pending' | 'processing' | 'completed' | 'cancelled'> = {
    pending: 'pending',
    reviewing: 'processing',
    approved: 'completed',
    rejected: 'cancelled',
  };
  return map[status];
}

function ReviewCard({
  item,
  onViewDetail,
  onApprove,
  onReject,
}: {
  item: ReviewItem;
  onViewDetail: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const typeConfig = reviewTypeConfig[item.type];
  const TypeIcon = typeConfig.icon;

  const canApprove = item.status === 'pending' || item.status === 'reviewing';
  const canReject = item.status === 'pending' || item.status === 'reviewing';

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-white/5 border border-white/10',
          )}>
            <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
          </div>
          <div>
            <span className="text-xs text-neutral-500">{typeConfig.label}</span>
            <h3 className="text-base font-medium text-white mt-0.5">{item.title}</h3>
          </div>
        </div>
        <StatusBadge status={convertStatus(item.status)} category="workorder" size="sm" />
      </div>

      <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-neutral-500">
            <User className="w-4 h-4" />
            {item.applicant}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-500">
            <Clock className="w-4 h-4" />
            {dayjs(item.applyTime).format('MM-DD HH:mm')}
          </span>
        </div>
        {item.amount !== undefined && (
          <span className="text-primary-400 font-medium">¥{item.amount.toLocaleString()}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          onClick={onViewDetail}
          className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          查看详情
        </button>
        <div className="flex items-center gap-2">
          {canReject && (
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded-lg border border-danger-500/30 text-sm text-danger-400 hover:bg-danger-500/10 transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              驳回
            </button>
          )}
          {canApprove && (
            <button
              onClick={onApprove}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-success-500 to-success-600 text-sm text-white font-medium hover:from-success-400 hover:to-success-500 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              通过
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ReviewTimeline({ history }: { history: ReviewItem['reviewHistory'] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary-500/50 to-transparent" />
      <div className="space-y-6">
        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative pl-10"
          >
            <div className={cn(
              'absolute left-2.5 top-1 w-4 h-4 rounded-full border-2',
              index === history.length - 1
                ? 'bg-primary-500 border-primary-500/30'
                : 'bg-white/20 border-white/10'
            )} />
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{item.action}</span>
                <span className="text-xs text-neutral-500">
                  {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-2">审批人：{item.reviewer}</p>
              {item.opinion && (
                <p className="text-sm text-neutral-500">意见：{item.opinion}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReviewDetailModal({
  item,
  visible,
  onClose,
  onApprove,
  onReject,
}: {
  item: ReviewItem | null;
  visible: boolean;
  onClose: () => void;
  onApprove: (opinion: string) => void;
  onReject: (opinion: string) => void;
}) {
  const [opinion, setOpinion] = useState('');

  if (!item) return null;

  const typeConfig = reviewTypeConfig[item.type];
  const TypeIcon = typeConfig.icon;
  const canApprove = item.status === 'pending' || item.status === 'reviewing';

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-3xl mx-auto z-50 max-h-[85vh] overflow-hidden"
          >
            <div className="glass-card flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-white/5 border border-white/10',
                  )}>
                    <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="text-sm text-neutral-500">{typeConfig.label}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">申请信息</h3>
                  <div className="glass-card p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">申请人/部门</p>
                        <p className="text-sm text-white">{item.applicant} ({item.applicantDept})</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">申请时间</p>
                        <p className="text-sm text-white">{dayjs(item.applyTime).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                      {item.amount !== undefined && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">涉及金额</p>
                          <p className="text-sm text-primary-400 font-medium">¥{item.amount.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">当前状态</p>
                        <StatusBadge status={convertStatus(item.status)} category="workorder" size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-3">申请详情</h3>
                  <div className="glass-card p-4">
                    <p className="text-sm text-neutral-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">附件材料</h3>
                    <div className="space-y-2">
                      {item.attachments.map((att, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                              <p className="text-sm text-white">{att.name}</p>
                              <p className="text-xs text-neutral-500">{att.size}</p>
                            </div>
                          </div>
                          <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                            查看
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-white mb-3">审批历史</h3>
                  <ReviewTimeline history={item.reviewHistory} />
                </div>

                {canApprove && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">审批意见</h3>
                    <div className="glass-card p-4">
                      <Input.TextArea
                        value={opinion}
                        onChange={(e) => setOpinion(e.target.value)}
                        placeholder="请输入审批意见..."
                        rows={3}
                        className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 !resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="btn-ghost text-sm"
                >
                  关闭
                </button>
                {canApprove && (
                  <>
                    <button
                      onClick={() => { onReject(opinion); onClose(); }}
                      className="px-5 py-2.5 rounded-lg border border-danger-500/30 text-sm text-danger-400 hover:bg-danger-500/10 transition-all flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回
                    </button>
                    <button
                      onClick={() => { onApprove(opinion); onClose(); }}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      通过
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function CommitteeReview() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const filteredItems = useMemo(() => {
    let items = mockReviewItems.filter((item) => item.status === activeTab);
    if (searchText) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.applicant.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return items;
  }, [activeTab, searchText]);

  const tabCounts = useMemo(() => {
    return {
      pending: mockReviewItems.filter((i) => i.status === 'pending').length,
      reviewing: mockReviewItems.filter((i) => i.status === 'reviewing').length,
      approved: mockReviewItems.filter((i) => i.status === 'approved').length,
      rejected: mockReviewItems.filter((i) => i.status === 'rejected').length,
    };
  }, []);

  const handleViewDetail = (item: ReviewItem) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  const handleApprove = (opinion: string) => {
    console.log('通过:', selectedItem?.id, opinion);
  };

  const handleReject = (opinion: string) => {
    console.log('驳回:', selectedItem?.id, opinion);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="业委会审批中心"
        subtitle="管理小区重要事项的审批流程"
        breadcrumb={[{ title: '首页' }, { title: '业委会审批' }]}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-2 mb-6"
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            const count = tabCounts[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                )}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  activeTab === tab.key
                    ? 'bg-primary-500/30 text-primary-300'
                    : 'bg-white/5 text-neutral-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="搜索审批事项、申请人..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
              />
            </div>
          </div>
          <button className="btn-ghost text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {filteredItems.length === 0 ? (
          <div className="glass-card">
            <EmptyState type="default" title="暂无审批事项" description="当前分类下没有审批事项" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ReviewCard
                  item={item}
                  onViewDetail={() => handleViewDetail(item)}
                  onApprove={() => console.log('通过:', item.id)}
                  onReject={() => console.log('驳回:', item.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <ReviewDetailModal
        item={selectedItem}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
