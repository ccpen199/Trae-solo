import { useEffect, useState } from 'react';
import {
  Shield, FileKey, FileSearch, FileBarChart, Users, Database, Activity,
  ChevronRight, AlertTriangle, CheckCircle2, Clock, Zap,
  ArrowUpRight, BarChart3, Globe2, Lock, Minus, X, Copy, ShieldCheck,
  Download, FileText,
} from 'lucide-react';
import type { PermissionLevel, RolePermission, ExportAuditLog, ReportInfo } from 'shared/types';
import { clsx } from 'clsx';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function AdminHome() {
  return <AdminModule mode="home" />;
}
export function AdminPermissions() {
  return <AdminModule mode="permissions" />;
}
export function AdminAudit() {
  return <AdminModule mode="audit" />;
}
export function AdminReports() {
  return <AdminModule mode="reports" />;
}

const subNav = [
  { path: '/admin', label: '管理首页', icon: Shield, end: true },
  { path: '/admin/permissions', label: '权限分级', icon: FileKey },
  { path: '/admin/audit', label: '导出审计', icon: FileSearch },
  { path: '/admin/reports', label: '报告中心', icon: FileBarChart },
];

const dataAccessBoundary = [
  { category: '票房总览', levels: ['full', 'full', 'full'] },
  { category: '票房明细数据', levels: ['partial:仅TOP10', 'full', 'full'] },
  { category: '排片预测结果', levels: ['none', 'full', 'full'] },
  { category: '上座率热力图', levels: ['none', 'partial:延迟15分钟', 'full'] },
  { category: '受众画像数据', levels: ['none', 'partial:仅基础标签', 'full'] },
  { category: '人群迁移分析', levels: ['none', 'none', 'full'] },
  { category: '剧组协作中心', levels: ['none', 'partial:仅查看', 'full'] },
  { category: '报告中心', levels: ['partial:仅公开报告', 'full', 'full'] },
  { category: '定制API接口', levels: ['none', 'none', 'full'] },
  { category: '历史对比数据', levels: ['none', 'partial:近1年', 'full'] },
  { category: '实时SSE推送', levels: ['none', 'partial:延迟15分钟', 'full'] },
  { category: '影院经营数据', levels: ['none', 'partial:仅TOP50影院', 'full'] },
];

const sensitiveDataTypes = ['票房明细数据', '受众画像报告', '影院经营数据', '上座率原始数据'];

function getCompliance(log: ExportAuditLog) {
  const isSensitive = sensitiveDataTypes.includes(log.dataType);
  return {
    isSensitive,
    desensitized: isSensitive ? log.status === 'approved' : true,
    permissionVerified: log.status !== 'rejected',
    purposeCompliant: log.status === 'approved',
  };
}

function AccessCell({ level }: { level: string }) {
  if (level === 'full') {
    return (
      <span className="inline-flex items-center gap-1 text-chart-green">
        <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />完整访问
      </span>
    );
  }
  if (level === 'none') {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <X className="w-4 h-4" strokeWidth={1.8} />无权限
      </span>
    );
  }
  const note = level.slice(8);
  return (
    <span className="inline-flex items-center gap-1 text-chart-orange" title={note}>
      <Minus className="w-4 h-4" strokeWidth={1.8} />部分访问
      <span className="text-[10px] text-slate-400 ml-0.5">({note})</span>
    </span>
  );
}

function AdminModule({ mode }: { mode: 'home' | 'permissions' | 'audit' | 'reports' }) {
  const loc = useLocation();
  const [permissions, setPermissions] = useState<{ levels: PermissionLevel[]; roles: RolePermission[] }>({ levels: [], roles: [] });
  const [auditLogs, setAuditLogs] = useState<ExportAuditLog[]>([]);
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [filters, setFilters] = useState({ status: '全部', format: '全部', role: '全部' });
  const [reportConfig, setReportConfig] = useState({ type: 'weekly', period: 'last7', delivery: ['email'] as string[] });
  const [reportResult, setReportResult] = useState<{
    title: string;
    generatedAt: string;
    fileSize: string;
    chapters: { title: string; summary: string }[];
    dataVerified: boolean;
    fileHash: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState('');

  useEffect(() => {
    fetch('/api/admin/permissions').then(r => r.json()).then(j => setPermissions(j.data));
    fetch('/api/admin/audit/export').then(r => r.json()).then(j => setAuditLogs(j.data));
    fetch('/api/admin/reports').then(r => r.json()).then(j => setReports(j.data));
  }, []);

  const filterLogs = auditLogs.filter(l =>
    (filters.status === '全部' || l.status === filters.status.toLowerCase().replace('待审核', 'pending').replace('已通过', 'approved').replace('已拒绝', 'rejected')) &&
    (filters.format === '全部' || l.format === filters.format) &&
    (filters.role === '全部' || l.userRole === filters.role)
  );

  const statusMap: Record<string, { label: string; cls: string }> = {
    approved: { label: '已通过', cls: 'bg-chart-green/15 text-chart-green border-chart-green/30' },
    pending: { label: '待审核', cls: 'bg-chart-orange/15 text-chart-orange border-chart-orange/30' },
    rejected: { label: '已拒绝', cls: 'bg-cine-500/15 text-cine-400 border-cine-500/30' },
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  const handleGenerateReport = () => {
    setReportResult({
      title: reportConfig.type === 'weekly'
        ? '中国电影市场周度数据洞察报告'
        : reportConfig.type === 'monthly'
        ? '中国电影市场月度经营分析报告'
        : '2026暑期档影片表现专项分析报告',
      generatedAt: new Date().toLocaleString('zh-CN'),
      fileSize: '12.4 MB',
      chapters: [
        { title: '一、市场大盘走势', summary: '报告期内全国票房累计48.6亿元，同比上涨12.5%，为近三年同期最高水平。暑期档预热效应显著。' },
        { title: '二、档期影片表现分析', summary: '头部影片首周票房突破18亿，市场占比37%，创下题材首周票房新纪录；同期上映影片表现分化。' },
        { title: '三、影院经营与区域洞察', summary: '一线城市票房贡献占比42%，三四线城市同比增幅达18.7%，下沉市场增长亮眼。' },
        { title: '四、受众画像与观影偏好', summary: '25-34岁年龄段为核心消费群体，占比34.2%，科幻题材偏好度持续攀升。' },
        { title: '五、未来走势预测与经营建议', summary: '预计下周单周票房有望冲击55亿，建议院线适度提升黄金场排片。' },
      ],
      dataVerified: true,
      fileHash: `0x${Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  };

  const complianceApproved = filterLogs.filter(l => l.status === 'approved').length;
  const compliancePending = filterLogs.filter(l => l.status === 'pending').length;
  const complianceRejected = filterLogs.filter(l => l.status === 'rejected').length;
  const complianceRate = filterLogs.length ? Math.round(complianceApproved / filterLogs.length * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Administrative Console</div>
          <h1 className="font-serif text-3xl font-bold text-slate-100">
            <span className="text-gradient-gold">后台管理系统</span>
            <span className="ml-3 text-lg text-slate-400 font-normal">
              {subNav.find(s => (s.end && loc.pathname === s.path) || (!s.end && loc.pathname.startsWith(s.path)))?.label}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">数据权限分级 · 导出合规审计 · 行业报告自动化生成</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {subNav.map(item => {
          const Icon = item.icon;
          const active = item.end ? loc.pathname === item.path : loc.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-to-r from-gold-500/25 to-transparent text-gold-400 border border-gold-500/40 shadow-glow-gold'
                  : 'bg-space-800/50 text-slate-400 border border-space-700/50 hover:text-slate-200 hover:border-space-600/60'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {mode === 'home' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: '企业用户数', v: '1,284', sub: '本月新增 +86', icon: Users, c: 'text-gold-400' },
              { l: '数据API调用量', v: '4.87亿', sub: '日峰值 589万', icon: Database, c: 'text-chart-blue' },
              { l: '待审核导出', v: '23', sub: '高风险 3 项', icon: AlertTriangle, c: 'text-chart-orange' },
              { l: '报告生成任务', v: '156', sub: '成功率 98.7%', icon: FileBarChart, c: 'text-chart-green' },
            ].map((m, i) => (
              <div key={i} className="cip-card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx('w-10 h-10 rounded-xl bg-space-700/50 flex items-center justify-center', m.c)}>
                    <m.icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-chart-green"><ArrowUpRight className="w-3 h-3" />12.4%</span>
                </div>
                <div className="kpi-label mb-1">{m.l}</div>
                <div className={clsx('font-mono font-bold text-2xl tracking-tight', m.c)}>{m.v}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="cip-card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-chart-green" />近7日系统运行态势
              </h3>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {Array.from({ length: 28 }).map((_, i) => {
                  const h = 20 + Math.abs(Math.sin(i * 0.6)) * 80;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-full h-16 rounded-sm bg-space-700/40 flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-sm"
                          style={{ height: `${h}%`, background: `linear-gradient(to top, ${h > 75 ? '#C0392B' : h > 55 ? '#F59E0B' : h > 35 ? '#D4AF37' : '#3B82F6'} 0%, ${h > 75 ? '#9B2A1E' : h > 55 ? '#B45309' : h > 35 ? '#95751B' : '#1D4ED8'} 100%)` }}
                        />
                      </div>
                      <div className="w-1 h-1 rounded-full bg-space-600" />
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-space-700/40">
                {[{ l: '可用性', v: '99.98%', c: 'text-chart-green' }, { l: '平均响应', v: '128ms', c: 'text-chart-blue' }, { l: '错误率', v: '0.04%', c: 'text-gold-400' }].map(s => (
                  <div key={s.l} className="text-center p-3 rounded-xl bg-space-800/30">
                    <div className={clsx('font-mono font-bold text-lg', s.c)}>{s.v}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cip-card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-chart-orange" />待处理事项 · 优先级队列
              </h3>
              <div className="space-y-2.5">
                {[
                  { p: '高', t: '华光影业申请批量导出TOP100影院全年经营数据', time: '10分钟前', u: '王经理' },
                  { p: '高', t: '3条数据API异常调用警报（疑似爬虫行为）', time: '32分钟前', u: '系统监控' },
                  { p: '中', t: '6月份行业月报待终审签发', time: '1小时前', u: '陈总监' },
                  { p: '中', t: '4家新用户企业认证资料审核', time: '2小时前', u: '用户中心' },
                  { p: '低', t: '数据看板页面加载性能优化建议', time: '昨日', u: '前端监控' },
                  { p: '低', t: '用户建议：增加动画题材受众细分数据', time: '昨日', u: '意见反馈' },
                ].map((it, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-space-800/30 border border-space-700/40 hover:border-space-600/50 transition-colors cursor-pointer group">
                    <span className={clsx(
                      'mt-0.5 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold',
                      it.p === '高' ? 'bg-cine-500/20 text-cine-400 border border-cine-500/30'
                        : it.p === '中' ? 'bg-chart-orange/20 text-chart-orange border border-chart-orange/30'
                        : 'bg-space-700 text-slate-400'
                    )}>{it.p}级</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 group-hover:text-gold-400 transition-colors">{it.t}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" />{it.time}
                        <span className="text-space-600">·</span>发起人：{it.u}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-gold-400 shrink-0 mt-0.5" strokeWidth={2} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { to: '/admin/permissions', t: '权限分级管理', d: '三级权限体系 · 角色矩阵配置', icon: Lock, color: 'from-chart-purple/20 to-violet-500/5', border: 'border-chart-purple/30', text: 'text-chart-purple', action: `${permissions.roles.length || 5} 个角色` },
              { to: '/admin/audit', t: '导出审计日志', d: '全链路追溯 · 合规审查存档', icon: FileSearch, color: 'from-chart-blue/20 to-cyan-500/5', border: 'border-chart-blue/30', text: 'text-chart-blue', action: `${auditLogs.length || 28} 条记录` },
              { to: '/admin/reports', t: '报告生成中心', d: '周/月/档期专报 · 自动推送', icon: FileBarChart, color: 'from-chart-green/20 to-emerald-500/5', border: 'border-chart-green/30', text: 'text-chart-green', action: `${reports.length || 8} 份已生成` },
            ].map((c, i) => (
              <Link key={i} to={c.to} className={clsx('cip-card p-5 hover:shadow-lg transition-all group block', c.border)}>
                <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-105 transition-transform', c.color)}>
                  <c.icon className={clsx('w-5.5 h-5.5', c.text)} strokeWidth={1.8} />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={clsx('font-serif font-semibold text-lg', c.text)}>{c.t}</h3>
                  <ChevronRight className={clsx('w-4 h-4 transition-transform group-hover:translate-x-0.5', c.text)} strokeWidth={2} />
                </div>
                <div className="text-xs text-slate-400 mb-3">{c.d}</div>
                <div className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-space-700/50 text-slate-300">
                  <BarChart3 className="w-3 h-3" />{c.action}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {mode === 'permissions' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {(permissions.levels.length ? permissions.levels : [
              { level: 'public', name: '公开数据版', description: '面向全行业免费开放的基础数据服务', modules: ['票房总览', '基础榜单', '公开资讯'], apiQuota: '100次/天', exportLimit: 'Excel 5次/月', price: '免费' },
              { level: 'subscription', name: '订阅专业版', description: '为专业从业者提供的深度数据分析服务', modules: ['全量票房', '排片预测', '上座率热力图', '受众画像', '标准报告'], apiQuota: '10000次/天', exportLimit: 'Excel/PDF 100次/月', price: '¥9,999/月' },
              { level: 'custom', name: '企业定制版', description: '为制片/发行/院线头部企业定制的专属方案', modules: ['全部模块', '定制API', '定制报告', '专属经理', '剧组协作高级'], apiQuota: '不限量', exportLimit: '全格式不限', price: '面议' },
            ] as PermissionLevel[]).map((lvl, i) => (
              <div key={lvl.level} className={clsx(
                'cip-card p-6 relative overflow-hidden flex flex-col',
                i === 1 && 'border-gradient-gold shadow-glow-gold scale-[1.01]'
              )}>
                {i === 1 && (
                  <div className="absolute top-0 right-6 bg-gradient-to-r from-gold-500 to-amber-500 text-space-950 text-[11px] font-bold px-3 py-1 rounded-b-lg shadow-lg">
                    最受欢迎
                  </div>
                )}
                <div className="mb-5">
                  <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3',
                    i === 0 ? 'bg-space-700 text-slate-300' : i === 1 ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-chart-purple/15 text-chart-purple border border-chart-purple/30')}>
                    {i === 0 ? <Globe2 className="w-3 h-3" /> : i === 1 ? <Zap className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {lvl.level === 'public' ? 'LEVEL 1' : lvl.level === 'subscription' ? 'LEVEL 2' : 'LEVEL 3'}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-100 mb-1">{lvl.name}</h3>
                  <p className="text-xs text-slate-500">{lvl.description}</p>
                </div>
                <div className="mb-5 pb-5 border-b border-space-700/40">
                  <div className="text-xs text-slate-500 mb-1">价格方案</div>
                  <div className={clsx('font-mono font-bold text-3xl', i === 1 ? 'text-gradient-gold' : 'text-slate-200')}>{lvl.price}</div>
                </div>
                <div className="flex-1 space-y-2.5 mb-5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">功能模块</div>
                  {lvl.modules.map(m => (
                    <div key={m} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className={clsx('w-4 h-4 shrink-0', i === 1 ? 'text-gold-400' : 'text-chart-green')} strokeWidth={2.5} />
                      {m}
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5 mb-6 pt-4 border-t border-space-700/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">API配额</span>
                    <span className="font-mono text-slate-200">{lvl.apiQuota}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">导出限制</span>
                    <span className="font-mono text-slate-200">{lvl.exportLimit}</span>
                  </div>
                </div>
                <button className={clsx('w-full py-3 rounded-xl font-semibold text-sm transition-all',
                  i === 1 ? 'bg-gold-500 text-space-950 hover:bg-gold-400 shadow-glow-gold' :
                  i === 0 ? 'btn-secondary' : 'bg-gradient-to-r from-chart-purple to-violet-600 text-white hover:opacity-90')}>
                  {i === 0 ? '免费开通' : i === 1 ? '立即订阅' : '联系销售'}
                </button>
              </div>
            ))}
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-chart-blue" />角色权限矩阵
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">勾选为角色授予对应模块访问权限</p>
              </div>
              <button className="btn-primary text-sm h-9 flex items-center gap-1.5">
                <Users className="w-4 h-4" />新增自定义角色
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-space-700/50">
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">角色名称</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-semibold uppercase">权限级别</th>
                    {['数据大屏', '排片预测', '上座率', '受众分析', '剧组协作', '报告中心', '后台管理'].map(m => (
                      <th key={m} className="text-center py-3 px-2 text-xs text-slate-500 font-semibold">{m}</th>
                    ))}
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(permissions.roles.length ? permissions.roles : [
                    { roleId: 'R001', roleName: '院线经理', permissionLevel: '订阅专业版', customPermissions: { 数据大屏: true, 排片预测: false, 上座率: true, 受众分析: false, 剧组协作: false, 报告中心: true, 后台管理: false } },
                    { roleId: 'R002', roleName: '发行专员', permissionLevel: '订阅专业版', customPermissions: { 数据大屏: true, 排片预测: true, 上座率: true, 受众分析: true, 剧组协作: false, 报告中心: true, 后台管理: false } },
                    { roleId: 'R003', roleName: '制片总监', permissionLevel: '企业定制版', customPermissions: { 数据大屏: true, 排片预测: true, 上座率: true, 受众分析: true, 剧组协作: true, 报告中心: true, 后台管理: false } },
                    { roleId: 'R004', roleName: '独立从业者', permissionLevel: '公开数据版', customPermissions: { 数据大屏: true, 排片预测: false, 上座率: false, 受众分析: false, 剧组协作: true, 报告中心: false, 后台管理: false } },
                    { roleId: 'R005', roleName: '平台管理员', permissionLevel: '企业定制版', customPermissions: { 数据大屏: true, 排片预测: true, 上座率: true, 受众分析: true, 剧组协作: true, 报告中心: true, 后台管理: true } },
                  ] as RolePermission[] & { customPermissions: Record<string, boolean> }[]).map((r, ri) => (
                    <tr key={r.roleId} className={clsx('border-b border-space-700/30 hover:bg-space-700/20 transition-colors', ri % 2 === 1 && 'bg-space-800/20')}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-space-700/60 flex items-center justify-center">
                            <Users className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{r.roleName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{r.roleId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={clsx('badge text-[10px] px-2 py-0.5',
                          r.permissionLevel.includes('定制') ? 'bg-chart-purple/15 text-chart-purple border-chart-purple/30' :
                          r.permissionLevel.includes('订阅') ? 'bg-gold-500/15 text-gold-400 border-gold-500/30' :
                          'bg-space-700 text-slate-400')}>
                          {r.permissionLevel}
                        </span>
                      </td>
                      {['数据大屏', '排片预测', '上座率', '受众分析', '剧组协作', '报告中心', '后台管理'].map(m => {
                        const on = r.customPermissions[m];
                        return (
                          <td key={m} className="text-center py-3 px-2">
                            <div className={clsx(
                              'inline-flex w-5 h-5 rounded-md items-center justify-center transition-all cursor-pointer',
                              on ? 'bg-chart-green/25 border border-chart-green/50' : 'bg-space-700/60 border border-space-600/40 hover:border-space-500'
                            )}>
                              {on && <CheckCircle2 className="w-3.5 h-3.5 text-chart-green" strokeWidth={3} />}
                            </div>
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-4">
                        <button className="text-xs text-chart-blue hover:text-chart-cyan transition-colors mr-3">编辑</button>
                        <button className="text-xs text-slate-500 hover:text-cine-400 transition-colors">克隆</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-chart-purple" strokeWidth={1.8} />数据访问边界明细
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">各套餐级别的数据类别访问权限对照</p>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-space-700/50">
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase tracking-wider w-[200px]">数据类别</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-semibold">公开数据版</th>
                    <th className="text-center py-3 px-4 text-xs text-gold-500 font-semibold">订阅专业版</th>
                    <th className="text-center py-3 px-4 text-xs text-chart-purple font-semibold">企业定制版</th>
                  </tr>
                </thead>
                <tbody>
                  {dataAccessBoundary.map((row, i) => (
                    <tr key={row.category} className={clsx('border-b border-space-700/30', i % 2 === 1 && 'bg-space-800/20')}>
                      <td className="py-3 px-4 text-slate-200 font-medium">{row.category}</td>
                      {row.levels.map((level, li) => (
                        <td key={li} className="text-center py-3 px-4">
                          <AccessCell level={level} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-space-700/50 bg-space-800/30">
                    <td className="py-3 px-4 text-slate-300 font-semibold text-xs uppercase tracking-wider">可访问数据类别数</td>
                    {[
                      dataAccessBoundary.filter(r => r.levels[0] !== 'none').length,
                      dataAccessBoundary.filter(r => r.levels[1] !== 'none').length,
                      dataAccessBoundary.filter(r => r.levels[2] !== 'none').length,
                    ].map((count, i) => (
                      <td key={i} className="text-center py-3 px-4">
                        <span className={clsx('font-mono font-bold text-lg', i === 2 ? 'text-chart-purple' : i === 1 ? 'text-gold-400' : 'text-slate-300')}>
                          {count}
                        </span>
                        <span className="text-slate-500 text-xs"> / {dataAccessBoundary.length}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mode === 'audit' && (
        <div className="space-y-5">
          <div className="cip-card p-4 flex flex-wrap items-center gap-4">
            <div className="relative">
              <FileSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
              <input placeholder="搜索操作人 / 数据类型 / 用途..." className="w-72 h-10 pl-10 pr-4 rounded-xl bg-space-800/50 border border-space-700/50 text-sm placeholder:text-slate-500 focus:outline-none focus:border-gold-500/40 transition-all" />
            </div>
            {[
              { k: 'status', label: '状态', items: ['全部', '已通过', '待审核', '已拒绝'] },
              { k: 'format', label: '格式', items: ['全部', 'Excel', 'PDF', 'CSV', 'API'] },
              { k: 'role', label: '角色', items: ['全部', '院线经理', '发行专员', '制片总监', '独立从业者', '数据分析师'] },
            ].map(sec => (
              <div key={sec.k} className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{sec.label}</span>
                <select
                  value={(filters as never)[sec.k]}
                  onChange={e => setFilters(f => ({ ...f, [sec.k]: e.target.value }))}
                  className="h-9 px-3 rounded-xl bg-space-800/50 border border-space-700/50 text-sm text-slate-200 focus:outline-none focus:border-gold-500/40"
                >
                  {sec.items.map(it => <option key={it} value={it}>{it}</option>)}
                </select>
              </div>
            ))}
            <div className="ml-auto text-xs text-slate-400">
              共 <span className="font-mono text-gold-400 font-bold">{filterLogs.length}</span> 条记录
            </div>
          </div>

          <div className="cip-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[1400px]">
                <thead>
                  <tr className="bg-space-800/70 border-b border-space-700/50">
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">操作信息</th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">数据范围</th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">用途说明</th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">格式</th>
                    <th className="text-center py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">
                      <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.8} />合规校验</span>
                    </th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">文件哈希摘要</th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">时间</th>
                    <th className="text-left py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase">状态</th>
                    <th className="text-right py-3.5 px-4 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(filterLogs.length ? filterLogs : Array.from({ length: 15 }).map((_, i) => ({
                    logId: `LOG${i}`, userId: `U${1000 + i}`, userName: ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '黄磊'][i % 7],
                    userRole: ['院线经理', '发行专员', '制片总监', '独立从业者', '数据分析师'][i % 5],
                    operationTime: `2026-06-${String(20 - Math.floor(i / 3)).padStart(2, '0')} ${String(18 - i % 12).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}:00`,
                    dataType: ['票房明细数据', '排片预测结果', '受众画像报告', '上座率原始数据', '影院经营数据', '竞品分析报表'][i % 6],
                    dataScope: ['全国数据', '华北区域', '万达院线', 'TOP100影院', '2026暑期档', '科幻题材影片', '一线城市'][i % 7],
                    purpose: ['制作发行决策参考', '季度经营复盘汇报', '投资方数据尽调', '行业研究报告撰写', '排片策略调整依据', '客户提案演示'][i % 6],
                    format: (['Excel', 'PDF', 'CSV', 'API'] as const)[i % 4],
                    status: (['approved', 'approved', 'pending', 'approved', 'rejected'] as const)[i % 5],
                    fileHash: `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 10)}`,
                  }))).map((log, i) => {
                    const comp = getCompliance(log);
                    return (
                      <tr key={log.logId} className={clsx('border-b border-space-700/30 hover:bg-space-700/15 transition-colors', i % 2 === 1 && 'bg-space-800/20')}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-space-700/60 flex items-center justify-center shrink-0">
                              <Users className="w-4.5 h-4.5 text-slate-400" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-200">{log.userName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">#{log.userId}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{log.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm text-slate-200">{log.dataType}</span>
                            {comp.isSensitive && (
                              <span className="badge badge-warn text-[9px] px-1.5 py-0">已脱敏</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                            <Database className="w-3 h-3" />{log.dataScope}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="text-sm text-slate-300 line-clamp-2">{log.purpose}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={clsx('badge text-[11px] px-2 py-0.5',
                            log.format === 'PDF' ? 'bg-cine-500/15 text-cine-400 border-cine-500/30' :
                            log.format === 'Excel' ? 'bg-chart-green/15 text-chart-green border-chart-green/30' :
                            log.format === 'CSV' ? 'bg-chart-blue/15 text-chart-blue border-chart-blue/30' :
                            'bg-chart-purple/15 text-chart-purple border-chart-purple/30')}>
                            {log.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {[
                              { label: '数据脱敏', pass: comp.desensitized },
                              { label: '权限验证', pass: comp.permissionVerified },
                              { label: '用途合规', pass: comp.purposeCompliant },
                            ].map(check => (
                              <span key={check.label} className="inline-flex items-center gap-0.5" title={`${check.label}${check.pass ? ' ✓' : ' ✗'}`}>
                                {check.pass
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-chart-green" strokeWidth={2.5} />
                                  : <X className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => copyHash(log.fileHash)}
                            className="font-mono text-xs text-slate-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1"
                          >
                            {log.fileHash.slice(0, 14)}...
                            <Copy className="w-3 h-3" strokeWidth={1.8} />
                            {copiedHash === log.fileHash && <span className="text-[10px] text-chart-green ml-0.5">已复制</span>}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-sm font-mono text-slate-300">{log.operationTime.split(' ')[0]}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.operationTime.split(' ')[1]}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={clsx('badge text-[11px] px-2.5 py-1 border', statusMap[log.status]?.cls)}>
                            {statusMap[log.status]?.label || log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {log.status === 'pending' && (
                            <>
                              <button className="text-[11px] text-chart-green hover:text-emerald-400 transition-colors mr-2 font-medium">通过</button>
                              <button className="text-[11px] text-cine-400 hover:text-cine-300 transition-colors mr-2 font-medium">拒绝</button>
                            </>
                          )}
                          <button className="text-[11px] text-slate-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />溯源
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-space-700/50 bg-space-800/40 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-chart-green" strokeWidth={1.8} />
                  <span className="text-slate-400">已通过</span>
                  <span className="font-mono font-bold text-chart-green">{complianceApproved}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-chart-orange" strokeWidth={1.8} />
                  <span className="text-slate-400">待审核</span>
                  <span className="font-mono font-bold text-chart-orange">{compliancePending}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <X className="w-4 h-4 text-cine-400" strokeWidth={1.8} />
                  <span className="text-slate-400">已拒绝</span>
                  <span className="font-mono font-bold text-cine-400">{complianceRejected}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-gold-400" strokeWidth={1.8} />
                <span className="text-slate-400">合规率</span>
                <span className={clsx('font-mono font-bold text-lg', complianceRate >= 80 ? 'text-chart-green' : complianceRate >= 50 ? 'text-chart-orange' : 'text-cine-400')}>
                  {complianceRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'reports' && (
        <div className="space-y-5">
          <div className="cip-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-gold-400" strokeWidth={1.8} />报告模板配置 · 自动化生成任务
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-1 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">报告类型</label>
                  <div className="space-y-1.5">
                    {[{ k: 'weekly', l: '行业周报', i: '📊' }, { k: 'monthly', l: '经营月报', i: '📈' }, { k: 'special', l: '档期专报', i: '🎯' }].map(t => (
                      <button key={t.k} onClick={() => setReportConfig(r => ({ ...r, type: t.k }))} className={clsx(
                        'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                        reportConfig.type === t.k
                          ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
                          : 'bg-space-800/30 border-space-700/40 text-slate-300 hover:border-space-600/60'
                      )}>
                        <span className="text-xl">{t.i}</span>
                        <span className="font-medium text-sm">{t.l}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">报告周期</label>
                  <select value={reportConfig.period} onChange={e => setReportConfig(r => ({ ...r, period: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-space-800/50 border border-space-700/50 text-sm text-slate-200 focus:outline-none focus:border-gold-500/40">
                    <option value="last7">最近 7 天</option>
                    <option value="last30">最近 30 天</option>
                    <option value="last90">最近 90 天</option>
                    <option value="q2">2026年Q2</option>
                    <option value="summer">2026暑期档专期</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">推送方式</label>
                  <div className="space-y-1.5">
                    {[{ k: 'email', l: '邮件推送', i: '📧' }, { k: 'download', l: '站内下载', i: '⬇️' }, { k: 'sms', l: '短信通知', i: '📱' }].map(d => (
                      <label key={d.k} className={clsx(
                        'flex items-center gap-3 p-2.5 rounded-xl text-sm cursor-pointer transition-all border',
                        reportConfig.delivery.includes(d.k)
                          ? 'bg-chart-blue/10 border-chart-blue/40 text-chart-blue'
                          : 'bg-space-800/30 border-space-700/40 text-slate-400 hover:border-space-600/60'
                      )}>
                        <input type="checkbox" checked={reportConfig.delivery.includes(d.k)} onChange={e => {
                          setReportConfig(r => ({
                            ...r, delivery: e.target.checked ? [...r.delivery, d.k] : r.delivery.filter(x => x !== d.k)
                          }));
                        }} className="w-4 h-4 accent-gold-500" />
                        <span>{d.i}</span>
                        <span>{d.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerateReport} className="btn-primary w-full h-11 flex items-center justify-center gap-2 mt-2">
                  <Zap className="w-4 h-4" strokeWidth={1.8} />立即生成报告
                </button>
              </div>

              <div className="lg:col-span-3 p-5 rounded-2xl bg-gradient-to-br from-space-800/80 via-space-900/60 to-space-800/40 border border-space-700/50">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-space-700/40">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">报告预览 · {new Date().toLocaleDateString('zh-CN')}</div>
                    <h4 className="font-serif text-xl font-bold text-gradient-gold">
                      {reportConfig.type === 'weekly' ? '中国电影市场周度数据洞察报告'
                        : reportConfig.type === 'monthly' ? '中国电影市场月度经营分析报告'
                        : '2026暑期档影片表现专项分析报告'}
                    </h4>
                  </div>
                  <span className="badge badge-online text-[10px] px-2 py-0.5">实时数据 · 已校准</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[{ l: '当期总票房', v: '48.6亿', c: 'text-gold-400', s: '+12.5%' }, { l: '观影人次', v: '1.18亿', c: 'text-chart-green', s: '+8.3%' }, { l: '平均票价', v: '¥41.2', c: 'text-chart-blue', s: '+3.8%' }, { l: '场均人次', v: '9.8人', c: 'text-chart-orange', s: '-1.2%' }].map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-space-950/40 border border-space-700/30">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">{s.l}</div>
                      <div className={clsx('font-mono font-bold text-lg', s.c)}>{s.v}</div>
                      <div className="text-[10px] mt-0.5 text-chart-green">{s.s} 环比</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    { t: '一、市场大盘走势', d: '报告期内全国票房累计48.6亿元，同比上涨12.5%，为近三年同期最高水平。暑期档预热效应显著...' },
                    { t: '二、档期影片表现分析', d: '头部影片《星河长明》首周票房突破18亿，市场占比37%，创下科幻题材首周票房新纪录；同期上映《山海谣》...' },
                    { t: '三、影院经营与区域洞察', d: '一线城市票房贡献占比42%，较上期下降1.2pp；下沉市场增长亮眼，三四线城市同比增幅达18.7%...' },
                    { t: '四、受众画像与观影偏好', d: '25-34岁年龄段为核心消费群体，占比34.2%；科幻题材偏好度持续攀升，悬疑犯罪题材紧随其后...' },
                    { t: '五、未来走势预测与经营建议', d: '预计下周随着3部重点影片入市，单周票房有望冲击55亿；建议院线适度提升黄金场排片...' },
                  ].map((s, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-space-950/30 border border-space-700/25">
                      <h5 className="text-sm font-semibold text-slate-200 mb-1.5">{s.t}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">{s.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {reportResult ? (
            <div className="cip-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold-400" strokeWidth={1.8} />报告生成结果
                </h3>
                <button onClick={() => setReportResult(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">关闭</button>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-500/5 via-space-800/60 to-space-900/40 border border-gold-500/20 mb-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-serif text-xl font-bold text-gradient-gold mb-1">{reportResult.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.8} />{reportResult.generatedAt}</span>
                      <span className="text-space-600">·</span>
                      <span>{reportResult.fileSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {reportResult.dataVerified ? (
                      <span className="badge badge-online text-[10px] px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.2} />数据校验通过
                      </span>
                    ) : (
                      <span className="badge badge-warn text-[10px] px-2.5 py-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />数据校验异常
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5 mb-5">
                  {reportResult.chapters.map((ch, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-space-950/40 border border-space-700/25">
                      <h5 className="text-sm font-semibold text-slate-200 mb-1">{ch.title}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">下载报告</span>
                  {[
                    { fmt: 'PDF', cls: 'bg-cine-500/15 text-cine-400 border-cine-500/30 hover:bg-cine-500/25' },
                    { fmt: 'Excel', cls: 'bg-chart-green/15 text-chart-green border-chart-green/30 hover:bg-chart-green/25' },
                    { fmt: 'PPT', cls: 'bg-chart-orange/15 text-chart-orange border-chart-orange/30 hover:bg-chart-orange/25' },
                  ].map(dl => (
                    <button key={dl.fmt} className={clsx('inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors', dl.cls)}>
                      <Download className="w-3.5 h-3.5" strokeWidth={1.8} />{dl.fmt}
                    </button>
                  ))}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-chart-green" strokeWidth={1.8} />
                  本报告数据来源已通过合规审计，文件哈希：<span className="font-mono text-slate-400">{reportResult.fileHash}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="cip-card p-8 flex flex-col items-center justify-center text-center">
              <FileBarChart className="w-16 h-16 text-slate-600 mb-4" strokeWidth={1.2} />
              <h4 className="text-lg font-semibold text-slate-300 mb-2">尚未生成报告</h4>
              <p className="text-sm text-slate-500 max-w-md">请在上方配置报告参数后，点击"立即生成报告"按钮开始生成</p>
            </div>
          )}

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-chart-blue" strokeWidth={1.8} />历史报告 · 生成任务队列
              </h3>
              <span className="text-xs text-slate-500">共 {reports.length || 8} 份</span>
            </div>
            <div className="space-y-2.5">
              {(reports.length ? reports : [
                { reportId: 'RPT001', reportType: 'weekly', title: '2026年第24周中国电影市场周报', generatedAt: '2026-06-17 08:00:00', downloadUrl: '/d/1.pdf', status: 'ready' as const, fileSize: '8.4 MB' },
                { reportId: 'RPT002', reportType: 'special', title: '2026端午档影片票房表现复盘专报', generatedAt: '2026-06-12 09:30:00', downloadUrl: '/d/2.pdf', status: 'ready' as const, fileSize: '12.7 MB' },
                { reportId: 'RPT003', reportType: 'monthly', title: '2026年5月暑期档预热月度分析报告', generatedAt: '2026-06-02 08:00:00', downloadUrl: '/d/3.pdf', status: 'ready' as const, fileSize: '15.2 MB' },
                { reportId: 'RPT004', reportType: 'special', title: '科幻题材影片受众迁移趋势专报', generatedAt: '2026-06-19 15:42:00', downloadUrl: '', status: 'generating' as const, fileSize: '-' },
                { reportId: 'RPT005', reportType: 'weekly', title: '2026年Q2院线经营数据综合报告', generatedAt: '2026-05-28 21:18:00', downloadUrl: '/d/5.pdf', status: 'failed' as const, fileSize: '-' },
                { reportId: 'RPT006', reportType: 'special', title: '一线城市影院上座率洞察月报', generatedAt: '2026-06-10 10:00:00', downloadUrl: '/d/6.pdf', status: 'ready' as const, fileSize: '6.8 MB' },
                { reportId: 'RPT007', reportType: 'weekly', title: '2026年第23周中国电影市场周报', generatedAt: '2026-06-10 08:00:00', downloadUrl: '/d/7.pdf', status: 'ready' as const, fileSize: '7.9 MB' },
                { reportId: 'RPT008', reportType: 'monthly', title: '青年受众观影偏好变化季度报告', generatedAt: '2026-04-05 08:00:00', downloadUrl: '/d/8.pdf', status: 'ready' as const, fileSize: '11.3 MB' },
              ] as ReportInfo[]).map(r => (
                <div key={r.reportId} className="flex items-center gap-4 p-4 rounded-xl bg-space-800/30 border border-space-700/40 hover:border-space-600/60 transition-all group">
                  <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                    r.status === 'ready' ? 'bg-gradient-to-br from-chart-green/25 to-emerald-500/10' :
                    r.status === 'generating' ? 'bg-gradient-to-br from-chart-blue/25 to-cyan-500/10 animate-pulse' :
                    'bg-gradient-to-br from-cine-500/25 to-red-500/10'
                  )}>
                    {r.status === 'ready' ? <CheckCircle2 className="w-5.5 h-5.5 text-chart-green" strokeWidth={2.2} />
                      : r.status === 'generating' ? <Activity className="w-5.5 h-5.5 text-chart-blue animate-spin" strokeWidth={2.2} />
                      : <AlertTriangle className="w-5.5 h-5.5 text-cine-400" strokeWidth={2.2} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={clsx('badge text-[10px] px-2 py-0.5',
                        r.reportType === 'weekly' ? 'bg-chart-blue/15 text-chart-blue border-chart-blue/30' :
                        r.reportType === 'monthly' ? 'bg-chart-purple/15 text-chart-purple border-chart-purple/30' :
                        'bg-chart-orange/15 text-chart-orange border-chart-orange/30')}>
                        {r.reportType === 'weekly' ? '周报' : r.reportType === 'monthly' ? '月报' : '专报'}
                      </span>
                      <h4 className="font-medium text-slate-200 truncate group-hover:text-gold-400 transition-colors">{r.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="font-mono">生成于 {r.generatedAt}</span>
                      <span className="text-space-600">·</span>
                      <span>{r.fileSize}</span>
                      <span className="text-space-600">·</span>
                      <span className="font-mono">{r.reportId}</span>
                    </div>
                  </div>
                  <span className={clsx('badge text-[11px] px-3 py-1 border',
                    r.status === 'ready' ? 'bg-chart-green/15 text-chart-green border-chart-green/30' :
                    r.status === 'generating' ? 'bg-chart-blue/15 text-chart-blue border-chart-blue/30' :
                    'bg-cine-500/15 text-cine-400 border-cine-500/30'
                  )}>
                    {r.status === 'ready' ? '已生成' : r.status === 'generating' ? '生成中 68%' : '生成失败'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {r.status === 'ready' && (
                      <button className="px-3 py-1.5 rounded-lg text-xs text-chart-blue hover:bg-chart-blue/10 transition-colors font-medium">
                        预览
                      </button>
                    )}
                    <button className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs transition-colors font-medium',
                      r.status === 'ready' ? 'text-gold-400 hover:bg-gold-500/10'
                        : r.status === 'failed' ? 'text-cine-400 hover:bg-cine-500/10'
                        : 'text-slate-500 cursor-not-allowed'
                    )}>
                      {r.status === 'ready' ? '下载' : r.status === 'failed' ? '重试' : '处理中...'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
