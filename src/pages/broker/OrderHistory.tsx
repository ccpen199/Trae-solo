import { useEffect, useState } from 'react';
import {
  Search, Filter, Star, Clock, CheckCircle, XCircle, ArrowUpRight,
  Building2, Briefcase, User, DollarSign, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import type { InterviewOrder } from '@shared/types';
import { cn } from '@/lib/utils';

type TabKey = 'all' | 'completed' | 'inProgress';

interface OrderReview {
  rating: number;
  tags: string[];
  comment: string;
  reviewedAt: string;
}

interface HistoryOrder extends InterviewOrder {
  factoryLogo?: string;
  workerAvatar?: string;
  workerAge?: number;
  workerGender?: 'male' | 'female';
  completedAt?: string;
  review?: OrderReview;
}

const mockOrders: HistoryOrder[] = [
  {
    id: 'ORD20260615001', workerId: 'W101', workerName: '李明华', workerPhone: '138****2345', workerAge: 28, workerGender: 'male',
    jobId: 'J201', jobTitle: '电子装配工', factoryId: 'F201', factoryName: '立讯精密电子（苏州）',
    scheduledDate: '2026-06-15', status: 'employed', serviceFee: 180,
    timeline: [], createdAt: '2026-06-15T06:00:00Z', completedAt: '2026-06-15T17:30:00Z',
    review: { rating: 5, tags: ['准时到达', '服务专业', '沟通顺畅'], comment: '张经纪人非常专业，全程陪同，工人顺利入职！', reviewedAt: '2026-06-16T10:20:00Z' },
  },
  {
    id: 'ORD20260614002', workerId: 'W102', workerName: '王桂芳', workerPhone: '139****6789', workerAge: 35, workerGender: 'female',
    jobId: 'J202', jobTitle: '品检员', factoryId: 'F202', factoryName: '富士康科技（昆山）',
    scheduledDate: '2026-06-14', status: 'employed', serviceFee: 200,
    timeline: [], createdAt: '2026-06-14T06:30:00Z', completedAt: '2026-06-14T18:00:00Z',
    review: { rating: 5, tags: ['车接车送', '耐心细致'], comment: '服务态度很好，提前到达接人点，为工人考虑周全', reviewedAt: '2026-06-15T09:10:00Z' },
  },
  {
    id: 'ORD20260613003', workerId: 'W103', workerName: '张铁柱', workerPhone: '137****1234', workerAge: 42, workerGender: 'male',
    jobId: 'J203', jobTitle: '叉车司机', factoryId: 'F203', factoryName: '顺丰速运仓储中心',
    scheduledDate: '2026-06-13', status: 'employed', serviceFee: 260,
    timeline: [], createdAt: '2026-06-13T05:45:00Z', completedAt: '2026-06-13T16:45:00Z',
    review: { rating: 4, tags: ['专业靠谱'], comment: '整体不错，希望下次可以提前沟通更多岗位细节', reviewedAt: '2026-06-14T14:30:00Z' },
  },
  {
    id: 'ORD20260612004', workerId: 'W104', workerName: '赵小花', workerPhone: '136****5678', workerAge: 24, workerGender: 'female',
    jobId: 'J204', jobTitle: '包装工', factoryId: 'F204', factoryName: '宝洁日化（无锡）',
    scheduledDate: '2026-06-12', status: 'passed', serviceFee: 160,
    timeline: [], createdAt: '2026-06-12T07:00:00Z',
  },
  {
    id: 'ORD20260611005', workerId: 'W105', workerName: '孙大强', workerPhone: '135****9012', workerAge: 31, workerGender: 'male',
    jobId: 'J205', jobTitle: 'CNC操作员', factoryId: 'F205', factoryName: '比亚迪汽车（上海）',
    scheduledDate: '2026-06-11', status: 'failed', serviceFee: 280,
    timeline: [], createdAt: '2026-06-11T06:15:00Z', completedAt: '2026-06-11T15:00:00Z',
  },
  {
    id: 'ORD20260610006', workerId: 'W106', workerName: '周建国', workerPhone: '134****3456', workerAge: 38, workerGender: 'male',
    jobId: 'J206', jobTitle: '仓储管理员', factoryId: 'F206', factoryName: '京东物流（杭州）',
    scheduledDate: '2026-06-10', status: 'employed', serviceFee: 220,
    timeline: [], createdAt: '2026-06-10T05:30:00Z', completedAt: '2026-06-10T17:00:00Z',
    review: { rating: 5, tags: ['准时到达', '服务专业', '沟通顺畅', '车接车送'], comment: '非常满意的服务体验，已推荐给同乡工友', reviewedAt: '2026-06-11T11:45:00Z' },
  },
  {
    id: 'ORD20260619007', workerId: 'W107', workerName: '吴秀兰', workerPhone: '133****7890', workerAge: 29, workerGender: 'female',
    jobId: 'J207', jobTitle: '缝纫工', factoryId: 'F207', factoryName: '申洲针织（宁波）',
    scheduledDate: '2026-06-19', status: 'interviewing', serviceFee: 190,
    timeline: [], createdAt: '2026-06-19T07:30:00Z',
  },
  {
    id: 'ORD20260619008', workerId: 'W108', workerName: '郑德胜', workerPhone: '132****1122', workerAge: 33, workerGender: 'male',
    jobId: 'J208', jobTitle: '电焊工', factoryId: 'F208', factoryName: '中集集装箱（太仓）',
    scheduledDate: '2026-06-19', status: 'training_done', serviceFee: 320,
    timeline: [], createdAt: '2026-06-19T06:45:00Z',
  },
  {
    id: 'ORD20260608009', workerId: 'W109', workerName: '钱丽娟', workerPhone: '131****3344', workerAge: 26, workerGender: 'female',
    jobId: 'J209', jobTitle: '质检员', factoryId: 'F209', factoryName: '蓝思科技（苏州）',
    scheduledDate: '2026-06-08', status: 'employed', serviceFee: 210,
    timeline: [], createdAt: '2026-06-08T06:00:00Z', completedAt: '2026-06-08T17:45:00Z',
    review: { rating: 4, tags: ['服务专业'], comment: '服务到位，面试过程顺利，岗位与描述一致', reviewedAt: '2026-06-09T16:20:00Z' },
  },
  {
    id: 'ORD20260619010', workerId: 'W110', workerName: '冯志明', workerPhone: '130****5566', workerAge: 36, workerGender: 'male',
    jobId: 'J210', jobTitle: '普工', factoryId: 'F210', factoryName: '纬创资通（昆山）',
    scheduledDate: '2026-06-19', status: 'arrived', serviceFee: 150,
    timeline: [], createdAt: '2026-06-19T08:00:00Z',
  },
];

const tabs: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: '全部订单', icon: Briefcase },
  { key: 'completed', label: '已完成', icon: CheckCircle },
  { key: 'inProgress', label: '进行中', icon: Clock },
];

function getStatusBadge(status: HistoryOrder['status']) {
  const map: Record<HistoryOrder['status'], { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: '待接单', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
    broker_assigned: { label: '已接单', cls: 'bg-blue-50 text-blue-600 border-blue-200', icon: CheckCircle },
    pickup_scheduled: { label: '已派车', cls: 'bg-purple-50 text-purple-600 border-purple-200', icon: ArrowUpRight },
    arrived: { label: '已到达', cls: 'bg-brand-50 text-brand-600 border-brand-200', icon: Building2 },
    documents_copied: { label: '证件办理', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Tag },
    training_done: { label: '培训完成', cls: 'bg-warning-50 text-warning-600 border-warning-200', icon: CheckCircle },
    interviewing: { label: '面试中', cls: 'bg-accent-50 text-accent-600 border-accent-200', icon: Briefcase },
    passed: { label: '面试通过', cls: 'bg-success-50 text-success-600 border-success-200', icon: CheckCircle },
    failed: { label: '未通过', cls: 'bg-danger-50 text-danger-600 border-danger-200', icon: XCircle },
    employed: { label: '已入职', cls: 'bg-success-100 text-success-700 border-success-300', icon: CheckCircle },
  };
  return map[status] || map.pending;
}

function getFilteredCount(orders: HistoryOrder[], key: TabKey) {
  if (key === 'all') return orders.length;
  if (key === 'completed') return orders.filter(o => ['employed', 'passed', 'failed'].includes(o.status)).length;
  return orders.filter(o => !['employed', 'passed', 'failed'].includes(o.status)).length;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    fetch('/api/brokers/B001/orders')
      .then(r => r.json())
      .then(res => { if (res.success && res.data?.length) setOrders(res.data); else setOrders(mockOrders); })
      .catch(() => setOrders(mockOrders));
  }, []);

  const filtered = orders.filter(o => {
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'completed' ? ['employed', 'passed', 'failed'].includes(o.status) :
      !['employed', 'passed', 'failed'].includes(o.status);
    const matchSearch = !search ||
      o.factoryName.includes(search) ||
      o.workerName.includes(search) ||
      o.jobTitle.includes(search) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchDate = dateRange === 'all' ? true :
      (() => {
        const days = dateRange === '7d' ? 7 : 30;
        const dt = new Date(o.createdAt).getTime();
        const now = Date.now();
        return now - dt <= days * 86400000;
      })();
    return matchTab && matchSearch && matchDate;
  });

  const stats = {
    totalEarning: orders.filter(o => ['employed', 'passed'].includes(o.status)).reduce((s, o) => s + (o.serviceFee || 0), 0),
    completedCount: orders.filter(o => ['employed', 'passed'].includes(o.status)).length,
    avgRating: (() => {
      const reviews = orders.filter(o => o.review);
      if (!reviews.length) return 0;
      return (reviews.reduce((s, o) => s + (o.review!.rating), 0) / reviews.length).toFixed(1);
    })(),
    totalCount: orders.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">订单历史</h1>
            <p className="text-gray-500 mt-1">查看所有服务订单与评价记录</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as typeof dateRange)}
              className="input-field w-36"
            >
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="all">全部</option>
            </select>
            <button className="btn-primary">
              <Filter className="w-4 h-4" />
              高级筛选
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm text-gray-500 mb-2">累计订单</div>
            <div className="text-3xl font-bold text-brand-700">{stats.totalCount}</div>
            <div className="text-xs text-gray-400 mt-2">接单以来总计</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-500 mb-2">成功入职</div>
            <div className="text-3xl font-bold text-success-600">{stats.completedCount}</div>
            <div className="text-xs text-success-500 mt-2">成功率 {stats.totalCount ? Math.round(stats.completedCount / stats.totalCount * 100) : 0}%</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-500 mb-2">累计收入</div>
            <div className="text-3xl font-bold text-accent-600">¥{stats.totalEarning.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-2">已完成订单服务费</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-500 mb-2">平均服务评分</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-warning-600">{stats.avgRating || '-'}</div>
              <div className="flex mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={cn('w-4 h-4', i <= Math.round(Number(stats.avgRating)) ? 'fill-warning-500 text-warning-500' : 'text-gray-300')} />
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">基于 {orders.filter(o => o.review).length} 条评价</div>
          </div>
        </div>

        <div className="card p-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const count = getFilteredCount(orders, tab.key);
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                      active ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={cn('px-2 py-0.5 rounded-full text-xs', active ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索工厂/工人/岗位/订单号"
                className="input-field pl-10 w-80"
              />
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">订单信息</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">工厂/岗位</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">工人信息</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">服务费</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">服务评价</th>
                <th className="w-12 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => {
                const badge = getStatusBadge(order.status);
                const BadgeIcon = badge.icon;
                const isExpand = expanded === order.id;
                return (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isExpand ? null : order.id)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-mono text-sm text-brand-600 font-semibold">{order.id}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {order.completedAt && (
                            <div className="text-xs text-success-600 mt-0.5">完成：{new Date(order.completedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0">
                            {order.factoryName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">{order.factoryName}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              {order.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0', order.workerGender === 'female' ? 'bg-pink-500' : 'bg-blue-500')}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.workerName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{order.workerPhone} · {order.workerAge || '-'}岁</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-accent-500" />
                          <span className="text-xl font-bold text-accent-600">¥{order.serviceFee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium', badge.cls)}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.review ? (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={cn('w-3.5 h-3.5', i <= order.review!.rating ? 'fill-warning-500 text-warning-500' : 'text-gray-300')} />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{order.review.rating}.0</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {order.review.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-success-50 text-success-700 rounded text-[11px]">{tag}</span>
                              ))}
                              {order.review.tags.length > 2 && <span className="text-[11px] text-gray-400">+{order.review.tags.length - 2}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">暂无评价</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isExpand ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </td>
                    </tr>
                    {isExpand && (
                      <tr className="bg-brand-50/30">
                        <td colSpan={7} className="px-6 py-6">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <div className="section-title mb-4">订单时间线</div>
                              <div className="relative pl-6 space-y-3">
                                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-gray-200"></div>
                                {[
                                  { t: new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), label: '订单创建', done: true },
                                  { t: '07:30', label: '车接车送', done: order.status !== 'pending' && order.status !== 'broker_assigned' },
                                  { t: '09:00', label: '到达工厂', done: ['arrived', 'documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status) },
                                  { t: '09:30', label: '证件办理', done: ['documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status) },
                                  { t: '10:30', label: '岗前培训', done: ['training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status) },
                                  { t: '13:30', label: '面试', done: ['interviewing', 'passed', 'failed', 'employed'].includes(order.status) },
                                  { t: '16:00', label: order.status === 'failed' ? '面试未通过' : (order.status === 'employed' ? '办理入职' : '等待结果'), done: ['passed', 'failed', 'employed'].includes(order.status) },
                                ].map((ev, idx) => (
                                  <div key={idx} className="relative">
                                    <div className={cn('absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2', ev.done ? 'bg-success-500 border-success-500' : 'bg-white border-gray-300')}></div>
                                    <div className="flex items-center justify-between">
                                      <span className={cn('text-sm', ev.done ? 'text-gray-900 font-medium' : 'text-gray-400')}>{ev.label}</span>
                                      <span className="text-xs text-gray-400">{ev.t}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="section-title mb-4">服务详情</div>
                              <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-500">预约面试日期</span>
                                  <span className="font-medium">{order.scheduledDate}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-500">服务时长</span>
                                  <span className="font-medium">约 10 小时</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-500">包含服务</span>
                                  <span className="font-medium text-right text-sm">车接车送 · 证件办理<br/>培训陪同 · 面试跟进</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-500">服务费</span>
                                  <span className="font-bold text-accent-600">¥{order.serviceFee}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                  <span className="text-gray-500">结算状态</span>
                                  <span className={cn('px-2.5 py-1 rounded text-xs font-medium', ['employed', 'passed'].includes(order.status) ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500')}>
                                    {['employed', 'passed'].includes(order.status) ? '已结算' : '待结算'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="section-title mb-4">
                                评价反馈
                              </div>
                              {order.review ? (
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1">
                                      {[1,2,3,4,5].map(i => (
                                        <Star key={i} className={cn('w-5 h-5', i <= order.review!.rating ? 'fill-warning-500 text-warning-500' : 'text-gray-300')} />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(order.review.reviewedAt).toLocaleDateString('zh-CN')}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{order.review.comment}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {order.review.tags.map(tag => (
                                      <span key={tag} className="px-3 py-1 bg-success-50 text-success-700 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center">
                                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-3">
                                    <Star className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <div className="text-gray-500 text-sm">暂无服务评价</div>
                                  <div className="text-xs text-gray-400 mt-1">订单完成后由工人或工厂评价</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg">暂无匹配订单</p>
                      <p className="text-sm mt-1">尝试修改筛选条件</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {filtered.length} 条订单</span>
              <div className="flex items-center gap-1">
                {['<', '1', '2', '3', '>'].map((p, i) => (
                  <button
                    key={i}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      p === '1' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
