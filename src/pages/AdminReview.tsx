import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Eye,
  Filter,
  Search,
  MessageSquare,
  Tag,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  title: string;
  source: string;
  author: string;
  submittedAt: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'reviewing';
  reviewer?: string;
  comment?: string;
}

const reviewData: ReviewItem[] = [
  {
    id: 'R20260621001',
    title: '暴雨红色预警发布后各区县应急响应情况汇总',
    source: '盐阜大众报',
    author: '张记者',
    submittedAt: '2026-06-21 09:30',
    riskLevel: 'high',
    tags: ['暴雨', '应急响应', '防汛'],
    status: 'pending',
  },
  {
    id: 'R20260621002',
    title: '2026年医保缴费标准调整政策解读',
    source: '市医保局供稿',
    author: '李主任',
    submittedAt: '2026-06-21 08:15',
    riskLevel: 'low',
    tags: ['医保', '缴费', '政策解读'],
    status: 'reviewing',
    reviewer: '王编辑',
  },
  {
    id: 'R20260620015',
    title: '关于学区划分方案的市民反馈舆情分析',
    source: '舆情监测系统',
    author: '系统自动',
    submittedAt: '2026-06-20 16:45',
    riskLevel: 'critical',
    tags: ['学区', '舆情', '热点聚类', '情感分析'],
    status: 'pending',
  },
  {
    id: 'R20260620012',
    title: '公积金提取线上办理流程优化公告',
    source: '市公积金中心',
    author: '赵科长',
    submittedAt: '2026-06-20 14:20',
    riskLevel: 'low',
    tags: ['公积金', '便民服务', '线上办理'],
    status: 'approved',
    reviewer: '刘主编',
    comment: '内容准确，流程清晰，可发布',
  },
  {
    id: 'R20260620008',
    title: '网传XX路段交通事故不实信息的澄清稿',
    source: '市公安局',
    author: '宣传科',
    submittedAt: '2026-06-20 11:00',
    riskLevel: 'medium',
    tags: ['谣言澄清', '交通', '舆情处置'],
    status: 'approved',
    reviewer: '王编辑',
    comment: '事实清楚，表述严谨',
  },
  {
    id: 'R20260620003',
    title: '某小区物业纠纷的片面报道草稿',
    source: '通讯员来稿',
    author: '匿名',
    submittedAt: '2026-06-20 09:30',
    riskLevel: 'high',
    tags: ['社区纠纷', '待核实'],
    status: 'rejected',
    reviewer: '刘主编',
    comment: '内容来源不明，缺乏多方采访，需补充后再提交',
  },
];

const statusConfig = {
  pending: { label: '待复查', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  reviewing: { label: '复查中', icon: Eye, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved: { label: '已通过', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '已驳回', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
};

const riskConfig = {
  low: { label: '低风险', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  medium: { label: '中风险', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  high: { label: '高风险', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
  critical: { label: '极高风险', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

export default function AdminReview() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = reviewData.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.title.includes(search) && !r.author.includes(search)) return false;
    return true;
  });

  const stats = {
    total: reviewData.length,
    pending: reviewData.filter((r) => r.status === 'pending').length,
    approved: reviewData.filter((r) => r.status === 'approved').length,
    rejected: reviewData.filter((r) => r.status === 'rejected').length,
    highRisk: reviewData.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/analytics" className="hover:text-gov-600 transition-colors">内容中台</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">内容复查记录</span>
      </nav>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-gov-600" />
            内容复查工作台
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">稿件打标 · 热点聚类 · 舆情风险分级 · 人工复核记录</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/content" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-10">
            <Tag className="w-4 h-4" />
            稿件打标
          </Link>
          <Link to="/admin/analytics" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-10">
            <TrendingUp className="w-4 h-4" />
            舆情与聚类
          </Link>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gov-600 text-white font-medium hover:bg-gov-700 transition-colors min-h-10">
            <Download className="w-4 h-4" />
            导出复查报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="card p-4 md:p-5">
          <p className="text-xs text-gray-500 mb-1">待复查总数</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card p-4 md:p-5">
          <p className="text-xs text-gray-500 mb-1">待处理</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card p-4 md:p-5">
          <p className="text-xs text-gray-500 mb-1">高/极高风险</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-red-600">{stats.highRisk}</p>
        </div>
        <div className="card p-4 md:p-5">
          <p className="text-xs text-gray-500 mb-1">已通过</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="card p-4 md:p-5">
          <p className="text-xs text-gray-500 mb-1">已驳回</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      <div className="card p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索稿件标题、作者..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gov-400"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            {[
              { k: 'all', label: '全部' },
              { k: 'pending', label: '待复查' },
              { k: 'reviewing', label: '复查中' },
              { k: 'approved', label: '已通过' },
              { k: 'rejected', label: '已驳回' },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  filter === f.k ? 'bg-gov-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">稿件信息</th>
                <th className="px-4 py-3 font-medium">风险等级</th>
                <th className="px-4 py-3 font-medium">自动标签</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">复查意见</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const sc = statusConfig[item.status];
                const rc = riskConfig[item.riskLevel];
                const SI = sc.icon;
                const isSelected = selected === item.id;
                return (
                  <>
                    <tr
                      key={item.id}
                      onClick={() => setSelected(isSelected ? null : item.id)}
                      className={cn(
                        'border-b border-gray-50 cursor-pointer transition-colors',
                        isSelected ? 'bg-gov-50' : 'hover:bg-gray-50',
                      )}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">{item.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{item.source}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.author}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.submittedAt}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('chip border', rc.bg, rc.text)}>
                          <span className={cn('w-2 h-2 rounded-full mr-1.5', rc.color)} />
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gov-50 text-gov-700 border border-gov-100">{t}</span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('chip border inline-flex items-center gap-1', sc.color)}>
                          <SI className="w-3 h-3" />
                          {sc.label}
                        </span>
                        {item.reviewer && <p className="text-[11px] text-gray-400 mt-1">复查人：{item.reviewer}</p>}
                      </td>
                      <td className="px-4 py-4">
                        {item.comment ? (
                          <p className="text-xs text-gray-600 line-clamp-2 max-w-[180px]">{item.comment}</p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 rounded-lg bg-gov-50 text-gov-600 hover:bg-gov-100 transition-colors" title="查看">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="通过">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="驳回">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="bg-gov-50/50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 p-4 rounded-xl bg-white border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-gov-600" />
                                AI 自动打标与风险分析
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">自动打标结果（置信度）</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map((t) => (
                                      <span key={t} className="text-xs px-2 py-1 rounded bg-gov-50 text-gov-700 border border-gov-200">
                                        {t} <span className="text-gov-500 ml-0.5">({(85 + Math.random() * 13).toFixed(0)}%)</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">情感分析</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400" style={{ width: `${item.riskLevel === 'critical' ? 85 : item.riskLevel === 'high' ? 65 : item.riskLevel === 'medium' ? 40 : 18}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">
                                      {item.riskLevel === 'critical' ? '负面 85%' : item.riskLevel === 'high' ? '负面 65%' : item.riskLevel === 'medium' ? '中性 40%' : '正面 82%'}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-1">热点聚类归属</p>
                                  <p className="text-gray-800 text-sm">
                                    {item.tags[0]}相关事件簇 · 关联报道 {12 + Math.floor(Math.random() * 40)} 篇 · 传播量 {(2.5 + Math.random() * 20).toFixed(1)}万
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-3">人工复查</h4>
                              <textarea
                                placeholder="请输入复查意见..."
                                rows={4}
                                defaultValue={item.comment}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gov-400 text-sm"
                              />
                              <div className="flex gap-2 mt-3">
                                <button className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors min-h-9">
                                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                  通过发布
                                </button>
                                <button className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors min-h-9">
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                  驳回修改
                                </button>
                              </div>
                              <button className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 min-h-9">
                                <RefreshCw className="w-4 h-4" />
                                重新 AI 打标
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
