import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Search, Filter, Clock, ArrowUpRight, Eye, User, Building2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TREND_DATA = [
  { week: '5月第1周', 新增: 5, 结案: 3 },
  { week: '5月第2周', 新增: 8, 结案: 6 },
  { week: '5月第3周', 新增: 4, 结案: 5 },
  { week: '5月第4周', 新增: 7, 结案: 4 },
  { week: '6月第1周', 新增: 6, 结案: 7 },
  { week: '6月第2周', 新增: 3, 结案: 5 },
];

const MOCK_DISPUTES = [
  {
    id: 'DSP-20260601',
    createdAt: '2026-06-01',
    address: '朝阳区望京花园东区3-2-1801',
    category: '质量',
    owner: '刘女士',
    company: '锦华装饰',
    status: 'new',
    handler: '—',
    slaHours: 48,
  },
  {
    id: 'DSP-20260528',
    createdAt: '2026-05-28',
    address: '海淀区中关村南大街甲18号',
    category: '工期',
    owner: '王先生',
    company: '东易日盛',
    status: 'mediating',
    handler: '张调解员',
    slaHours: 24,
  },
  {
    id: 'DSP-20260520',
    createdAt: '2026-05-20',
    address: '丰台区丽泽SOHO A座2305',
    category: '价格',
    owner: '陈先生',
    company: '业之峰装饰',
    status: 'arbitrating',
    handler: '李调解员',
    slaHours: 0,
  },
  {
    id: 'DSP-20260510',
    createdAt: '2026-05-10',
    address: '西城区金融街融达国际1602',
    category: '材料',
    owner: '赵女士',
    company: '龙发装饰',
    status: 'closed',
    handler: '王调解员',
    slaHours: 0,
  },
  {
    id: 'DSP-20260505',
    createdAt: '2026-05-05',
    address: '通州区运河核心区II-05地块',
    category: '服务',
    owner: '孙先生',
    company: '今朝装饰',
    status: 'responding',
    handler: '—',
    slaHours: 12,
  },
];

type StatusFilter = 'all' | 'new' | 'responding' | 'mediating' | 'arbitrating' | 'closed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: '新建', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
  responding: { label: '待响应', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  mediating: { label: '调解中', color: 'text-terracotta-700', bgColor: 'bg-terracotta-50 border-terracotta-200' },
  arbitrating: { label: '仲裁中', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  closed: { label: '已结案', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
};

export default function DisputeList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_DISPUTES.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.id.includes(search) && !d.address.includes(search) && !d.owner.includes(search) && !d.company.includes(search)) return false;
    return true;
  });

  const stats = {
    pending: MOCK_DISPUTES.filter((d) => d.status === 'new').length,
    mediating: MOCK_DISPUTES.filter((d) => d.status === 'mediating').length,
    arbitrating: MOCK_DISPUTES.filter((d) => d.status === 'arbitrating').length,
    closeRate: Math.round((MOCK_DISPUTES.filter((d) => d.status === 'closed').length / MOCK_DISPUTES.length) * 100),
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="section-title">纠纷工单管理</h1>
        <p className="section-subtitle">装修纠纷在线调解工作流</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '待处理纠纷', value: stats.pending, color: 'from-rose-500 to-rose-600', icon: AlertTriangle },
          { label: '调解中', value: stats.mediating, color: 'from-terracotta-400 to-terracotta-600', icon: Clock },
          { label: '仲裁中', value: stats.arbitrating, color: 'from-purple-500 to-purple-600', icon: ArrowUpRight },
          { label: '本月结案率', value: `${stats.closeRate}%`, color: 'from-emerald-500 to-emerald-600', icon: Eye },
        ].map((s) => (
          <div key={s.label} className="card-base p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${s.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-ivory-600">{s.label}</p>
                <p className="text-2xl font-serif font-semibold text-carbon-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-base p-5 mb-8">
        <h3 className="font-medium text-carbon-800 mb-4">近30天纠纷趋势</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#9A9489" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9A9489" />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E8E4DD',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="新增" fill="#C4623A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="结案" fill="#6B8E9F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-ivory-100 rounded-lg p-1">
          {(['all', 'new', 'responding', 'mediating', 'arbitrating', 'closed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-wood-700' : 'text-ivory-600 hover:text-carbon-800'
              }`}
            >
              {s === 'all' ? '全部' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工单编号/地址/姓名"
            className="input-base pl-10"
          />
        </div>
        <button className="btn-ghost">
          <Filter className="w-4 h-4" /> 更多筛选
        </button>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory-50 border-b border-ivory-200">
                <th className="text-left px-4 py-3 font-medium text-ivory-600">工单编号</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">创建时间</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">项目地址</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">类型</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">业主</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">装修公司</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">处理人</th>
                <th className="text-left px-4 py-3 font-medium text-ivory-600">SLA</th>
                <th className="text-center px-4 py-3 font-medium text-ivory-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const sc = STATUS_CONFIG[d.status];
                const isOverdue = d.slaHours > 0 && d.slaHours <= 24;
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-ivory-100 hover:bg-ivory-50 transition-colors ${
                      isOverdue ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-wood-700">{d.id}</td>
                    <td className="px-4 py-3 text-ivory-600">{d.createdAt}</td>
                    <td className="px-4 py-3 text-carbon-700 max-w-[200px] truncate">{d.address}</td>
                    <td className="px-4 py-3">
                      <span className="badge-wood">{d.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-ivory-400" />
                        <span>{d.owner}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-ivory-400" />
                        <span>{d.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge border ${sc.bgColor} ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-ivory-600">{d.handler}</td>
                    <td className="px-4 py-3">
                      {d.slaHours > 0 ? (
                        <span className={`font-mono text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-ivory-500'}`}>
                          {d.slaHours}h
                        </span>
                      ) : (
                        <span className="text-ivory-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/admin/disputes/${d.id}`}
                        className="inline-flex items-center gap-1 text-haze-600 hover:text-haze-800 text-sm font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> 详情
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
