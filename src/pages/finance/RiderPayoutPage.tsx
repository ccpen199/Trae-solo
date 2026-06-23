import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Filter,
  Search,
  Wallet,
  XCircle,
  XOctagon,
  RefreshCw,
  User as UserIcon,
  Star,
  History,
  MessageCircle,
  RotateCcw,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { cn, formatDateTime } from '../../utils';
import { useAppStore } from '@/stores/appStore';
import type { RiderProfile } from '../../types';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';

interface PayoutItem {
  id: string;
  rider: RiderProfile;
  riderName: string;
  riderAvatar: string;
  amount: number;
  paymentMethod: 'wechat' | 'alipay' | 'bank';
  applyTime: Date;
  status: PayoutStatus;
  rejectReason?: string;
  completedAt?: Date;
  orderCount: number;
  expectedArrivalTime?: Date;
  currentStep: number;
  creditScore: number;
  totalPayoutCount: number;
  accountBalance: number;
}

export default function RiderPayoutPage() {
  const { mockRiders, showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectModal, setRejectModal] = useState<PayoutItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState<PayoutItem | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [auditModal, setAuditModal] = useState<PayoutItem | null>(null);
  const [auditNote, setAuditNote] = useState('');
  const [auditQuickTags] = useState(['正常发放', '疑似刷单', '账户异常', '资料不全']);
  const [payoutsList, setPayoutsList] = useState<PayoutItem[]>([]);
  const [contactModal, setContactModal] = useState<PayoutItem | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [resubmitLoading, setResubmitLoading] = useState<string | null>(null);

  const initialPayouts = useMemo<PayoutItem[]>(() => {
    const methods: PayoutItem['paymentMethod'][] = ['wechat', 'alipay', 'bank', 'wechat', 'alipay'];
    const items: PayoutItem[] = [];
    const riderNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
    for (let i = 0; i < 28; i++) {
      const rider = mockRiders[i % mockRiders.length];
      const status: PayoutStatus = i < 6 ? 'pending' : i < 10 ? 'processing' : i < 22 ? 'completed' : 'rejected';
      const applyT = new Date(Date.now() - (i + 1) * 3600000 * (i % 4 + 1));
      const currentStep = status === 'pending' ? 1 : status === 'processing' ? 2 : status === 'completed' ? 4 : 0;
      items.push({
        id: `pyt_${(100000 + i).toString()}`,
        rider,
        riderName: riderNames[i % riderNames.length],
        riderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=rider${i}`,
        amount: Math.round((Math.random() * 800 + 200) * 100) / 100,
        paymentMethod: methods[i % methods.length],
        applyTime: applyT,
        status,
        orderCount: Math.floor(Math.random() * 30) + 5,
        completedAt: status === 'completed' ? new Date(applyT.getTime() + 3600000 * (Math.random() * 6 + 1)) : undefined,
        rejectReason: status === 'rejected' ? '提现账号信息异常，请核对后重新申请' : undefined,
        expectedArrivalTime: status === 'pending' || status === 'processing'
          ? new Date(applyT.getTime() + 3600000 * 24)
          : undefined,
        currentStep,
        creditScore: rider.creditScore,
        totalPayoutCount: Math.floor(Math.random() * 50) + 10,
        accountBalance: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      });
    }
    return items;
  }, [mockRiders]);

  const [payouts, setPayouts] = useState<PayoutItem[]>(initialPayouts);

  useEffect(() => {
    setPayouts(initialPayouts);
  }, [initialPayouts]);

  const stats = useMemo(() => {
    const pending = payouts.filter((p) => p.status === 'pending');
    const processing = payouts.filter((p) => p.status === 'processing');
    const completed = payouts.filter((p) => p.status === 'completed');
    const rejected = payouts.filter((p) => p.status === 'rejected');
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      processingCount: processing.length,
      processingAmount: processing.reduce((s, p) => s + p.amount, 0),
      todayCompletedAmount: completed
        .filter((p) => {
          if (!p.completedAt) return false;
          const s = new Date(); s.setHours(0, 0, 0, 0);
          return p.completedAt >= s;
        })
        .reduce((s, p) => s + p.amount, 0),
      totalCompletedAmount: completed.reduce((s, p) => s + p.amount, 0),
      todayCompletedCount: completed.filter((p) => {
        if (!p.completedAt) return false;
        const s = new Date(); s.setHours(0, 0, 0, 0);
        return p.completedAt >= s;
      }).length,
      rejectedCount: rejected.length,
      rejectedAmount: rejected.reduce((s, p) => s + p.amount, 0),
    };
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    const filtered = payouts.filter((p) => p.status === activeTab);
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      return filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(kw) ||
          p.rider.userId.toLowerCase().includes(kw) ||
          p.rider.vehicleType.includes(kw)
      );
    }
    return filtered;
  }, [payouts, activeTab, searchText]);

  const allSelected = filteredPayouts.length > 0 && filteredPayouts.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayouts.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = (item: PayoutItem) => {
    setConfirmApprove(item);
  };

  const confirmDoApprove = () => {
    if (!confirmApprove) return;
    showToast(`已通过 ${confirmApprove.id.slice(-6)} 打款 ¥${confirmApprove.amount}`, 'success');
    setConfirmApprove(null);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(confirmApprove.id); return n; });
  };

  const handleReject = (item: PayoutItem) => {
    setRejectModal(item);
    setRejectReason('');
  };

  const confirmDoReject = () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { showToast('请填写驳回原因', 'error'); return; }
    showToast(`已驳回 ${rejectModal.id.slice(-6)}`, 'info');
    setRejectModal(null);
    setRejectReason('');
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) { showToast('请先选择要审核的提现单', 'error'); return; }
    setShowBatchModal(true);
  };

  const confirmBatchApprove = () => {
    showToast(`已批量通过 ${selectedIds.size} 笔提现`, 'success');
    setShowBatchModal(false);
    setSelectedIds(new Set());
  };

  const handleReaudit = (item: PayoutItem) => {
    setResubmitLoading(item.id);
    setTimeout(() => {
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                status: 'pending',
                rejectReason: undefined,
                applyTime: new Date(),
              }
            : p
        )
      );
      showToast(`提现单 ${item.id.slice(-6)} 已重新提交到审核队列`, 'success');
      setResubmitLoading(null);
    }, 1000);
  };

  const handleContactRider = (item: PayoutItem) => {
    setContactModal(item);
    setContactMessage('');
  };

  const handleSendMessage = () => {
    if (!contactModal || !contactMessage.trim()) {
      showToast('请输入消息内容', 'error');
      return;
    }
    showToast(`已向骑手发送通知`, 'success');
    setContactModal(null);
    setContactMessage('');
  };

  const handleBatchResubmit = () => {
    const rejectedItems = filteredPayouts.filter((p) => p.status === 'rejected');
    if (rejectedItems.length === 0) {
      showToast('暂无驳回的提现单', 'warning');
      return;
    }
    setPayouts((prev) =>
      prev.map((p) =>
        p.status === 'rejected' && filteredPayouts.some((fp) => fp.id === p.id)
          ? {
              ...p,
              status: 'pending',
              rejectReason: undefined,
              applyTime: new Date(),
            }
          : p
      )
    );
    showToast(`已将 ${rejectedItems.length} 笔驳回提现单重新提交到处理队列`, 'success');
  };

  const methodConfig: Record<PayoutItem['paymentMethod'], { label: string; icon: string; badge: string }> = {
    wechat: { label: '微信', icon: '💚', badge: 'bg-green-50 text-green-700 border-green-200' },
    alipay: { label: '支付宝', icon: '💙', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    bank: { label: '银行卡', icon: '🏦', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const statusConfig: Record<PayoutStatus, { variant: 'warning' | 'info' | 'success' | 'danger'; label: string; icon: typeof Clock }> = {
    pending: { variant: 'warning', label: '待审核', icon: Clock },
    processing: { variant: 'info', label: '处理中', icon: RefreshCw },
    completed: { variant: 'success', label: '已完成', icon: CheckCircle2 },
    rejected: { variant: 'danger', label: '已驳回', icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-primary" />
              骑手结算管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">审核骑手提现申请，管理打款流程</p>
          </div>
          <Button variant="outline" className="!text-gray-700 !border-gray-300 !bg-white hover:!bg-gray-50">
            <Download className="w-4 h-4 mr-1.5" />
            导出报表
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">待审核提现</div>
                  <div className="text-3xl font-bold text-accent mb-1">¥{stats.pendingAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-accent">{stats.pendingCount}</span> 笔申请待处理
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20 bg-gradient-to-br from-blue-50 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">处理中</div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">¥{stats.processingAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-blue-600">{stats.processingCount}</span> 笔正在打款
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">今日已打款</div>
                  <div className="text-3xl font-bold text-success mb-1">¥{stats.todayCompletedAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-success">{stats.todayCompletedCount}</span> 笔 · 累计 ¥{stats.totalCompletedAmount.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-danger/20 bg-gradient-to-br from-red-50 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">已驳回</div>
                  <div className="text-3xl font-bold text-danger mb-1">¥{stats.rejectedAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-danger">{stats.rejectedCount}</span> 笔申请被驳回
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
                <TabList>
                  <Tab value="pending">
                    待审核
                    <Badge variant="warning" className="ml-2">{stats.pendingCount}</Badge>
                  </Tab>
                  <Tab value="processing">
                    处理中
                    <Badge variant="info" className="ml-2">{stats.processingCount}</Badge>
                  </Tab>
                  <Tab value="completed">已完成</Tab>
                  <Tab value="rejected">
                    已驳回
                    <Badge variant="danger" className="ml-2">{stats.rejectedCount}</Badge>
                  </Tab>
                </TabList>
              </Tabs>

              <div className="flex items-center gap-3 ml-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索单号/骑手ID"
                    className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm w-56 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <Button variant="outline" size="sm" className="!text-gray-600 !border-gray-300 !bg-white hover:!bg-gray-50">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  筛选
                </Button>
                {activeTab === 'pending' && (
                  <>
                    <div className="h-6 w-px bg-gray-200"></div>
                    {selectedIds.size > 0 && (
                      <span className="text-xs text-gray-500">
                        已选 <span className="font-bold text-primary">{selectedIds.size}</span> 笔
                      </span>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBatchApprove}
                      disabled={selectedIds.size === 0}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      批量通过
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {(['pending', 'completed', 'rejected'] as const).map((tab) => (
              <TabPanel key={tab} value={tab}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 border-b border-gray-100">
                      <tr>
                        {tab === 'pending' && (
                          <th className="w-12 px-5 py-3.5">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleAll}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">提现单号</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">骑手信息</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-4 py-3.5">提现金额</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">收款方式</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">申请时间</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">处理进度</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">预计到账</th>
                        <th className="text-center text-xs font-medium text-gray-500 px-4 py-3.5">状态</th>
                        {tab === 'completed' && (
                          <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">打款时间</th>
                        )}
                        {tab === 'rejected' && (
                          <th className="text-left text-xs font-medium text-gray-500 px-4 py-3.5">驳回原因</th>
                        )}
                        {tab === 'pending' && (
                          <th className="text-right text-xs font-medium text-gray-500 px-6 py-3.5">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayouts.map((p) => {
                        const st = statusConfig[p.status];
                        const method = methodConfig[p.paymentMethod];
                        const checked = selectedIds.has(p.id);
                        const steps = ['提交申请', '审核通过', '打款中', '已到账'];
                        return (
                          <tr key={p.id} className={cn(
                            'border-b border-gray-50 hover:bg-gray-50/60 transition-colors',
                            checked && tab === 'pending' && 'bg-primary/[0.02]'
                          )}>
                            {tab === 'pending' && (
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleOne(p.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="px-4 py-4">
                              <div className="font-mono text-xs text-gray-700">{p.id}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.riderAvatar}
                                  alt=""
                                  className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-gray-900 text-sm">{p.riderName}</span>
                                    {p.rider.status === 'on_order' && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 text-amber-400" />
                                    {p.creditScore} 信用分 · 完成{p.totalPayoutCount}次提现
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="text-lg font-bold text-gray-900">¥{p.amount.toFixed(2)}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border',
                                method.badge
                              )}>
                                <span>{method.icon}</span>
                                {method.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-xs text-gray-600 font-mono">{formatDateTime(p.applyTime)}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                {steps.map((step, idx) => (
                                  <div key={step} className="flex items-center">
                                    <div className={cn(
                                      'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0',
                                      idx < p.currentStep
                                        ? 'bg-success text-white'
                                        : idx === p.currentStep - 1 && p.status === 'processing'
                                        ? 'bg-primary text-white animate-pulse'
                                        : 'bg-gray-200 text-gray-500'
                                    )}>
                                      {idx < p.currentStep ? '✓' : idx + 1}
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div className={cn(
                                        'w-6 h-0.5 mx-0.5',
                                        idx < p.currentStep - 1 ? 'bg-success' : 'bg-gray-200'
                                      )}></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {steps[Math.max(0, p.currentStep - 1)] || '已驳回'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-xs text-gray-600">
                                {p.expectedArrivalTime
                                  ? formatDateTime(p.expectedArrivalTime)
                                  : p.completedAt
                                  ? formatDateTime(p.completedAt)
                                  : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge variant={st.variant}>
                                <st.icon className="w-3 h-3 mr-1" />
                                {st.label}
                              </Badge>
                            </td>
                            {tab === 'completed' && p.completedAt && (
                              <td className="px-4 py-4">
                                <div className="text-xs text-gray-600 font-mono">{formatDateTime(p.completedAt)}</div>
                              </td>
                            )}
                            {tab === 'rejected' && (
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-1.5 max-w-[240px]">
                                  <XOctagon className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                                  <span className="text-xs text-gray-600">{p.rejectReason}</span>
                                </div>
                              </td>
                            )}
                            {tab === 'pending' && (
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => { setAuditModal(p); setAuditNote(''); }}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    审核
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {filteredPayouts.length === 0 && (
                        <tr>
                          <td colSpan={tab === 'pending' ? 10 : 9} className="px-6 py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="text-lg font-semibold text-gray-700 mb-1">
                              {tab === 'pending' ? '暂无待审核' : tab === 'completed' ? '暂无记录' : '暂无驳回'}
                            </div>
                            <div className="text-sm text-gray-500">当前状态下没有数据</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-xs text-gray-500">
                    共 <span className="font-semibold text-gray-700">{filteredPayouts.length}</span> 条记录
                  </div>
                  <div className="flex items-center gap-1">
                    {['上一页', '1', '2', '3', '下一页'].map((label, i) => (
                      <button
                        key={label + i}
                        className={cn(
                          'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
                          label === '1'
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </TabPanel>
            ))}
          </Tabs>
        </Card>
      </div>

      <Modal
        isOpen={!!confirmApprove}
        onClose={() => setConfirmApprove(null)}
        title="审核通过确认"
        size="md"
      >
        {confirmApprove && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-800 mb-0.5">确认通过提现申请</div>
                  <div className="text-xs text-green-700">打款后资金将转入骑手收款账户，约 5-10 分钟到账</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">提现单号</div>
                <div className="font-mono text-sm font-semibold text-gray-900">{confirmApprove.id}</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">收款方式</div>
                <div className="text-sm font-semibold text-gray-900">
                  {methodConfig[confirmApprove.paymentMethod].icon} {methodConfig[confirmApprove.paymentMethod].label}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">骑手</div>
                <div className="text-sm font-semibold text-gray-900">{confirmApprove.rider.userId.slice(-6)}</div>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-[11px] text-gray-500 mb-1">打款金额</div>
                <div className="text-lg font-bold text-primary">¥{confirmApprove.amount.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
                onClick={() => setConfirmApprove(null)}
              >
                取消
              </Button>
              <Button variant="primary" className="flex-1" onClick={confirmDoApprove}>
                确认打款
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="驳回提现申请"
        size="md"
      >
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-800 mb-0.5">驳回后骑手需要重新发起申请</div>
                  <div className="text-xs text-red-700">请务必填写清晰的驳回原因，便于骑手及时处理</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">{rejectModal.id}</div>
                <div className="text-xs text-gray-700">骑手 {rejectModal.rider.userId.slice(-6)}</div>
              </div>
              <div className="text-xl font-bold text-danger">¥{rejectModal.amount.toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">驳回原因 *</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['账号信息错误', '余额不足', '风控异常', '账号冻结'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                      rejectReason === r
                        ? 'bg-danger/10 border-danger/30 text-danger font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="请详细描述驳回原因..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-danger/40 focus:ring-2 focus:ring-danger/10 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
                onClick={() => setRejectModal(null)}
              >
                取消
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDoReject}>
                确认驳回
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="批量审核通过"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-green-800 mb-0.5">确认批量通过 {selectedIds.size} 笔提现？</div>
                <div className="text-xs text-green-700">操作不可撤销，请确认信息无误后执行</div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">提现笔数</span>
              <span className="font-semibold text-gray-900">{selectedIds.size} 笔</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">预计总金额</span>
              <span className="text-xl font-bold text-primary">
                ¥{Array.from(selectedIds).reduce((s, id) => {
                  const item = payouts.find((p) => p.id === id);
                  return s + (item?.amount ?? 0);
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
              onClick={() => setShowBatchModal(false)}
            >
              取消
            </Button>
            <Button variant="primary" className="flex-1" onClick={confirmBatchApprove}>
              确认批量打款
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!auditModal}
        onClose={() => { setAuditModal(null); setAuditNote(''); }}
        title="提现审核"
        size="lg"
      >
        {auditModal && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20">
              <div className="flex items-center gap-4">
                <img
                  src={auditModal.riderAvatar}
                  alt=""
                  className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-gray-900">{auditModal.riderName}</span>
                    <Badge variant="info">{auditModal.rider.vehicleType}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    骑手ID: {auditModal.rider.userId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-500 mb-0.5">提现金额</div>
                  <div className="text-2xl font-bold text-primary">¥{auditModal.amount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-500">信用分</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{auditModal.creditScore}</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-gray-500">历史提现</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{auditModal.totalPayoutCount} 次</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-gray-500">账户余额</span>
                </div>
                <div className="text-lg font-bold text-gray-900">¥{auditModal.accountBalance.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">提现单号</div>
                <div className="font-mono text-sm font-semibold text-gray-900">{auditModal.id}</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">收款方式</div>
                <div className="text-sm font-semibold text-gray-900">
                  {methodConfig[auditModal.paymentMethod].icon} {methodConfig[auditModal.paymentMethod].label}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">申请时间</div>
                <div className="text-sm font-mono text-gray-700">{formatDateTime(auditModal.applyTime)}</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">关联订单</div>
                <div className="text-sm font-semibold text-gray-900">{auditModal.orderCount} 单</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                <div>
                  <div className="text-xs font-semibold text-blue-800 mb-0.5">T+0 快速到账说明</div>
                  <div className="text-[11px] text-blue-700">
                    审核通过后资金将立即进入打款流程，通常 5-10 分钟内到账。如遇高峰期可能略有延迟，请耐心等待。
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">审核备注</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {auditQuickTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setAuditNote(tag)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                      auditNote === tag
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                rows={2}
                placeholder="请输入审核备注(选填)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setRejectModal(auditModal);
                  setRejectReason(auditNote);
                  setAuditModal(null);
                }}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                驳回
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setConfirmApprove(auditModal);
                  setAuditModal(null);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                通过
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
