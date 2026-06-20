import { useEffect, useState } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Sparkles, Building2, Users, Clock, Loader2, Search
} from 'lucide-react';
import type { ResignWarning as ResignWarningType, RiskLevel } from '@shared/types';
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

function getRiskLevelBadge(level: RiskLevel) {
  if (level === 'high') return { label: '高风险', cls: 'bg-danger-100 text-danger-600' };
  if (level === 'medium') return { label: '中危', cls: 'bg-warning-100 text-warning-600' };
  return { label: '低危', cls: 'bg-success-100 text-success-600' };
}

export default function ResignWarning() {
  const [warnings, setWarnings] = useState<ResignWarningType[]>([]);
  const [summary, setSummary] = useState<WarningSummary | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await get<ResignWarningType[]>('/warnings/resign');
        if (res.success && Array.isArray(res.data)) {
          const sorted = res.data.sort((a, b) => b.riskScore - a.riskScore);
          setWarnings(sorted);
          const sm = (res as any).summary as WarningSummary | undefined;
          if (sm) {
            setSummary(sm);
          } else {
            setSummary({
              total: sorted.length,
              highCount: sorted.filter(w => w.riskLevel === 'high').length,
              mediumCount: sorted.filter(w => w.riskLevel === 'medium').length,
              lowCount: sorted.filter(w => w.riskLevel === 'low').length,
              totalAffected: sorted.reduce((sum, w) => sum + w.recentResignCount, 0),
            });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allKeywords = [...new Set(warnings.flatMap(w => w.keywords))];

  const filteredWarnings = keywordFilter
    ? warnings.filter(w => w.keywords.some(k => k.includes(keywordFilter)))
    : warnings;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">离职预警中心</h1>
        <p className="text-gray-500 text-sm mt-1">AI离职分析 · 风险工厂识别 · 智能干预建议</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><Building2 className="w-6 h-6 text-brand-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">预警总数</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{summary?.total ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 text-danger-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">高危</div>
            <div className="text-2xl font-bold text-danger-600 leading-none">{summary?.highCount ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 text-warning-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">中危</div>
            <div className="text-2xl font-bold text-warning-600 leading-none">{summary?.mediumCount ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 text-success-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">低危</div>
            <div className="text-2xl font-bold text-success-600 leading-none">{summary?.lowCount ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-accent-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">影响总人数</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{summary?.totalAffected ?? '--'}</div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input className="input-field max-w-[240px] text-sm py-2" placeholder="按关键词筛选..." value={keywordFilter} onChange={e => setKeywordFilter(e.target.value)} />
          {keywordFilter && (
            <button className="text-xs text-danger-600 hover:underline" onClick={() => setKeywordFilter('')}>清除筛选</button>
          )}
          {allKeywords.length > 0 && (
            <div className="flex items-center gap-1.5 ml-4 overflow-x-auto">
              {allKeywords.slice(0, 8).map(k => (
                <button key={k} className={cn('tag border text-[11px] whitespace-nowrap', keywordFilter === k ? 'bg-brand-50 text-brand-600 border-brand-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50')} onClick={() => setKeywordFilter(k)}>{k}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title"><AlertTriangle className="w-5 h-5 text-danger-600" /> 预警名单（{filteredWarnings.length}）</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-danger-500" />上升</span>
            <span className="flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-gray-400" />稳定</span>
            <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-success-500" />下降</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="text-left font-medium px-5 py-3 w-16">排名</th>
                <th className="text-left font-medium px-5 py-3">工厂名称</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap w-20">风险等级</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap">风险分</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap">离职人数</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap">离职率</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap w-20">趋势</th>
                <th className="text-left font-medium px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredWarnings.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">暂无预警数据</td></tr>
              )}
              {filteredWarnings.map((w, idx) => {
                const colors = getRiskColor(w.riskScore);
                const isExpanded = expandedId === w.id;
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
                          <div className="font-semibold text-gray-900">{w.factoryName}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn('badge', getRiskLevelBadge(w.riskLevel).cls)}>{getRiskLevelBadge(w.riskLevel).label}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px] max-w-[100px]">
                            <div className={cn('h-full rounded-full bg-gradient-to-r', colors.bg)} style={{ width: `${w.riskScore}%` }} />
                          </div>
                          <span className={cn('font-bold', colors.text)}>{w.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-gray-900">{w.recentResignCount}<span className="text-xs text-gray-400 font-normal ml-0.5">人</span></td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn('font-bold', w.resignRate >= 15 ? 'text-danger-600' : w.resignRate >= 10 ? 'text-warning-600' : 'text-success-600')}>{w.resignRate}%</span>
                      </td>
                      <td className="px-5 py-4 text-center flex justify-center">
                        {w.trend === 'up' ? <TrendingUp className="w-4 h-4 text-danger-500" /> : w.trend === 'down' ? <TrendingDown className="w-4 h-4 text-success-500" /> : <Minus className="w-4 h-4 text-gray-400" />}
                      </td>
                      <td className="px-5 py-4">{isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
                        <td colSpan={8} className="px-5 py-5">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-danger-500" /> Top离职原因</h4>
                              <div className="space-y-2">
                                {w.topReasons.map((r, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-700">{r.reason}</span><span className="text-gray-500">{r.count}次</span></div>
                                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-danger-400 to-accent-500 rounded-full" style={{ width: `${Math.max(r.count / (w.topReasons[0]?.count || 1) * 100, 5)}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-brand-600" /> 关键词云</h4>
                              <div className="flex flex-wrap gap-2">
                                {w.keywords.map((k, i) => {
                                  const styles = [
                                    'bg-danger-50 text-danger-700 border-danger-200',
                                    'bg-accent-50 text-accent-700 border-accent-200',
                                    'bg-warning-50 text-warning-700 border-warning-200',
                                    'bg-brand-50 text-brand-700 border-brand-200',
                                    'bg-purple-50 text-purple-700 border-purple-200',
                                  ];
                                  return (
                                    <span key={i} className={cn('px-3 py-1.5 rounded-lg border font-medium text-xs', styles[i % styles.length])}>{k}</span>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-yellow-500" /> AI建议</h4>
                              <div className="rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white p-4 relative overflow-hidden mb-3">
                                <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />AI生成
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed pt-6">{w.suggestion}</p>
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />报告时间：{new Date(w.reportedAt).toLocaleString('zh-CN')}</div>
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
