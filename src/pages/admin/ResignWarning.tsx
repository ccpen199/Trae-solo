import { useEffect, useState } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus, Check, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Sparkles, Building2, Users, Clock, Download, Eye
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ResignWarning as ResignWarningType } from '@shared/types';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';

interface WarningSummary {
  total: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalAffected: number;
}

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
  const [summary, setSummary] = useState<WarningSummary | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await get<ResignWarningType[]>('/warnings/resign');
        if (res.success && Array.isArray(res.data)) {
          setWarnings(res.data.sort((a, b) => b.riskScore - a.riskScore));
          const summaryData = (res as any).summary;
          if (summaryData) {
            setSummary(summaryData);
          } else {
            setSummary({
              total: res.data.length,
              highCount: res.data.filter(w => w.riskLevel === 'high').length,
              mediumCount: res.data.filter(w => w.riskLevel === 'medium').length,
              lowCount: res.data.filter(w => w.riskLevel === 'low').length,
              totalAffected: res.data.reduce((sum, w) => sum + w.recentResignCount, 0),
            });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
                                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(w.reportedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
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
                  <div className="text-sm text-gray-700">{new Date(w.reportedAt).toLocaleString('zh-CN')}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
