import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  UserCheck,
  Package,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeWorkOrderItem, unwrapApiData } from '@/lib/api';

export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'closed';

export interface WorkOrderItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: WorkOrderStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createTime: string;
  updateTime: string;
  handler?: string;
  expectedDays?: number;
}

export const statusConfig = {
  pending: { label: '待受理', icon: Circle, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  processing: { label: '处理中', icon: Package, bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' },
  completed: { label: '已完成', icon: CheckCircle2, bg: 'bg-green-100', text: 'text-green-600', dot: 'bg-green-500' },
  closed: { label: '已归档', icon: UserCheck, bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-500' },
};

export const priorityConfig = {
  low: { label: '低', color: 'text-gray-500' },
  normal: { label: '普通', color: 'text-blue-500' },
  high: { label: '高', color: 'text-warm-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
};

const tabs = [
  { key: 'all', label: '全部工单', icon: ClipboardList },
  { key: 'pending', label: '待受理', icon: Clock },
  { key: 'processing', label: '处理中', icon: Package },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
];

const mockOrders: WorkOrderItem[] = [
  { id: 'WO202506200001', title: '亭湖区青年中路路灯不亮', description: '青年中路与解放南路交叉口向东约50米处，路灯连续3天不亮，影响夜间出行安全。', category: '城市管理', status: 'processing', priority: 'high', createTime: '2025-06-20 09:15', updateTime: '2025-06-20 14:30', handler: '城管局张工', expectedDays: 3 },
  { id: 'WO202506190008', title: '小区楼下噪音扰民', description: '城南新区某小区楼下烧烤店夜间营业噪音较大，影响居民正常休息。', category: '环境保护', status: 'pending', priority: 'normal', createTime: '2025-06-19 22:40', updateTime: '2025-06-19 22:40', expectedDays: 5 },
  { id: 'WO202506180015', title: '社保缴费查询问题', description: '网上查询社保缴费记录时，近3个月数据显示异常，希望核实。', category: '社会保障', status: 'completed', priority: 'normal', createTime: '2025-06-18 10:20', updateTime: '2025-06-19 16:00', handler: '人社局李工' },
  { id: 'WO202506170003', title: '道路井盖缺失需及时更换', description: '盐都区新都路与解放路交叉口非机动车道井盖缺失，存在安全隐患。', category: '城市管理', status: 'completed', priority: 'urgent', createTime: '2025-06-17 15:30', updateTime: '2025-06-17 18:00', handler: '住建局王工' },
  { id: 'WO202506160022', title: '高龄补贴申请流程咨询', description: '家中老人年满80周岁，想咨询高龄补贴申请条件和所需材料。', category: '民政服务', status: 'closed', priority: 'low', createTime: '2025-06-16 09:00', updateTime: '2025-06-17 10:30', handler: '民政局刘工' },
];

export default function WorkOrderList() {
  const [orders, setOrders] = useState<WorkOrderItem[]>(mockOrders);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('全部');

  const categories = ['全部', '城市管理', '社会保障', '民政服务', '环境保护', '政务咨询', '其他'];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeTab !== 'all') {
          params.set('status', activeTab);
        }

        const query = params.toString();
        const res = await fetch(`/api/workorders${query ? `?${query}` : ''}`);
        if (res.ok) {
          const payload = await res.json() as any;
          const list = unwrapApiData<{ list?: any[] }>(payload)?.list;
          if (Array.isArray(list) && list.length > 0) {
            setOrders(list.map(normalizeWorkOrderItem));
          }
        }
      } catch {
        /* use mock */
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchOrders();
  }, [activeTab, keyword, category]);

  const filtered = orders.filter((o) => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    if (category !== '全部' && o.category !== category) return false;
    if (keyword && !o.title.includes(keyword) && !o.id.includes(keyword)) return false;
    return true;
  });

  const stats = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">工单中心</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-gov-600" />
            工单中心
          </h1>
          <p className="section-subtitle">提交诉求、查询进度、评价反馈</p>
        </div>
        <Link to="/workorders/submit" className="btn-primary">
          <Plus className="w-5 h-5" />
          提交新诉求
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'card p-4 text-left transition-all',
                active ? 'ring-2 ring-gov-400 border-gov-200' : 'hover:-translate-y-0.5',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-5 h-5', active ? 'text-gov-600' : 'text-gray-400')} />
                <span className={cn('text-2xl font-bold', active ? 'text-gov-600' : 'text-gray-800')}>
                  {stats[tab.key as keyof typeof stats]}
                </span>
              </div>
              <p className={cn('text-sm', active ? 'text-gov-600 font-medium' : 'text-gray-500')}>
                {tab.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索工单编号或标题..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={
                  category === cat
                    ? 'px-3.5 py-1.5 rounded-lg bg-gov-500 text-white text-sm font-medium transition-all'
                    : 'px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all'
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="w-20 h-8 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-20 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无符合条件的工单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, idx) => {
            const status = statusConfig[order.status];
            const priority = priorityConfig[order.priority];
            const StatusIcon = status.icon;
            return (
              <Link
                key={order.id}
                to={`/workorders/${order.id}`}
                className="card p-5 block hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900 hover:text-gov-600 transition-colors">
                        {order.title}
                      </h3>
                      <span className={cn('w-2 h-2 rounded-full', status.dot)} />
                      <span className={cn('chip', status.bg, status.text)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                      <span className={cn('chip bg-gray-100', priority.color)}>
                        {priority.label}优先级
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{order.description}</p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
                      <span>工单号：{order.id}</span>
                      <span>分类：{order.category}</span>
                      <span>提交时间：{order.createTime}</span>
                      {order.handler && <span>处理人：{order.handler}</span>}
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                    <span className="text-xs text-gray-400">更新于 {order.updateTime}</span>
                    <span className="text-sm text-gov-600 font-medium flex items-center gap-1">
                      查看详情 <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
