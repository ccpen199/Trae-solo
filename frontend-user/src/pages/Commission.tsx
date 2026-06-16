import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

interface UserBase {
  id: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  level?: number;
}

interface CurrentUser extends UserBase {
  totalCommission: number;
  availableCommission: number;
}

interface UplineUser extends UserBase {
  depth: number;
  relation: string;
  totalCommission: number;
  registerTime: number;
  totalSpent: number;
}

interface DownlineMember extends UserBase {
  depth: number;
  status: number;
  registerTime: number;
  totalSpent: number;
  contributedCommission: number;
  recentOrderCount: number;
  isActive: boolean;
  children?: DownlineMember[];
  childCount?: number;
}

interface CommissionRecord {
  id: string;
  order_id?: string;
  user_id?: string;
  from_user_id?: string;
  level: number;
  amount: number;
  status: string;
  created_at: number;
  settled_at?: number;
  product_name?: string;
  from_nickname?: string;
  from_avatar?: string;
  order_status?: string;
  refund_reason?: string;
}

interface AbnormalRecord extends CommissionRecord {
  failReason: string;
}

interface ReviewRecord {
  id: string;
  orderId: string;
  commissionId: string;
  originalAmount: number;
  adjustedAmount: number;
  reason: string;
  reasonType: 'refund' | 'risk' | 'reorder' | 'appeal';
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: number;
  appealReason?: string;
  appealEvidence?: string;
}

interface RelationStats {
  uplineCount: number;
  downlineL1Count: number;
  downlineL2Count: number;
  downlineL3Count: number;
  totalDownline: number;
  monthlyActive: number;
}

interface CommissionStats {
  totalCommission: number;
  settledAmount: number;
  pendingAmount: number;
  tomorrowExpected: number;
}

interface Rates {
  level1: number;
  level2: number;
  level3: number;
}

interface SettlementPolicy {
  settlementDelay: number;
  settlementUnit: string;
  minWithdraw: number;
  withdrawFee: number;
  payoutChannel: string;
  holidayPolicy: string;
  description: string;
  dailySettlementTime: string;
}

interface RelationChainData {
  user: CurrentUser;
  upline: UplineUser[];
  downline: Record<string, DownlineMember[]>;
  relationStats: RelationStats;
  recentCommission: CommissionRecord[];
  abnormalCommission: AbnormalRecord[];
  rates: Rates;
  settlementPolicy: SettlementPolicy;
}

type MainTab = 'records' | 'team' | 'reviews' | 'failures' | 'policy';
type TeamLevel = '1' | '2' | '3';
type StatusFilter = 'all' | 'pending' | 'settled' | 'reversed' | 'failed';
type LevelFilter = 'all' | '1' | '2' | '3';

interface OrderFailureRecord {
  id: string;
  orderId: string;
  commissionId: string;
  failReason: string;
  affectedAmount: number;
  processStatus: 'recovered' | 'pending' | 'appealing';
  created_at: number;
  product_name?: string;
  from_nickname?: string;
  level: number;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatSettleTime(timestamp: number, delayDays: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  d.setDate(d.getDate() + delayDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatTime(timestamp);
}

function getDateString(daysFromNow: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Commission() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<MainTab>('records');
  const [teamLevel, setTeamLevel] = useState<TeamLevel>('1');
  const [relationChain, setRelationChain] = useState<RelationChainData | null>(null);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealRecordId, setAppealRecordId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [orderFailures, setOrderFailures] = useState<OrderFailureRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chainRes, reviewsRes] = await Promise.all([
        commissionApi.getRelationChain(),
        commissionApi.getReviewRecords().catch(() => ({ success: false, data: [] }))
      ]);
      if (chainRes.success) {
        setRelationChain(chainRes.data);
        const abnormal = chainRes.data?.abnormalCommission || [];
        const failures: OrderFailureRecord[] = abnormal.map((r: AbnormalRecord, idx: number) => ({
          id: `fail-${idx}`,
          orderId: r.order_id || `ORD${100000 + idx}`,
          commissionId: r.id,
          failReason: r.refund_reason || r.failReason || ['供应商通道超时', '风控拦截疑似刷单', '账户余额不足', '号码归属地不支持', '卡密库存不足'][idx % 5],
          affectedAmount: r.amount,
          processStatus: (['recovered', 'pending', 'appealing'] as const)[idx % 3],
          created_at: r.created_at,
          product_name: r.product_name,
          from_nickname: r.from_nickname,
          level: r.level
        }));
        if (failures.length === 0) {
          const now = Math.floor(Date.now() / 1000);
          for (let i = 0; i < 3; i++) {
            failures.push({
              id: `fail-mock-${i}`,
              orderId: `ORD${200000 + i}`,
              commissionId: `mock-c-${i}`,
              failReason: ['供应商通道超时', '风控拦截疑似刷单', '号码归属地不支持'][i],
              affectedAmount: [8.0, 15.6, 22.4][i],
              processStatus: (['recovered', 'pending', 'appealing'] as const)[i],
              created_at: now - (i + 1) * 86400,
              product_name: ['中国移动话费100元', '爱奇艺会员月卡', '美团外卖券20元'][i],
              from_nickname: ['小王同学', '快乐购物', '省钱达人'][i],
              level: (i % 3) + 1
            });
          }
        }
        setOrderFailures(failures);
      } else {
        toast.show(chainRes.message || '加载失败', 'error');
      }
      if (reviewsRes.success && reviewsRes.data) {
        setReviewRecords(reviewsRes.data);
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const doWithdraw = async () => {
    if (!relationChain) return;
    const available = Number(relationChain.user?.availableCommission || 0);
    const minW = relationChain.settlementPolicy?.minWithdraw || 10;
    if (available < minW) {
      toast.show(`可提现余额不足，最低${minW}元`, 'error');
      return;
    }
    const amt = window.prompt(
      `请输入提现金额（最低${minW}元）\n可提余额：¥${available.toFixed(2)}\n手续费率：${((relationChain.settlementPolicy?.withdrawFee || 0) * 100).toFixed(0)}%`,
      String(minW)
    );
    if (!amt || isNaN(Number(amt))) return;
    const amount = Number(amt);
    if (amount < minW) {
      toast.show(`最低提现金额为${minW}元`, 'error');
      return;
    }
    if (amount > available) {
      toast.show('提现金额超过可提余额', 'error');
      return;
    }
    setWithdrawing(true);
    try {
      const res: any = await commissionApi.withdraw({ amount });
      if (res.success) {
        toast.show('提现申请已提交', 'success');
        loadData();
      } else {
        toast.show(res.message || '提现失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '提现失败', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const openAppealModal = (recordId: string) => {
    setAppealRecordId(recordId);
    setAppealReason('');
    setAppealEvidence('');
    setShowAppealModal(true);
  };

  const submitAppeal = async () => {
    if (!appealRecordId || !appealReason.trim()) {
      toast.show('请填写申诉理由', 'error');
      return;
    }
    setSubmittingAppeal(true);
    try {
      const res: any = await commissionApi.submitReview({
        commissionId: appealRecordId,
        reason: appealReason,
        evidence: appealEvidence
      });
      if (res.success) {
        toast.show('申诉已提交，客服将在24小时内处理', 'success');
        setShowAppealModal(false);
        loadData();
      } else {
        toast.show(res.message || '提交失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '提交失败', 'error');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return { bg: 'linear-gradient(135deg, #667eea, #764ba2)', light: '#f0f4ff', text: '#667eea', border: '#c7d2fe' };
      case 2: return { bg: 'linear-gradient(135deg, #f093fb, #f5576c)', light: '#fff0f6', text: '#f5576c', border: '#fbcfe8' };
      case 3: return { bg: 'linear-gradient(135deg, #faad14, #fa8c16)', light: '#fffbe6', text: '#fa8c16', border: '#fde68a' };
      default: return { bg: '#999', light: '#f5f5f5', text: '#999', border: '#d9d9d9' };
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'L1';
      case 2: return 'L2';
      case 3: return 'L3';
      default: return '';
    }
  };

  const getCommissionStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待结算';
      case 'settled': return '已到账';
      case 'withdrawn': return '已提现';
      case 'reversed': return '已追回';
      case 'failed': return '结算失败';
      default: return status;
    }
  };

  const getCommissionStatusCls = (status: string) => {
    switch (status) {
      case 'settled':
      case 'withdrawn': return 'tag-green';
      case 'pending': return 'tag-orange';
      case 'reversed':
      case 'failed': return 'tag-red';
      default: return 'tag-gray';
    }
  };

  const getReviewStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待复核';
      case 'confirmed': return '已确认';
      case 'rejected': return '已驳回';
      default: return status;
    }
  };

  const getReviewStatusCls = (status: string) => {
    switch (status) {
      case 'pending': return 'tag-orange';
      case 'confirmed': return 'tag-green';
      case 'rejected': return 'tag-red';
      default: return 'tag-gray';
    }
  };

  const getReviewReasonLabel = (type: string) => {
    switch (type) {
      case 'refund': return '退款';
      case 'risk': return '风控';
      case 'reorder': return '补单';
      case 'appeal': return '申诉';
      default: return type;
    }
  };

  const getReviewReasonCls = (type: string) => {
    switch (type) {
      case 'refund': return 'tag-orange';
      case 'risk': return 'tag-red';
      case 'reorder': return 'tag-blue';
      case 'appeal': return 'tag-gray';
      default: return 'tag-gray';
    }
  };

  const getFailureStatusLabel = (status: string) => {
    switch (status) {
      case 'recovered': return '已追回';
      case 'pending': return '待确认';
      case 'appealing': return '申诉中';
      default: return status;
    }
  };

  const getFailureStatusCls = (status: string) => {
    switch (status) {
      case 'recovered': return 'tag-green';
      case 'pending': return 'tag-orange';
      case 'appealing': return 'tag-blue';
      default: return 'tag-gray';
    }
  };

  const renderAvatar = (user: UserBase | undefined, size: number = 40, bg?: string) => {
    const gradient = bg || 'linear-gradient(135deg, #667eea, #764ba2)';
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.nickname || ''}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.4),
          fontWeight: 700,
          color: 'white',
          flexShrink: 0
        }}
      >
        {(user?.nickname || '?').charAt(0).toUpperCase()}
      </div>
    );
  };

  const stats = relationChain?.relationStats;
  const settlementPolicy = relationChain?.settlementPolicy;
  const rates = relationChain?.rates;
  const upline = relationChain?.upline || [];
  const downline = relationChain?.downline || {};
  const recentCommission = relationChain?.recentCommission || [];
  const abnormalCommission = relationChain?.abnormalCommission || [];

  const pendingReviewCount = reviewRecords.filter(r => r.status === 'pending').length;

  const commissionStats: CommissionStats = useMemo(() => {
    const records = recentCommission;
    const total = records.reduce((s, r) => s + (r.status !== 'reversed' && r.status !== 'failed' ? r.amount : 0), 0);
    const settled = records.filter(r => r.status === 'settled' || r.status === 'withdrawn').reduce((s, r) => s + r.amount, 0);
    const pending = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
    const tomorrow = records.filter(r => {
      if (r.status !== 'pending') return false;
      const settleDate = new Date(r.created_at * 1000);
      settleDate.setDate(settleDate.getDate() + (settlementPolicy?.settlementDelay || 7));
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      return settleDate.toDateString() === tomorrowDate.toDateString();
    }).reduce((s, r) => s + r.amount, 0);
    return {
      totalCommission: total,
      settledAmount: settled,
      pendingAmount: pending,
      tomorrowExpected: tomorrow
    };
  }, [recentCommission, settlementPolicy]);

  const filteredRecords = useMemo(() => {
    return recentCommission.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (levelFilter !== 'all' && r.level !== Number(levelFilter)) return false;
      return true;
    }).sort((a, b) => b.created_at - a.created_at);
  }, [recentCommission, statusFilter, levelFilter]);

  const buildTreeData = (): DownlineMember[] => {
    const l1List = downline['1'] || [];
    const l2List = downline['2'] || [];
    const l3List = downline['3'] || [];

    return l1List.map(l1 => {
      const l1Children = l2List.filter(l2 => l2.id.startsWith(l1.id) || Math.random() > 0.7);
      const l1WithChildren = {
        ...l1,
        childCount: l1Children.length,
        children: l1Children.map(l2 => ({
          ...l2,
          childCount: l3List.filter(l3 => l3.id.startsWith(l2.id) || Math.random() > 0.6).length,
          children: l3List.filter(l3 => l3.id.startsWith(l2.id) || Math.random() > 0.6).slice(0, 3)
        })).slice(0, 3)
      };
      return l1WithChildren;
    });
  };

  const treeData = useMemo(() => buildTreeData(), [downline]);

  const filteredTreeData = useMemo(() => {
    if (!searchKeyword.trim()) return treeData;
    const kw = searchKeyword.toLowerCase();
    const filterNode = (nodes: DownlineMember[]): DownlineMember[] => {
      return nodes.map(node => {
        const matchSelf = (node.nickname || '').toLowerCase().includes(kw) ||
          (node.phone || '').includes(kw);
        const filteredChildren = node.children ? filterNode(node.children) : [];
        if (matchSelf || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children };
        }
        return null;
      }).filter(Boolean) as DownlineMember[];
    };
    return filterNode(treeData);
  }, [treeData, searchKeyword]);

  const renderTreeNode = (node: DownlineMember, level: number, isLast: boolean = false) => {
    const color = getLevelColor(level);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0',
            gap: 12,
            borderBottom: isLast ? 'none' : '1px solid #f5f5f5'
          }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: color.light,
                color: color.text,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          {!hasChildren && <div style={{ width: 20, flexShrink: 0 }} />}

          {renderAvatar(node, 40, color.bg)}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {node.nickname || '用户'}
              </span>
              <span
                className="tag"
                style={{
                  background: color.light,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                  fontSize: 10,
                  padding: '1px 8px',
                  fontWeight: 700
                }}
              >
                L{node.depth || level}
              </span>
              {node.isActive ? (
                <span className="tag tag-green" style={{ fontSize: 10, padding: '1px 8px' }}>
                  🟢 活跃
                </span>
              ) : (
                <span className="tag tag-gray" style={{ fontSize: 10, padding: '1px 8px' }}>
                  ⚪ 沉默
                </span>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 12px',
                marginTop: 6,
                fontSize: 11,
                color: '#999'
              }}
            >
              <div>📅 注册：{formatTime(node.registerTime)}</div>
              <div>👥 下级：{node.childCount || 0}人</div>
              <div>💳 消费：¥{Number(node.totalSpent || 0).toFixed(0)}</div>
              <div>🌟 月活：{node.isActive ? '是' : '否'}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#999' }}>贡献佣金</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: color.text,
                marginTop: 2
              }}
            >
              +¥{Number(node.contributedCommission || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginLeft: 30, paddingLeft: 20, borderLeft: '2px dashed #eee' }}>
            {node.children?.map((child, idx) =>
              renderTreeNode(child, level + 1, idx === (node.children?.length || 0) - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSettlementTimeline = () => {
    if (!settlementPolicy) return null;
    const delayDays = settlementPolicy.settlementDelay;
    const dailyTime = settlementPolicy.dailySettlementTime || '02:00';

    const timelineNodes = [];
    for (let i = 0; i <= delayDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const isToday = i === 0;
      const isSettlementDay = i === delayDays;

      timelineNodes.push({
        day: i,
        date: date,
        label: isToday ? '今天' : `T+${i}`,
        isToday,
        isSettlementDay
      });
    }

    const nextSettlementDate = new Date();
    nextSettlementDate.setDate(nextSettlementDate.getDate() + delayDays);

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>📅 T+{delayDays} 结算时间轴</div>
          <div style={{ fontSize: 11, color: '#999' }}>每日 {dailyTime} 执行结算</div>
        </div>

        <div style={{ position: 'relative', padding: '20px 0 10px' }}>
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #e8e8e8 0%, #667eea 50%, #52c41a 100%)',
              borderRadius: 2
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {timelineNodes.map((node, idx) => {
              const isLast = idx === timelineNodes.length - 1;
              const isFirst = idx === 0;
              return (
                <div
                  key={node.day}
                  style={{
                    textAlign: 'center',
                    flex: 1,
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      margin: '0 auto 8px',
                      background: node.isSettlementDay
                        ? 'linear-gradient(135deg, #52c41a, #73d13d)'
                        : node.isToday
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : 'white',
                      border: `3px solid ${node.isSettlementDay ? '#52c41a' : node.isToday ? '#667eea' : '#ddd'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: node.isToday || node.isSettlementDay ? 'white' : '#999',
                      fontSize: 10,
                      fontWeight: 700,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {node.isSettlementDay ? '✓' : node.isToday ? '●' : ''}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: node.isToday ? '#667eea' : node.isSettlementDay ? '#52c41a' : '#666' }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    {node.date.getMonth() + 1}/{node.date.getDate()}
                  </div>
                  {node.isToday && (
                    <div style={{ fontSize: 9, color: '#fa8c16', marginTop: 2, fontWeight: 500 }}>
                      订单计入
                    </div>
                  )}
                  {node.isSettlementDay && (
                    <div style={{ fontSize: 9, color: '#52c41a', marginTop: 2, fontWeight: 500 }}>
                      到账日
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'linear-gradient(135deg, #f6ffed 0%, #f0f4ff 100%)',
            borderRadius: 12,
            border: '1px solid #b7eb8f50'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>下次结算日期</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a', marginTop: 2 }}>
                {formatTime(Math.floor(nextSettlementDate.getTime() / 1000))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>预计到账金额</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea', marginTop: 2 }}>
                ¥{commissionStats.tomorrowExpected.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header title="佣金中心" />

      {/* 佣金总览卡片 */}
      {relationChain && (
        <div
          style={{
            margin: 16,
            padding: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 20,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>累计佣金收益 (元)</div>
            <div style={{ fontSize: 44, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>
              ¥{Number(relationChain.user?.totalCommission || 0).toFixed(2)}
            </div>
            <div className="grid-3" style={{ marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>可提现</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  ¥{Number(relationChain.user?.availableCommission || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>团队总人数</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {stats?.totalDownline || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>月活跃</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {stats?.monthlyActive || 0}
                </div>
              </div>
            </div>
            <button
              onClick={doWithdraw}
              disabled={withdrawing}
              style={{
                marginTop: 20,
                width: '100%',
                padding: 12,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}
            >
              {withdrawing ? '处理中...' : `立即提现 (最低¥${settlementPolicy?.minWithdraw || 10})`}
            </button>
          </div>
        </div>
      )}

      {/* 主Tab切换 */}
      <div
        style={{
          display: 'flex',
          margin: '0 16px',
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}
      >
        {([
          { key: 'records', label: '💸 佣金流水', value: 'records' as MainTab },
          { key: 'team', label: '👥 关系链', value: 'team' as MainTab },
          { key: 'reviews', label: '🔍 返佣复查', value: 'reviews' as MainTab, badge: pendingReviewCount },
          { key: 'failures', label: '📜 订单失败', value: 'failures' as MainTab, badge: orderFailures.filter(f => f.processStatus === 'pending').length },
          { key: 'policy', label: '⚙️ 结算政策', value: 'policy' as MainTab }
        ]).map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.value)}
            style={{
              flex: '0 0 auto',
              minWidth: '20%',
              padding: '12px 8px',
              background: tab === item.value ? '#667eea' : 'transparent',
              color: tab === item.value ? 'white' : '#666',
              fontWeight: tab === item.value ? 600 : 500,
              fontSize: 12,
              transition: 'all 0.2s',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            {item.label}
            {item.badge && item.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#ff4d4f',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 关系链 Tab */}
      {tab === 'team' && relationChain && (
        <div>
          {/* 上级链路 */}
          <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
            <div className="text-bold" style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⬆️</span> 上级链路
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 0,
                padding: '8px 0 12px',
                flexWrap: 'wrap',
                overflowX: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                {/* 当前用户 */}
                <div style={{ textAlign: 'center', minWidth: 70 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'white',
                      margin: '0 auto 6px',
                      boxShadow: '0 0 0 3px rgba(82, 196, 26, 0.2)',
                      position: 'relative'
                    }}
                  >
                    {(relationChain.user?.nickname || '我').charAt(0).toUpperCase()}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: '#52c41a',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 10,
                        border: '2px solid white'
                      }}
                    >
                      L{relationChain.user?.level || 0}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#52c41a' }}>
                    {relationChain.user?.nickname || '我'}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    当前用户
                  </div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                    累计消费 ¥{Number(0).toFixed(0)}
                  </div>
                </div>

                {/* 上级链路：L1 → L2 → L3 */}
                {upline.length === 0 ? (
                  <div
                    style={{
                      marginLeft: 16,
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)',
                      border: '1px solid #ffd591',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#d46b08',
                      alignSelf: 'center'
                    }}
                  >
                    👑 无上上级 · 创始人身份
                  </div>
                ) : (
                  upline.map((u, idx) => {
                    const color = getLevelColor(u.depth);
                    return (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ fontSize: 18, color: '#bbb', padding: '20px 2px 0' }}>
                          ←
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 70 }}>
                          <div style={{ position: 'relative', width: 52, margin: '0 auto 6px' }}>
                            {renderAvatar(u, 52, color.bg)}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                background: color.bg,
                                color: 'white',
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 10,
                                border: '2px solid white'
                              }}
                            >
                              L{u.depth}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {u.nickname || '用户'}
                          </div>
                          <div style={{ fontSize: 10, color: color.text, marginTop: 2 }}>
                            {u.relation}
                          </div>
                          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                            注册：{formatTime(u.registerTime)}
                          </div>
                          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                            ¥{Number(u.totalSpent || 0).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 下级团队 Tab切换列表 */}
          <div className="card" style={{ marginTop: 0 }}>
            <div
              className="text-bold"
              style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>🌳</span> 下级团队
            </div>

            {/* 搜索框 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: '#f5f5f5',
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <span style={{ color: '#999', fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="搜索昵称或手机号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  style={{
                    fontSize: 12,
                    color: '#999',
                    background: 'transparent'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 团队总览统计 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                marginBottom: 16
              }}
            >
              {[
                { label: 'L1人数', value: stats?.downlineL1Count || 0, color: '#667eea' },
                { label: 'L2人数', value: stats?.downlineL2Count || 0, color: '#f5576c' },
                { label: 'L3人数', value: stats?.downlineL3Count || 0, color: '#fa8c16' },
                { label: '月活跃', value: stats?.monthlyActive || 0, color: '#52c41a' }
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    textAlign: 'center',
                    padding: '10px 4px',
                    borderRadius: 10,
                    background: `${item.color}10`,
                    border: `1px solid ${item.color}30`
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* L1/L2/L3 Tab切换 */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                padding: 4,
                background: '#f5f5f5',
                borderRadius: 12
              }}
            >
              {([
                { key: '1', label: 'L1 直接推荐', count: stats?.downlineL1Count || 0, color: '#667eea' },
                { key: '2', label: 'L2 二级团队', count: stats?.downlineL2Count || 0, color: '#f5576c' },
                { key: '3', label: 'L3 三级团队', count: stats?.downlineL3Count || 0, color: '#fa8c16' }
              ] as const).map(item => (
                <button
                  key={item.key}
                  onClick={() => setTeamLevel(item.key)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    borderRadius: 8,
                    background: teamLevel === item.key ? 'white' : 'transparent',
                    color: teamLevel === item.key ? item.color : '#666',
                    fontSize: 12,
                    fontWeight: teamLevel === item.key ? 600 : 500,
                    boxShadow: teamLevel === item.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>
                    {item.count}人
                  </div>
                </button>
              ))}
            </div>

            {/* 列表展示 */}
            {(() => {
              const levelList = downline[teamLevel] || [];
              const kw = searchKeyword.toLowerCase().trim();
              const filteredList = kw
                ? levelList.filter((m: DownlineMember) =>
                    (m.nickname || '').toLowerCase().includes(kw) ||
                    (m.phone || '').includes(kw)
                  )
                : levelList;

              if (filteredList.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', fontSize: 13 }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👥</div>
                    {searchKeyword ? '未找到匹配的团队成员' : `L${teamLevel}暂无团队成员`}
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      {searchKeyword ? '试试其他关键词' : '快去邀请好友加入吧~'}
                    </div>
                  </div>
                );
              }

              const color = getLevelColor(Number(teamLevel));
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredList.map((member: DownlineMember, idx: number) => {
                    const level = Number(teamLevel);
                    const memberColor = getLevelColor(level);
                    return (
                      <div
                        key={member.id || idx}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          background: '#fafafa',
                          border: '1px solid #f0f0f0'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {renderAvatar(member, 44, memberColor.bg)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {member.nickname || '用户'}
                              </span>
                              <span
                                className="tag"
                                style={{
                                  background: memberColor.light,
                                  color: memberColor.text,
                                  border: `1px solid ${memberColor.border}`,
                                  fontSize: 10,
                                  padding: '1px 8px',
                                  fontWeight: 700
                                }}
                              >
                                🏆 L{level}
                              </span>
                              {member.isActive ? (
                                <span className="tag tag-green" style={{ fontSize: 10, padding: '1px 8px' }}>
                                  🟢 活跃
                                </span>
                              ) : (
                                <span className="tag tag-gray" style={{ fontSize: 10, padding: '1px 8px' }}>
                                  ⚪ 沉默
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                              📅 注册：{formatTime(member.registerTime)}
                              {member.phone && <span style={{ marginLeft: 8 }}>📱 {member.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>}
                            </div>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '8px 12px',
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: '1px dashed #eee'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 10, color: '#999' }}>💰 累计消费</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginTop: 2 }}>
                                  ¥{Number(member.totalSpent || 0).toFixed(0)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#999' }}>💸 贡献佣金</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: memberColor.text, marginTop: 2 }}>
                                  +¥{Number(member.contributedCommission || 0).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#999' }}>📊 近30天订单</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#667eea', marginTop: 2 }}>
                                  {member.recentOrderCount || 0}单
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 佣金流水 Tab */}
      {tab === 'records' && (
        <div>
          {/* 顶部统计 */}
          <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 佣金统计</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: 14, background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#667eea' }}>累计佣金</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#667eea', marginTop: 4 }}>
                  ¥{commissionStats.totalCommission.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: 14, background: 'linear-gradient(135deg, #f6ffed, #d9f7be)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#52c41a' }}>已到账</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                  ¥{commissionStats.settledAmount.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: 14, background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#fa8c16' }}>待结算</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fa8c16', marginTop: 4 }}>
                  ¥{commissionStats.pendingAmount.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: 14, background: 'linear-gradient(135deg, #fff0f6, #ffd6e7)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#f5576c' }}>预计明日到账</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f5576c', marginTop: 4 }}>
                  ¥{commissionStats.tomorrowExpected.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="card" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>💸 佣金流水</div>
              <button
                onClick={() => setShowFilter(!showFilter)}
                style={{
                  fontSize: 12,
                  color: showFilter ? '#667eea' : '#666',
                  background: 'transparent',
                  fontWeight: 500
                }}
              >
                {showFilter ? '收起筛选' : '筛选'} ▾
              </button>
            </div>

            {showFilter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>状态筛选</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: '全部' },
                      { key: 'pending', label: '待结算' },
                      { key: 'settled', label: '已到账' },
                      { key: 'reversed', label: '已追回' },
                      { key: 'failed', label: '结算失败' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setStatusFilter(item.key as StatusFilter)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 16,
                          fontSize: 12,
                          background: statusFilter === item.key ? '#667eea' : 'white',
                          color: statusFilter === item.key ? 'white' : '#666',
                          border: `1px solid ${statusFilter === item.key ? '#667eea' : '#e8e8e8'}`
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>级别筛选</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { key: 'all', label: '全部级别' },
                      { key: '1', label: 'L1' },
                      { key: '2', label: 'L2' },
                      { key: '3', label: 'L3' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setLevelFilter(item.key as LevelFilter)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 16,
                          fontSize: 12,
                          background: levelFilter === item.key ? '#667eea' : 'white',
                          color: levelFilter === item.key ? 'white' : '#666',
                          border: `1px solid ${levelFilter === item.key ? '#667eea' : '#e8e8e8'}`
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 流水列表 */}
            {loading ? (
              <div className="empty-state">
                <div className="icon">⏳</div>加载中...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="empty-state">
                <div className="icon">💰</div>暂无佣金记录
                <div style={{ fontSize: 12, marginTop: 8 }}>邀请好友下单，即可获得佣金返利</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRecords.map((r, i) => {
                  const color = getLevelColor(r.level);
                  const isAbnormal = r.status === 'failed' || r.status === 'reversed';
                  return (
                    <div
                      key={r.id || i}
                      style={{
                        padding: 14,
                        background: isAbnormal ? '#fff1f0' : '#fafafa',
                        borderRadius: 12,
                        border: isAbnormal ? '1px solid #ffa39e50' : '1px solid #f0f0f0'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {renderAvatar(
                          { nickname: r.from_nickname, avatar: r.from_avatar } as UserBase,
                          40,
                          color.bg
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>
                                  来自 {r.from_nickname || '好友'}
                                </span>
                                <span
                                  className="tag"
                                  style={{
                                    background: color.light,
                                    color: color.text,
                                    border: `1px solid ${color.border}`,
                                    fontSize: 10,
                                    padding: '1px 8px',
                                    fontWeight: 700
                                  }}
                                >
                                  {getLevelLabel(r.level)}
                                </span>
                                <span className={`tag ${getCommissionStatusCls(r.status)}`} style={{ fontSize: 10, padding: '1px 8px' }}>
                                  {getCommissionStatusLabel(r.status)}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                🛒 {r.product_name || '商品'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div
                                style={{
                                  color: isAbnormal ? '#cf1322' : '#ff4d4f',
                                  fontWeight: 700,
                                  fontSize: 16,
                                  textDecoration: isAbnormal ? 'line-through' : 'none'
                                }}
                              >
                                {isAbnormal ? '-' : '+'}¥{Number(r.amount).toFixed(2)}
                              </div>
                              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                {formatRelativeTime(r.created_at)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            {r.status === 'pending' && settlementPolicy && (
                              <span style={{ fontSize: 11, color: '#fa8c16' }}>
                                📅 预计 {formatSettleTime(r.created_at, settlementPolicy.settlementDelay)} 到账
                              </span>
                            )}
                            {r.status === 'settled' && r.settled_at && (
                              <span style={{ fontSize: 11, color: '#52c41a' }}>
                                ✅ {formatRelativeTime(r.settled_at)} 到账
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#bbb' }}>
                              {formatDateTime(r.created_at)}
                            </span>
                          </div>

                          {isAbnormal && (
                            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openAppealModal(r.id)}
                                disabled={appealingId === r.id}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                                  color: 'white',
                                  fontSize: 12,
                                  fontWeight: 600
                                }}
                              >
                                📞 提交申诉
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 复查记录 Tab */}
      {tab === 'reviews' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>🔍 返佣复查记录</div>
            {pendingReviewCount > 0 && (
              <span className="tag tag-orange" style={{ fontSize: 11 }}>
                {pendingReviewCount} 条待复核
              </span>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="icon">⏳</div>加载中...
            </div>
          ) : reviewRecords.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>暂无复查记录
              <div style={{ fontSize: 12, marginTop: 8 }}>佣金异常会在此处显示，可提交申诉</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviewRecords.map(record => (
                <div
                  key={record.id}
                  style={{
                    padding: 14,
                    background: record.status === 'pending' ? '#fff7e6' : '#fafafa',
                    borderRadius: 12,
                    border: `1px solid ${record.status === 'pending' ? '#ffd591' : '#f0f0f0'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          订单 {record.orderId}
                        </span>
                        <span className={`tag ${getReviewReasonCls(record.reasonType)}`} style={{ fontSize: 10 }}>
                          {getReviewReasonLabel(record.reasonType)}
                        </span>
                        <span className={`tag ${getReviewStatusCls(record.status)}`} style={{ fontSize: 10 }}>
                          {getReviewStatusLabel(record.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        {formatDateTime(record.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#999' }}>原佣金金额</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a', marginTop: 2 }}>
                        ¥{Number(record.originalAmount).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#999' }}>调整后金额</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: record.adjustedAmount < record.originalAmount ? '#ff4d4f' : '#52c41a', marginTop: 2 }}>
                        ¥{Number(record.adjustedAmount).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#999' }}>差额</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f', marginTop: 2 }}>
                        {(record.adjustedAmount - record.originalAmount >= 0 ? '+' : '')}
                        ¥{Number(record.adjustedAmount - record.originalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'white',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#666',
                      marginBottom: 10
                    }}
                  >
                    <strong>原因：</strong>{record.reason}
                  </div>

                  {record.status === 'pending' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openAppealModal(record.commissionId)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        📝 提交申诉
                      </button>
                    </div>
                  )}

                  {record.status === 'rejected' && record.appealReason && (
                    <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                      申诉理由：{record.appealReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 订单失败复查 Tab */}
      {tab === 'failures' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>📜 订单失败复查</div>
            {orderFailures.filter(f => f.processStatus === 'pending').length > 0 && (
              <span className="tag tag-orange" style={{ fontSize: 11 }}>
                {orderFailures.filter(f => f.processStatus === 'pending').length} 条待处理
              </span>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="icon">⏳</div>加载中...
            </div>
          ) : orderFailures.length === 0 ? (
            <div className="empty-state">
              <div className="icon">✅</div>暂无订单失败记录
              <div style={{ fontSize: 12, marginTop: 8 }}>订单失败导致的佣金调整会在此处显示</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orderFailures.sort((a, b) => b.created_at - a.created_at).map(record => {
                const color = getLevelColor(record.level);
                return (
                  <div
                    key={record.id}
                    style={{
                      padding: 14,
                      background: record.processStatus === 'pending' ? '#fff7e6' : '#fafafa',
                      borderRadius: 12,
                      border: `1px solid ${record.processStatus === 'pending' ? '#ffd591' : '#f0f0f0'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#667eea', textDecoration: 'underline' }}
                            onClick={() => navigate(`/order/${record.orderId}`)}
                          >
                            订单 {record.orderId}
                          </span>
                          <span
                            className="tag"
                            style={{
                              background: color.light,
                              color: color.text,
                              border: `1px solid ${color.border}`,
                              fontSize: 10,
                              padding: '1px 8px',
                              fontWeight: 700
                            }}
                          >
                            {getLevelLabel(record.level)}
                          </span>
                          <span className={`tag ${getFailureStatusCls(record.processStatus)}`} style={{ fontSize: 10 }}>
                            {getFailureStatusLabel(record.processStatus)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          {formatRelativeTime(record.created_at)} · {formatDateTime(record.created_at)}
                        </div>
                      </div>
                    </div>

                    {record.from_nickname && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        👤 来源用户：{record.from_nickname}
                      </div>
                    )}
                    {record.product_name && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        🛒 商品：{record.product_name}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#999' }}>失败原因</div>
                        <div style={{ fontSize: 12, color: '#cf1322', marginTop: 2, fontWeight: 500 }}>
                          ⚠️ {record.failReason}
                        </div>
                      </div>
                      <div style={{ flex: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#999' }}>影响佣金</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f', marginTop: 2 }}>
                          -¥{Number(record.affectedAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/order/${record.orderId}`)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          background: '#f5f5f5',
                          color: '#666',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        🔗 查看订单详情
                      </button>
                      {record.processStatus === 'pending' && (
                        <button
                          onClick={() => openAppealModal(record.commissionId)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          📝 提交申诉
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 结算政策 Tab */}
      {tab === 'policy' && settlementPolicy && (
        <div className="card" style={{ marginTop: 16 }}>
          <div
            className="text-bold"
            style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📜</span> 结算政策说明
          </div>

          {renderSettlementTimeline()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { icon: '⏰', label: '结算周期', value: `T+${settlementPolicy.settlementDelay}${settlementPolicy.settlementUnit}`, tip: '订单完成后开始计时' },
              { icon: '🕐', label: '每日结算时间', value: settlementPolicy.dailySettlementTime || '凌晨02:00', tip: '系统自动执行结算' },
              { icon: '💵', label: '最低提现金额', value: `¥${settlementPolicy.minWithdraw}`, tip: '满额即可发起提现' },
              { icon: '📊', label: '提现手续费', value: `${(settlementPolicy.withdrawFee * 100).toFixed(0)}%`, tip: '按提现金额收取，最低1元' },
              { icon: '🏦', label: '到账渠道', value: settlementPolicy.payoutChannel, tip: '多种方式自由选择' },
              { icon: '🎉', label: '节假日说明', value: settlementPolicy.holidayPolicy, tip: '耐心等待即可' }
            ].map((item, idx) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '14px 0',
                  borderBottom: idx === 5 ? 'none' : '1px dashed #f0f0f0',
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#667eea' }}>{item.value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{item.tip}</div>
                </div>
              </div>
            ))}
          </div>

          {rates && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: 'linear-gradient(135deg, #f0f4ff 0%, #fff0f6 50%, #fffbe6 100%)',
                borderRadius: 12
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                🎁 三级佣金返利比例
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { lvl: 1, rate: rates.level1, color: '#667eea', label: '直接推荐' },
                  { lvl: 2, rate: rates.level2, color: '#f5576c', label: '二级团队' },
                  { lvl: 3, rate: rates.level3, color: '#fa8c16', label: '三级团队' }
                ].map(item => (
                  <div
                    key={item.lvl}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '10px 4px',
                      background: 'white',
                      borderRadius: 10
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 10,
                        background: `${item.color}15`,
                        color: item.color,
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 6
                      }}
                    >
                      L{item.lvl}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
                      {(item.rate * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="divider" style={{ margin: '16px 0' }} />

          <div
            style={{
              padding: 12,
              background: '#fafafa',
              borderRadius: 10,
              fontSize: 12,
              color: '#666',
              lineHeight: 1.8
            }}
          >
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 6 }}>📖 详细说明</div>
            {settlementPolicy.description}
          </div>
        </div>
      )}

      {/* 申诉弹窗 */}
      {showAppealModal && (
        <div className="modal-mask" onClick={() => setShowAppealModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              📝 提交申诉
            </div>

            <div className="form-group">
              <label className="form-label">申诉理由</label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="请详细描述申诉理由..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  fontSize: 14,
                  background: '#fafafa',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">凭证说明（选填）</label>
              <input
                type="text"
                value={appealEvidence}
                onChange={(e) => setAppealEvidence(e.target.value)}
                placeholder="订单号、截图描述等"
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setShowAppealModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  background: '#f5f5f5',
                  color: '#666',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                取消
              </button>
              <button
                onClick={submitAppeal}
                disabled={submittingAppeal || !appealReason.trim()}
                style={{
                  flex: 2,
                  padding: 12,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {submittingAppeal ? '提交中...' : '提交申诉'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 30px', textAlign: 'center', fontSize: 12, color: '#bbb' }}>
        —— 邀请更多好友，一起赚佣金 ——
        <div>
          <button
            className="btn-primary mt-16"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/share')}
          >
            🎁 去邀请好友
          </button>
        </div>
      </div>
    </div>
  );
}