import { useEffect, useState } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus, Check, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Sparkles, Building2, Users, Clock, Download, Eye
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ResignWarning as ResignWarningType } from '@shared/types';
import { cn } from '@/lib/utils';

const mockWarnings: ResignWarningType[] = [
  { id: 'WRN001', factoryId: 'F001', factoryName: '富士康科技集团（昆山）', riskLevel: 'high', riskScore: 92, recentResignCount: 45, resignRate: 18.5, trend: 'up', topReasons: [{ reason: '加班强度过大', count: 18 }, { reason: '管理方式粗暴', count: 14 }, { reason: '薪资低于预期', count: 8 }, { reason: '住宿条件差', count: 5 }], keywords: ['加班多', '骂员工', '工资低', '流水线快', '罚款多', '环境吵', '站班累', '不批假'], suggestion: '建议立即约谈工厂HR总监，安排驻场工作人员实地核查近一周离职访谈记录，同时启动白名单降级评估流程，暂停新订单接入直至整改完成。', reportedAt: '2026-06-19T07:00:00Z' },
  { id: 'WRN002', factoryId: 'F002', factoryName: '某某电子科技（苏州）', riskLevel: 'high', riskScore: 85, recentResignCount: 32, resignRate: 14.2, trend: 'up', topReasons: [{ reason: '食堂伙食差', count: 11 }, { reason: '工资发放不准时', count: 9 }, { reason: '班组长态度差', count: 7 }, { reason: '强制加班', count: 5 }], keywords: ['菜难吃', '拖欠工资', '骂脏话', '义务加班', '夜班多', '请假难', '扣费多'], suggestion: '建议一周内安排二次核查，重点关注薪资发放记录和基层管理人员培训记录，如无改善则从白名单降至灰名单。', reportedAt: '2026-06-18T18:30:00Z' },
  { id: 'WRN003', factoryId: 'F003', factoryName: '顺丰仓储（上海青浦）', riskLevel: 'medium', riskScore: 72, recentResignCount: 21, resignRate: 11.8, trend: 'stable', topReasons: [{ reason: '体力消耗大', count: 10 }, { reason: '夜班辛苦', count: 7 }, { reason: '交通不便', count: 4 }], keywords: ['搬货重', '熬夜', '偏远', '无班车', '吃饭贵', '休息少'], suggestion: '建议与工厂协商增加夜班补贴和交通接驳车，可暂时维持灰名单观察，持续收集工人反馈。', reportedAt: '2026-06-18T14:20:00Z' },
  { id: 'WRN004', factoryId: 'F004', factoryName: '某某机械制造（无锡）', riskLevel: 'medium', riskScore: 64, recentResignCount: 15, resignRate: 9.5, trend: 'down', topReasons: [{ reason: '夏天车间太热', count: 8 }, { reason: '安全培训不足', count: 4 }, { reason: '试用期太长', count: 3 }], keywords: ['太热', '没空调', '安全差', '转正慢', '噪音大'], suggestion: '风险呈下降趋势，可加强夏季防暑措施落实情况的督促，鼓励工厂增加降温设备投入。', reportedAt: '2026-06-17T09:10:00Z' },
  { id: 'WRN005', factoryId: 'F005', factoryName: '比亚迪汽车（杭州钱塘）', riskLevel: 'medium', riskScore: 58, recentResignCount: 18, resignRate: 6.2, trend: 'stable', topReasons: [{ reason: '个人发展原因', count: 8 }, { reason: '通勤距离远', count: 6 }, { reason: '回老家发展', count: 4 }], keywords: ['想换工作', '离家远', '回老家', '学技术', '创业'], suggestion: '离职原因多为个人因素，属正常范围，建议继续保持常规监测频率即可。', reportedAt: '2026-06-16T16:45:00Z' },
  { id: 'WRN006', factoryId: 'F006', factoryName: '申洲针织（宁波北仑）', riskLevel: 'low', riskScore: 42, recentResignCount: 9, resignRate: 3.8, trend: 'down', topReasons: [{ reason: '季节性返乡', count: 5 }, { reason: '家庭原因', count: 4 }], keywords: ['收麦子', '带孩子', '家人病', '秋收', '过年'], suggestion: '属行业季节性正常波动，无需特殊处理，待用工旺季到来后自动恢复。', reportedAt: '2026-06-15T11:30:00Z' },
  { id: 'WRN007', factoryId: 'F007', factoryName: '宝洁日化（苏州吴中）', riskLevel: 'low', riskScore: 35, recentResignCount: 6, resignRate: 2.5, trend: 'stable', topReasons: [{ reason: '正常合同到期', count: 4 }, { reason: '结婚生子', count: 2 }], keywords: ['合同到期', '结婚', '怀孕', '换城市'], suggestion: '人员稳定性很好，建议作为优秀合作案例宣传推广。', reportedAt: '2026-06-14T13:20:00Z' },
  { id: 'WRN008', factoryId: 'F008', factoryName: '某某注塑厂（宁波慈溪）', riskLevel: 'high', riskScore: 81, recentResignCount: 28, resignRate: 22.3, trend: 'up', topReasons: [{ reason: '车间气味大', count: 12 }, { reason: '工资太低', count: 9 }, { reason: '没有社保', count: 7 }], keywords: ['有毒味', '没保险', '工资低', '两班倒', '没休息日', '乱扣钱'], suggestion: '强烈建议立即启动黑名单评估流程，此类严重侵害工人权益的工厂应立即下架所有岗位并终止合作。', reportedAt: '2026-06-17T20:00:00Z' },
  { id: 'WRN009', factoryId: 'F009', factoryName: '立讯精密（昆山高新区）', riskLevel: 'low', riskScore: 38, recentResignCount: 7, resignRate: 2.1, trend: 'down', topReasons: [{ reason: '提升学历', count: 3 }, { reason: '技术转岗', count: 2 }, { reason: '自主创业', count: 2 }], keywords: ['考大专', '学编程', '开网店', '跑外卖', '开滴滴'], suggestion: '离职均为正向选择，工厂管理规范，可继续深化合作，优先推荐高信用分工人。', reportedAt: '2026-06-15T15:00:00Z' },
  { id: 'WRN010', factoryId: 'F010', factoryName: '某某五金加工厂（无锡锡山）', riskLevel: 'medium', riskScore: 68, recentResignCount: 16, resignRate: 12.5, trend: 'up', topReasons: [{ reason: '工伤事故频发', count: 7 }, { reason: '防护用品不足', count: 5 }, { reason: '罚款制度不合理', count: 4 }], keywords: ['受工伤', '手套破', '口罩差', '扣工资', '没培训'], suggestion: '安全问题突出，建议立即联合安监部门抽查，如不合格直接拉黑处理，避免更大事故。', reportedAt: '2026-06-18T10:00:00Z' },
];

function getRiskColor(score: number) {
  if (score >= 80) return { bg: 'from-danger-500 to-danger-600', text: 'text-danger-600', light: 'bg-danger-50', badge: 'bg-danger-100 text-danger-600', border: 'border-danger-200' };
  if (score >= 60) return { bg: 'from-warning-500 to-accent-500', text: 'text-warning-600', light: 'bg-warning-50', badge: 'bg-warning-100 text-warning-600', border: 'border-warning-200' };
  return { bg: 'from-success-500 to-success-600', text: 'text-success-600', light: 'bg-success-50', badge: 'bg-success-100 text-success-600', border: 'border-success-200' };
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-danger-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-success-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function ResignWarning() {
  const [warnings, setWarnings] = useState<ResignWarningType[]>([]);
  const [summary, setSummary] = useState<{ total: number; highCount: number; totalAffected: number } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/warnings/resign')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data.length > 0) {
          setWarnings(res.data.sort((a: ResignWarningType, b: ResignWarningType) => b.riskScore - a.riskScore));
          setSummary(res.summary);
        } else {
          setWarnings(mockWarnings);
          setSummary({ total: mockWarnings.length, highCount: mockWarnings.filter(w => w.riskLevel === 'high').length, totalAffected: mockWarnings.reduce((s, w) => s + w.recentResignCount, 0) });
        }
        setLoading(false);
      })
      .catch(() => {
        setWarnings(mockWarnings);
        setSummary({ total: mockWarnings.length, highCount: mockWarnings.filter(w => w.riskLevel === 'high').length, totalAffected: mockWarnings.reduce((s, w) => s + w.recentResignCount, 0) });
        setLoading(false);
      });
  }, []);

  const top10 = warnings.slice(0, 10);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-brand-600 text-lg">加载中...</div></div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常离职预警中心</h1>
          <p className="text-gray-500 text-sm mt-1">AI离职分析 · 风险工厂识别 · 智能干预建议</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2"><FileText className="w-4 h-4" /> 导出报告</button>
          <button className="btn-primary gap-2"><ShieldAlert className="w-4 h-4" /> 预警规则设置</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 relative overflow-hidden bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700 text-white">
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 opacity-90 text-sm mb-3"><AlertTriangle className="w-5 h-5" /> 高风险工厂</div>
            <div className="text-5xl font-bold mb-2">{summary?.highCount ?? '--'}</div>
            <div className="text-white/80 text-sm">需要立即介入处理</div>
          </div>
        </div>
        <div className="card p-6 relative overflow-hidden bg-gradient-to-br from-warning-500 via-accent-500 to-accent-600 text-white">
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 opacity-90 text-sm mb-3"><Users className="w-5 h-5" /> 近30天异常离职人数</div>
            <div className="text-5xl font-bold mb-2">{summary?.totalAffected ?? '--'}</div>
            <div className="text-white/80 text-sm">涉及 {summary?.total ?? '--'} 家合作工厂</div>
          </div>
        </div>
        <div className="card p-6 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 opacity-90 text-sm mb-3"><Building2 className="w-5 h-5" /> 监测工厂总数</div>
            <div className="text-5xl font-bold mb-2">{summary?.total ?? '--'}</div>
            <div className="text-white/80 text-sm">日均处理 {Math.round((summary?.totalAffected ?? 0) / 30)} 起离职事件</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={cn('card overflow-hidden xl:col-span-2', expandedId ? '' : 'xl:col-span-3')}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="section-title"><AlertTriangle className="w-5 h-5 text-danger-600" /> 风险工厂 TOP 10</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-danger-500" />风险上升</span>
              <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-success-500" />风险下降</span>
              <span className="flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-gray-400" />基本稳定</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <th className="text-left font-medium px-5 py-3 w-16">排名</th>
                  <th className="text-left font-medium px-5 py-3">工厂名称</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap w-48">风险系数</th>
                  <th className="text-center font-medium px-5 py-3 whitespace-nowrap">离职人数</th>
                  <th className="text-center font-medium px-5 py-3 whitespace-nowrap">离职率</th>
                  <th className="text-center font-medium px-5 py-3 whitespace-nowrap w-20">趋势</th>
                  <th className="text-left font-medium px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {top10.map((w, idx) => {
                  const colors = getRiskColor(w.riskScore);
                  const isExpanded = expandedId === w.id;
                  const followed = followedIds.has(w.id);
                  return (
                    <>
                      <tr key={w.id}
                        className={cn('border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition', isExpanded && 'bg-gray-50/80')}
                        onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                        <td className="px-5 py-4">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                            idx === 0 ? 'bg-danger-500 text-white' :
                            idx === 1 ? 'bg-danger-400 text-white' :
                            idx === 2 ? 'bg-warning-500 text-white' :
                            'bg-gray-100 text-gray-600'
                          )}>{idx + 1}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">🏭</div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {w.factoryName}
                                {followed && <span className="badge bg-success-100 text-success-600 text-[10px] gap-1"><Check className="w-2.5 h-2.5" />已跟进</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn('badge', colors.badge)}>
                                  {w.riskLevel === 'high' ? '高风险' : w.riskLevel === 'medium' ? '中风险' : '低风险'}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{w.reportedAt.slice(5, 16).replace('T', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden min-w-[100px]">
                              <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', colors.bg)} style={{ width: `${w.riskScore}%` }} />
                            </div>
                            <span className={cn('font-bold w-8 text-right', colors.text)}>{w.riskScore}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-gray-900">{w.recentResignCount}<span className="text-xs text-gray-400 font-normal ml-0.5">人</span></td>
                        <td className="px-5 py-4 text-center">
                          <span className={cn('font-bold', w.resignRate >= 15 ? 'text-danger-600' : w.resignRate >= 10 ? 'text-warning-600' : 'text-success-600')}>{w.resignRate}%</span>
                        </td>
                        <td className="px-5 py-4 text-center flex justify-center"><TrendIcon trend={w.trend} /></td>
                        <td className="px-5 py-4">{isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
                          <td colSpan={7} className="px-5 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                              <div className="lg:col-span-1">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-accent-500" /> 离职原因分布（气泡图）</h4>
                                <div className="h-56 bg-gray-50/50 rounded-xl border border-gray-100 p-3">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                      <XAxis type="number" dataKey="x" name="影响程度" tick={{ fontSize: 9 }} stroke="#CBD5E1" label={{ value: '影响程度', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94A3B8' }} />
                                      <YAxis type="number" dataKey="y" name="频次排名" tick={{ fontSize: 9 }} stroke="#CBD5E1" label={{ value: '频次', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }} />
                                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                                        <div className="bg-white shadow-card rounded-lg border border-gray-100 p-2.5 text-xs">
                                          <div className="font-medium text-gray-900">{payload[0].payload.reason}</div>
                                          <div className="text-gray-500 mt-0.5">提及次数：<b>{payload[0].payload.z}</b> 次</div>
                                        </div>
                                      ) : null} />
                                      <Scatter data={w.topReasons.map((r, i) => ({ x: 100 - i * 15 + Math.random() * 10, y: (w.topReasons!.length - i) * 20, z: r.count, reason: r.reason }))}>
                                        {w.topReasons.map((_, i) => {
                                          const c = ['#EF4444', '#FF7A00', '#F59E0B', '#3B82F6', '#10B981'];
                                          return <Cell key={i} fill={c[i % 5]} fillOpacity={0.65} />;
                                        })}
                                      </Scatter>
                                    </ScatterChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {w.topReasons.map((r, i) => {
                                    const c = ['bg-danger-50 text-danger-600 border-danger-200', 'bg-orange-50 text-orange-600 border-orange-200', 'bg-warning-50 text-warning-600 border-warning-200', 'bg-blue-50 text-blue-600 border-blue-200', 'bg-success-50 text-success-600 border-success-200'];
                                    return <span key={i} className={cn('tag border text-[11px]', c[i % 5])}>{r.reason} {r.count}</span>;
                                  })}
                                </div>
                              </div>
                              <div className="lg:col-span-1">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Eye className="w-4 h-4 text-brand-600" /> 关键词云</h4>
                                <div className="h-56 bg-gray-50/50 rounded-xl border border-gray-100 p-4 flex flex-wrap items-center justify-center gap-2 content-center">
                                  {w.keywords.map((k, i) => {
                                    const weights = [1, 0.9, 0.85, 0.75, 0.7, 0.6, 0.55, 0.5];
                                    const weight = weights[i] ?? 0.45;
                                    const styles = [
                                      'bg-danger-100 text-danger-700 border-danger-200',
                                      'bg-accent-100 text-accent-700 border-accent-200',
                                      'bg-warning-100 text-warning-700 border-warning-200',
                                      'bg-brand-100 text-brand-700 border-brand-200',
                                      'bg-purple-100 text-purple-700 border-purple-200',
                                    ];
                                    return (
                                      <span key={i}
                                        className={cn('px-3 py-1.5 rounded-lg border font-medium transition-all hover:scale-105 cursor-default', styles[i % styles.length])}
                                        style={{ fontSize: `${11 + weight * 8}px`, opacity: 0.6 + weight * 0.4 }}>
                                        {k}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="lg:col-span-1">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-yellow-500" /> AI 预警建议</h4>
                                <div className="h-56 rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white p-4 relative overflow-hidden">
                                  <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />AI生成
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed pt-6">{w.suggestion}</p>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  <button className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all hover:-translate-y-0.5',
                                    followed ? 'bg-success-50 border-success-200 text-success-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-brand-200 hover:text-brand-600')}
                                    onClick={() => setFollowedIds(prev => { const n = new Set(prev); if (followed) n.delete(w.id); else n.add(w.id); return n; })}>
                                    <Check className="w-4 h-4" />
                                    <span>{followed ? '已跟进' : '标记跟进'}</span>
                                  </button>
                                  <button className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs transition-all hover:-translate-y-0.5 hover:bg-warning-50 hover:border-warning-200 hover:text-warning-600">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>建议降级</span>
                                  </button>
                                  <button className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600">
                                    <Download className="w-4 h-4" />
                                    <span>生成报告</span>
                                  </button>
                                </div>
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

        {expandedId && (() => {
          const w = warnings.find(x => x.id === expandedId);
          if (!w) return null;
          const colors = getRiskColor(w.riskScore);
          return (
            <div className="card p-5 sticky top-6 h-fit">
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center shrink-0', colors.light)}>
                  <Building2 className={cn('w-7 h-7', colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 leading-snug">{w.factoryName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn('badge', colors.badge)}>风险分 {w.riskScore}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><TrendIcon trend={w.trend} /></span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">离职人数</div>
                  <div className="text-xl font-bold text-danger-600">{w.recentResignCount}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">离职率</div>
                  <div className="text-xl font-bold text-warning-600">{w.resignRate}%</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">关注度</div>
                  <div className="text-xl font-bold text-brand-600">高</div>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-danger-500" /> 主要离职原因</div>
                  <div className="space-y-2">
                    {w.topReasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-700">{r.reason}</span><span className="text-gray-500">{r.count}次 · {Math.round(r.count / w.recentResignCount * 100)}%</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-danger-400 to-accent-500 rounded-full" style={{ width: `${r.count / w.recentResignCount * 100}%` }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1.5">最近更新时间</div>
                  <div className="text-sm text-gray-700">{w.reportedAt.replace('T', ' ').slice(0, 19)}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
