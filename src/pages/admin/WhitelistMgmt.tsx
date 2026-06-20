import { useEffect, useState } from 'react';
import {
  Search, Filter, ShieldAlert, Shield, ShieldCheck, ShieldQuestion,
  Building2, MapPin, Users, Award, ChevronDown, Check, X, Plus,
  Eye, Edit3, FileText, Camera, MessageSquare, AlertCircle
} from 'lucide-react';
import type { Factory, WhitelistStatus, EhsRating, SafetyRecord, InterviewSummary } from '@shared/types';
import { cn } from '@/lib/utils';

interface PendingFactory {
  id: string; name: string; industry: string; scale: string; region: string;
  contact: string; phone: string; applyDate: string; ehsMaterials: boolean;
  businessLicense: boolean; siteInspection: boolean;
}

const pendingFactories: PendingFactory[] = [
  { id: 'NEW001', name: '苏州精密切削科技有限公司', industry: '精密加工', scale: '50-100人', region: '苏州·吴中区', contact: '王经理', phone: '138****1234', applyDate: '2026-06-17', ehsMaterials: true, businessLicense: true, siteInspection: false },
  { id: 'NEW002', name: '昆山华丰电子有限公司', industry: '电子制造', scale: '200-500人', region: '昆山·张浦镇', contact: '李总', phone: '139****5678', applyDate: '2026-06-16', ehsMaterials: true, businessLicense: true, siteInspection: true },
  { id: 'NEW003', name: '无锡恒远机械制造', industry: '机械制造', scale: '100-200人', region: '无锡·新区', contact: '赵主管', phone: '137****9012', applyDate: '2026-06-15', ehsMaterials: false, businessLicense: true, siteInspection: false },
];

const mockFactories: Factory[] = [
  { id: 'F001', name: '富士康科技集团（昆山）', logo: '🏭', region: '昆山·陆家镇', address: '昆山市陆家镇金阳路88号', ehsRating: 'A', ehsScore: 92, dailyCapacity: 5000, capacityUtilization: 85, seasonNote: 'Q3旺季需大量用工', whitelistStatus: 'whitelist', createdAt: '2025-08-15', industry: '电子制造', scale: '10000+人',
    interviewSummaries: [
      { id: 's1', keywords: ['规范', '专业'], satisfaction: 5, summary: '厂区规范，HR专业，待遇透明，工人满意度高', recordedAt: '2026-06-10' },
      { id: 's2', keywords: ['环境好', '伙食棒'], satisfaction: 5, summary: '车间环境整洁，食堂伙食不错，住宿条件良好', recordedAt: '2026-05-28' },
    ],
    safetyRecords: [
      { id: 'r1', date: '2026-04-15', type: 'audit', level: 'normal', description: '季度EHS审核通过，无重大隐患' },
      { id: 'r2', date: '2026-03-20', type: 'training', level: 'normal', description: '全员消防安全培训，参训率98%' },
    ] },
  { id: 'F002', name: '立讯精密（苏州）有限公司', logo: '🏢', region: '苏州·工业园区', address: '苏州工业园区星龙街168号', ehsRating: 'A', ehsScore: 88, dailyCapacity: 3000, capacityUtilization: 78, seasonNote: '常年稳定用工', whitelistStatus: 'whitelist', createdAt: '2025-06-20', industry: '电子制造', scale: '5000-10000人',
    interviewSummaries: [{ id: 's1', keywords: ['准时', '高效'], satisfaction: 4, summary: '面试流程高效，入职手续规范', recordedAt: '2026-06-12' }],
    safetyRecords: [{ id: 'r1', date: '2026-05-10', type: 'audit', level: 'normal', description: '月度安全巡检合格' }] },
  { id: 'F003', name: '顺丰仓储配送中心（上海）', logo: '📦', region: '上海·青浦区', address: '上海市青浦区华新镇顺丰路1号', ehsRating: 'B', ehsScore: 78, dailyCapacity: 2000, capacityUtilization: 90, seasonNote: '618/双11大促期间急招', whitelistStatus: 'graylist', createdAt: '2025-11-05', industry: '物流仓储', scale: '500-1000人',
    interviewSummaries: [{ id: 's1', keywords: ['强度大', '收入高'], satisfaction: 3, summary: '劳动强度较大，但薪资和补贴比较丰厚', recordedAt: '2026-06-05' }],
    safetyRecords: [{ id: 'r1', date: '2026-05-28', type: 'incident', level: 'minor', description: '搬运过程轻微扭伤，已送医处理' }] },
  { id: 'F004', name: '比亚迪汽车（杭州）基地', logo: '🚗', region: '杭州·钱塘区', address: '杭州市钱塘区前进工业园', ehsRating: 'A', ehsScore: 90, dailyCapacity: 1500, capacityUtilization: 95, seasonNote: '新能源扩产，持续招人', whitelistStatus: 'whitelist', createdAt: '2025-09-10', industry: '汽车制造', scale: '5000-10000人',
    interviewSummaries: [{ id: 's1', keywords: ['大厂', '稳定'], satisfaction: 5, summary: '大厂品牌，管理规范，员工福利完善', recordedAt: '2026-06-08' }],
    safetyRecords: [{ id: 'r1', date: '2026-06-01', type: 'training', level: 'normal', description: '新员工安全生产培训' }] },
  { id: 'F005', name: '某某问题工厂（无锡）', logo: '⚠️', region: '无锡·锡山区', address: '无锡市锡山区安镇街道', ehsRating: 'D', ehsScore: 45, dailyCapacity: 800, capacityUtilization: 60, seasonNote: '异常工厂，暂停合作', whitelistStatus: 'blacklist', createdAt: '2025-12-01', industry: '五金加工', scale: '100-200人',
    interviewSummaries: [{ id: 's1', keywords: ['管理差', '拖欠工资'], satisfaction: 1, summary: '管理混乱，存在拖欠工资现象，已列入黑名单', recordedAt: '2026-05-15' }],
    safetyRecords: [
      { id: 'r1', date: '2026-04-20', type: 'incident', level: 'major', description: '机械伤害事故，造成1人重伤，安全生产许可证暂扣' },
      { id: 'r2', date: '2026-03-10', type: 'audit', level: 'major', description: '消防验收不合格，存在重大火灾隐患' },
    ] },
  { id: 'F006', name: '申洲国际针织（宁波）', logo: '🧵', region: '宁波·北仑区', address: '宁波市北仑区甬江路88号', ehsRating: 'B', ehsScore: 80, dailyCapacity: 4000, capacityUtilization: 70, seasonNote: '秋冬订单旺季', whitelistStatus: 'whitelist', createdAt: '2026-01-15', industry: '纺织服装', scale: '2000-5000人',
    interviewSummaries: [{ id: 's1', keywords: ['环境尚可'], satisfaction: 4, summary: '车间有空调，管理比较规范', recordedAt: '2026-06-01' }],
    safetyRecords: [{ id: 'r1', date: '2026-05-20', type: 'audit', level: 'normal', description: '职业健康检查通过' }] },
  { id: 'F007', name: '宁波某某注塑厂', logo: '🏭', region: '宁波·慈溪市', address: '慈溪市周巷镇开发路', ehsRating: 'C', ehsScore: 62, dailyCapacity: 500, capacityUtilization: 55, seasonNote: '订单不稳定', whitelistStatus: 'graylist', createdAt: '2026-02-20', industry: '塑胶制品', scale: '50-100人',
    interviewSummaries: [{ id: 's1', keywords: ['车间热'], satisfaction: 2, summary: '注塑车间夏季温度较高，流动性较大', recordedAt: '2026-05-25' }],
    safetyRecords: [{ id: 'r1', date: '2026-04-10', type: 'incident', level: 'minor', description: '模具夹伤手指，轻微工伤' }] },
];

function getStatusConfig(status: WhitelistStatus) {
  const map = {
    whitelist: { label: '白名单', cls: 'bg-success-50 text-success-600 border-success-200', icon: ShieldCheck, iconCls: 'text-success-600' },
    graylist: { label: '灰名单', cls: 'bg-warning-50 text-warning-600 border-warning-200', icon: ShieldQuestion, iconCls: 'text-warning-600' },
    blacklist: { label: '黑名单', cls: 'bg-danger-50 text-danger-600 border-danger-200', icon: ShieldAlert, iconCls: 'text-danger-600' },
  };
  return map[status];
}

function getEhsConfig(rating: EhsRating) {
  const map = {
    A: { cls: 'bg-success-100 text-success-700', desc: '优秀' },
    B: { cls: 'bg-blue-100 text-blue-700', desc: '良好' },
    C: { cls: 'bg-warning-100 text-warning-700', desc: '合格' },
    D: { cls: 'bg-danger-100 text-danger-700', desc: '不合格' },
  };
  return map[rating];
}

function getSafetyLevelCls(level: string) {
  return level === 'major' ? 'bg-danger-50 text-danger-600 border-danger-200'
    : level === 'minor' ? 'bg-warning-50 text-warning-600 border-warning-200'
    : 'bg-success-50 text-success-600 border-success-200';
}

function getSafetyTypeLabel(type: string) {
  return { incident: '安全事故', audit: 'EHS审核', training: '安全培训' }[type] || type;
}

export default function WhitelistMgmt() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [activeTab, setActiveTab] = useState<WhitelistStatus | 'pending'>('whitelist');
  const [search, setSearch] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [changingStatus, setChangingStatus] = useState<{ factory: Factory; newStatus: WhitelistStatus } | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/factories')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data.length > 0) setFactories(res.data);
        else setFactories(mockFactories);
        setLoading(false);
      })
      .catch(() => { setFactories(mockFactories); setLoading(false); });
  }, []);

  const filteredFactories = factories.filter(f => {
    if (activeTab === 'pending') return false;
    if (f.whitelistStatus !== activeTab) return false;
    if (search && !f.name.includes(search)) return false;
    if (regionFilter && !f.region.includes(regionFilter)) return false;
    return true;
  });

  const handleStatusChange = async () => {
    if (!changingStatus) return;
    const { factory, newStatus } = changingStatus;
    try {
      const res = await fetch(`/api/factories/${factory.id}/whitelist-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFactories(prev => prev.map(f => f.id === factory.id ? { ...f, whitelistStatus: newStatus } : f));
        if (selectedFactory?.id === factory.id) setSelectedFactory({ ...factory, whitelistStatus: newStatus });
      }
    } catch {
      setFactories(prev => prev.map(f => f.id === factory.id ? { ...f, whitelistStatus: newStatus } : f));
    }
    setChangingStatus(null);
  };

  const tabs: { key: WhitelistStatus | 'pending'; label: string; count: number; icon: typeof Shield }[] = [
    { key: 'whitelist', label: '白名单', count: factories.filter(f => f.whitelistStatus === 'whitelist').length, icon: ShieldCheck },
    { key: 'graylist', label: '灰名单', count: factories.filter(f => f.whitelistStatus === 'graylist').length, icon: ShieldQuestion },
    { key: 'blacklist', label: '黑名单', count: factories.filter(f => f.whitelistStatus === 'blacklist').length, icon: ShieldAlert },
    { key: 'pending', label: '准入审核', count: pendingFactories.length, icon: FileText },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-brand-600 text-lg">加载中...</div></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工厂白名单管理</h1>
          <p className="text-gray-500 text-sm mt-1">EHS评级 · 准入审核 · 分级管理</p>
        </div>
        <button className="btn-primary gap-2"><Plus className="w-4 h-4" /> 新增准入申请</button>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input className="input-field pl-11" placeholder="搜索工厂名称、联系人..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="input-field max-w-[180px]" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="">全部区域</option>
              <option value="苏州">苏州</option>
              <option value="昆山">昆山</option>
              <option value="上海">上海</option>
              <option value="无锡">无锡</option>
              <option value="杭州">杭州</option>
              <option value="宁波">宁波</option>
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

      {activeTab === 'pending' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">申请信息</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">行业/规模</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">区域</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">联系人</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">审核材料</th>
                  <th className="text-left font-medium px-5 py-4 whitespace-nowrap">申请日期</th>
                  <th className="text-right font-medium px-5 py-4 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingFactories.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl shrink-0">🏭</div>
                        <div>
                          <div className="font-semibold text-gray-900">{f.name}</div>
                          <div className="text-xs text-gray-400">申请编号：{f.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="tag border-gray-200 text-gray-600">{f.industry}</span> <span className="ml-2 text-gray-500">{f.scale}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{f.region}</td>
                    <td className="px-5 py-4 whitespace-nowrap"><div className="text-gray-900">{f.contact}</div><div className="text-xs text-gray-400">{f.phone}</div></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex items-center gap-1 text-xs', f.businessLicense ? 'text-success-600' : 'text-gray-400')}>
                          {f.businessLicense ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}营业执照
                        </div>
                        <div className={cn('flex items-center gap-1 text-xs', f.ehsMaterials ? 'text-success-600' : 'text-gray-400')}>
                          {f.ehsMaterials ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}EHS材料
                        </div>
                        <div className={cn('flex items-center gap-1 text-xs', f.siteInspection ? 'text-success-600' : 'text-gray-400')}>
                          {f.siteInspection ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}实地核验
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500">{f.applyDate}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="btn-ghost px-3 py-1.5 text-xs gap-1"><Eye className="w-3.5 h-3.5" />查看</button>
                        <button className="btn-primary px-3 py-1.5 text-xs gap-1" disabled={!f.siteInspection}><Check className="w-3.5 h-3.5" />通过</button>
                        <button className="btn-ghost px-3 py-1.5 text-xs gap-1 text-danger-600 border-danger-200 hover:bg-danger-50 hover:text-danger-600"><X className="w-3.5 h-3.5" />驳回</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
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
                  {filteredFactories.map(f => {
                    const stCfg = getStatusConfig(f.whitelistStatus);
                    const ehsCfg = getEhsConfig(f.ehsRating);
                    const StatusIcon = stCfg.icon;
                    return (
                      <tr key={f.id}
                        className={cn('border-b border-gray-50 hover:bg-brand-50/30 transition cursor-pointer', selectedFactory?.id === f.id && 'bg-brand-50/50')}
                        onClick={() => setSelectedFactory(f)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">{f.logo}</div>
                            <div>
                              <div className="font-semibold text-gray-900">{f.name}</div>
                              <div className="text-xs text-gray-400">日产能 {f.dailyCapacity.toLocaleString()} · 利用率 {f.capacityUtilization}%</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap"><div className="tag border-gray-200 text-gray-600 mb-1">{f.industry}</div><div className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{f.scale}</div></td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{f.region}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm', ehsCfg.cls)}>{f.ehsRating}</span>
                            <div>
                              <div className="font-medium text-gray-900">{f.ehsScore}分</div>
                              <div className="text-xs text-gray-400">{ehsCfg.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn('badge border gap-1', stCfg.cls)}>
                            <StatusIcon className="w-3.5 h-3.5" />{stCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center gap-2 justify-end relative group" onClick={e => e.stopPropagation()}>
                            <button className="btn-ghost px-3 py-1.5 text-xs gap-1"><Eye className="w-3.5 h-3.5" />详情</button>
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
                  {filteredFactories.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">暂无数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedFactory && (() => {
            const stCfg = getStatusConfig(selectedFactory.whitelistStatus);
            const ehsCfg = getEhsConfig(selectedFactory.ehsRating);
            const SI = stCfg.icon;
            return (
              <div className="card p-5 sticky top-6 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shrink-0">{selectedFactory.logo}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedFactory.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn('badge border gap-1', stCfg.cls)}><SI className="w-3 h-3" />{stCfg.label}</span>
                        <span className={cn('badge', ehsCfg.cls)}>EHS {selectedFactory.ehsRating}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition" onClick={() => setSelectedFactory(null)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="space-y-1 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4">
                  <div className="flex gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>{selectedFactory.address}</span></div>
                  <div className="flex gap-2"><Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>{selectedFactory.industry} · {selectedFactory.scale}</span></div>
                  <div className="flex gap-2"><Award className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>EHS评分 <b className="text-gray-900">{selectedFactory.ehsScore}分</b> · 入厂时间 {selectedFactory.createdAt}</span></div>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2"><Award className="w-4 h-4 text-brand-600" />EHS评分详情</h4>
                    <span className="text-xs text-gray-400">满分100</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: '消防设施', score: 22, full: 25 },
                      { label: '职业健康', score: 18, full: 20 },
                      { label: '安全培训', score: 17, full: 20 },
                      { label: '应急预案', score: 19, full: 20 },
                      { label: '员工访谈', score: 16, full: 15 },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{item.label}</span><span className="text-gray-900 font-medium">{item.score}/{item.full}</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" style={{ width: `${(item.score / item.full) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-warning-600" />安全记录（{selectedFactory.safetyRecords.length}条）</h4>
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
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-accent-600" />员工访谈记录</h4>
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
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Camera className="w-4 h-4 text-brand-600" />实地核验照片</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['🏭', '🛡️', '🔥', '🚿', '⚡', '🧪'].map((emoji, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex items-center justify-center text-3xl hover:scale-105 transition cursor-pointer">
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
