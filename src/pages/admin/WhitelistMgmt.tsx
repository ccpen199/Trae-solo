import { useEffect, useState } from 'react';
import {
  Search, Filter, ShieldAlert, Shield, ShieldCheck, ShieldQuestion,
  Building2, MapPin, Users, Award, ChevronDown, Check, X,
  Eye, Edit3, AlertCircle, MessageSquare, Clock, Loader2, FileCheck
} from 'lucide-react';
import type { Factory, WhitelistStatus, SafetyRecord, InterviewSummary } from '@shared/types';
import EhsBadge from '@/components/ui/EhsBadge';
import { cn } from '@/lib/utils';
import { get, patch } from '@/lib/api';

function getStatusConfig(status: WhitelistStatus) {
  const map = {
    whitelist: { label: '白名单', cls: 'bg-success-50 text-success-600 border-success-200', icon: ShieldCheck, iconCls: 'text-success-600' },
    graylist: { label: '灰名单', cls: 'bg-warning-50 text-warning-600 border-warning-200', icon: ShieldQuestion, iconCls: 'text-warning-600' },
    blacklist: { label: '黑名单', cls: 'bg-danger-50 text-danger-600 border-danger-200', icon: ShieldAlert, iconCls: 'text-danger-600' },
  };
  return map[status];
}

function getSafetyLevelCls(level: string) {
  return level === 'major' ? 'bg-danger-50 text-danger-600 border-danger-200'
    : level === 'minor' ? 'bg-warning-50 text-warning-600 border-warning-200'
    : 'bg-success-50 text-success-600 border-success-200';
}

function getSafetyTypeLabel(type: string) {
  return { incident: '安全事故', audit: 'EHS审核', training: '安全培训' }[type] || type;
}

function generateAuditTrail(factory: Factory) {
  const trails: { date: string; action: string; conclusion: string }[] = [];
  trails.push({
    date: factory.createdAt,
    action: '准入审核',
    conclusion: `工厂「${factory.name}」通过准入审核，纳入${getStatusConfig(factory.whitelistStatus).label}`,
  });
  const latestAudit = factory.safetyRecords.find(r => r.type === 'audit');
  if (latestAudit) {
    trails.push({
      date: latestAudit.date,
      action: 'EHS复查',
      conclusion: `${latestAudit.description}，EHS评分${factory.ehsScore}分`,
    });
  }
  const latestInterview = factory.interviewSummaries[factory.interviewSummaries.length - 1];
  if (latestInterview) {
    trails.push({
      date: latestInterview.recordedAt,
      action: '员工访谈复查',
      conclusion: `满意度${latestInterview.satisfaction}/5，关键词：${latestInterview.keywords.join('、')}`,
    });
  }
  if (factory.whitelistStatus === 'blacklist') {
    const majorIncident = factory.safetyRecords.find(r => r.level === 'major');
    trails.push({
      date: majorIncident?.date || factory.safetyRecords[0]?.date || factory.createdAt,
      action: '降级处理',
      conclusion: '因严重违规或重大安全隐患，降级为黑名单',
    });
  }
  return trails;
}

export default function WhitelistMgmt() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [activeTab, setActiveTab] = useState<WhitelistStatus>('whitelist');
  const [search, setSearch] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [changingStatus, setChangingStatus] = useState<{ factory: Factory; newStatus: WhitelistStatus } | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await get<Factory[]>('/factories');
        if (res.success && Array.isArray(res.data)) setFactories(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const regions = [...new Set(factories.map(f => f.region))];

  const filteredFactories = factories.filter(f => {
    if (f.whitelistStatus !== activeTab) return false;
    if (search && !f.name.includes(search)) return false;
    if (regionFilter && !f.region.includes(regionFilter)) return false;
    return true;
  });

  const handleStatusChange = async () => {
    if (!changingStatus) return;
    const { factory, newStatus } = changingStatus;
    const res = await patch<Factory>(`/factories/${factory.id}/whitelist-status`, { status: newStatus });
    if (res.success) {
      setFactories(prev => prev.map(f => f.id === factory.id ? { ...f, whitelistStatus: newStatus } : f));
      if (selectedFactory?.id === factory.id) setSelectedFactory({ ...factory, whitelistStatus: newStatus });
    }
    setChangingStatus(null);
  };

  const tabs: { key: WhitelistStatus; label: string; count: number; icon: typeof Shield }[] = [
    { key: 'whitelist', label: '白名单', count: factories.filter(f => f.whitelistStatus === 'whitelist').length, icon: ShieldCheck },
    { key: 'graylist', label: '灰名单', count: factories.filter(f => f.whitelistStatus === 'graylist').length, icon: ShieldQuestion },
    { key: 'blacklist', label: '黑名单', count: factories.filter(f => f.whitelistStatus === 'blacklist').length, icon: ShieldAlert },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">工厂白名单管理</h1>
        <p className="text-gray-500 text-sm mt-1">EHS评级 · 准入审核 · 分级管理</p>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input className="input-field pl-11" placeholder="搜索工厂名称..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="input-field max-w-[180px]" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="">全部区域</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-4 border-b border-gray-100 -mx-4 px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 -mb-px border-b-2 font-medium text-sm transition-all',
                  isActive ? 'border-accent-500 text-accent-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                )}>
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn('px-2 py-0.5 rounded-full text-xs', isActive ? 'bg-accent-50 text-accent-600' : 'bg-gray-100 text-gray-500')}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={cn('card overflow-hidden xl:col-span-2', selectedFactory ? '' : 'xl:col-span-3')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">工厂</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">行业/规模</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">区域</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">EHS评级</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">名单状态</th>
                  <th className="text-right font-medium px-5 py-4 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactories.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">暂无数据</td></tr>
                )}
                {filteredFactories.map(f => {
                  const stCfg = getStatusConfig(f.whitelistStatus);
                  const StatusIcon = stCfg.icon;
                  return (
                    <tr key={f.id}
                      className={cn('border-b border-gray-50 hover:bg-brand-50/30 transition cursor-pointer', selectedFactory?.id === f.id && 'bg-brand-50/50')}
                      onClick={() => setSelectedFactory(f)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">{f.logo}</div>
                          <div className="font-semibold text-gray-900">{f.name}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="tag border-gray-200 text-gray-600 mb-1">{f.industry}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{f.scale}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{f.region}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <EhsBadge rating={f.ehsRating} score={f.ehsScore} showScore size="sm" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={cn('badge border gap-1', stCfg.cls)}>
                          <StatusIcon className="w-3.5 h-3.5" />{stCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center gap-2 justify-end relative group" onClick={e => e.stopPropagation()}>
                          <button className="btn-ghost px-3 py-1.5 text-xs gap-1" onClick={() => setSelectedFactory(f)}><Eye className="w-3.5 h-3.5" />详情</button>
                          <div className="relative">
                            <button className="btn-ghost px-3 py-1.5 text-xs gap-1"><Edit3 className="w-3.5 h-3.5" />状态<ChevronDown className="w-3 h-3" /></button>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-card-hover border border-gray-100 py-2 z-10 hidden group-hover:block">
                              {(['whitelist', 'graylist', 'blacklist'] as WhitelistStatus[]).map(s => {
                                const cfg = getStatusConfig(s);
                                const SI = cfg.icon;
                                return (
                                  <button key={s}
                                    onClick={() => f.whitelistStatus !== s && setChangingStatus({ factory: f, newStatus: s })}
                                    className={cn(
                                      'w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition',
                                      f.whitelistStatus === s ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                    )}>
                                    <SI className={cn('w-4 h-4', cfg.iconCls)} />
                                    设为{cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedFactory && (() => {
          const stCfg = getStatusConfig(selectedFactory.whitelistStatus);
          const SI = stCfg.icon;
          const auditTrail = generateAuditTrail(selectedFactory);
          return (
            <div className="card p-5 sticky top-6 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shrink-0">{selectedFactory.logo}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedFactory.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('badge border gap-1', stCfg.cls)}><SI className="w-3 h-3" />{stCfg.label}</span>
                      <EhsBadge rating={selectedFactory.ehsRating} score={selectedFactory.ehsScore} showScore size="sm" />
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition" onClick={() => setSelectedFactory(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-1 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4">
                <div className="flex gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>{selectedFactory.address}</span></div>
                <div className="flex gap-2"><Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>{selectedFactory.industry} · {selectedFactory.scale}</span></div>
                <div className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>入厂时间 {selectedFactory.createdAt}</span></div>
              </div>

              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-brand-600" /> EHS评级</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">评分</span>
                    <span className="font-bold text-gray-900">{selectedFactory.ehsScore}<span className="text-xs text-gray-400 font-normal">/100</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" style={{ width: `${selectedFactory.ehsScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-accent-600" /> 真实产能</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-0.5">日产能</div>
                    <div className="text-lg font-bold text-gray-900">{selectedFactory.dailyCapacity.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-0.5">产能利用率</div>
                    <div className="text-lg font-bold text-brand-600">{selectedFactory.capacityUtilization}%</div>
                  </div>
                </div>
                {selectedFactory.seasonNote && (
                  <div className="mt-2 text-xs text-gray-500 bg-accent-50 rounded-lg p-2.5 border-l-3 border-accent-500">{selectedFactory.seasonNote}</div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-warning-600" /> 安全记录（{selectedFactory.safetyRecords.length}条）</h4>
                {selectedFactory.safetyRecords.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">暂无记录</div>
                ) : (
                  <div className="space-y-2">
                    {selectedFactory.safetyRecords.map((r: SafetyRecord) => (
                      <div key={r.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn('badge border', getSafetyLevelCls(r.level))}>{r.level === 'major' ? '严重' : r.level === 'minor' ? '轻微' : '正常'}</span>
                          <span className="text-xs text-gray-400">{r.date}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-0.5">{getSafetyTypeLabel(r.type)}</div>
                        <div className="text-sm text-gray-700">{r.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-accent-600" /> 员工访谈摘要（{selectedFactory.interviewSummaries.length}条）</h4>
                {selectedFactory.interviewSummaries.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">暂无记录</div>
                ) : (
                  <div className="space-y-2">
                    {selectedFactory.interviewSummaries.map((s: InterviewSummary) => (
                      <div key={s.id} className="p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} className={cn('w-3.5 h-3.5', i < s.satisfaction ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{s.recordedAt}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">关键词：{s.keywords.map(k => <span key={k} className="tag border-accent-200 bg-accent-50 text-accent-600 mr-1">{k}</span>)}</div>
                        <div className="text-sm text-gray-700">{s.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><FileCheck className="w-4 h-4 text-brand-600" /> 审核复查痕迹</h4>
                {auditTrail.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">暂无记录</div>
                ) : (
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                    {auditTrail.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                        <div className="text-xs text-gray-400 mb-0.5">{t.date}</div>
                        <div className="text-sm font-medium text-gray-900">{t.action}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t.conclusion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {changingStatus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-hover p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center shrink-0"><AlertCircle className="w-6 h-6 text-warning-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">确认变更名单状态</h3>
                <p className="text-sm text-gray-500 mt-0.5">操作后将同步更新关联数据</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">工厂名称</span><span className="text-gray-900 font-medium truncate ml-4 max-w-[60%]">{changingStatus.factory.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">当前状态</span><span className={cn('badge', getStatusConfig(changingStatus.factory.whitelistStatus).cls)}>{getStatusConfig(changingStatus.factory.whitelistStatus).label}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">变更为</span><span className={cn('badge', getStatusConfig(changingStatus.newStatus).cls)}>{getStatusConfig(changingStatus.newStatus).label}</span></div>
            </div>
            {changingStatus.newStatus === 'blacklist' && (
              <div className="mb-5 p-3 rounded-xl bg-danger-50 border border-danger-100 text-sm text-danger-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>加入黑名单后，该工厂所有在招岗位将自动下架，正在进行的订单需要手动转移处理。</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button className="btn-ghost flex-1" onClick={() => setChangingStatus(null)}>取消</button>
              <button className="btn-primary flex-1" onClick={handleStatusChange}>确认变更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
