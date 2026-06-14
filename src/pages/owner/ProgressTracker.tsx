import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Timer,
  TriangleAlert,
  UserCheck,
} from 'lucide-react';

const projectSteps = [
  { name: '需求确认', date: '06-08', status: 'done', owner: '林女士' },
  { name: '上门量房', date: '06-10', status: 'done', owner: '华筑精工' },
  { name: '方案报价', date: '06-12', status: 'done', owner: '设计负责人' },
  { name: '合同托管', date: '06-14', status: 'active', owner: '平台托管' },
  { name: '开工交底', date: '06-18', status: 'pending', owner: '项目经理' },
  { name: '水电验收', date: '06-26', status: 'pending', owner: '第三方监理' },
];

const inspectionItems = [
  ['报价复核', '主材、辅材、人工、设计管理费已拆分核验', '已通过'],
  ['资质核验', '华筑精工装饰一级资质、设计师执业证书在有效期内', '已通过'],
  ['风险提醒', '合同托管未完成前，不建议支付线下定金', '待确认'],
];

const documents = [
  { name: '量房记录单', owner: '张工', time: '2026-06-10 16:42' },
  { name: '三室两厅平面优化方案', owner: '陈设计', time: '2026-06-12 11:20' },
  { name: '18.6万透明报价明细', owner: '平台复核', time: '2026-06-12 18:05' },
];

export default function ProgressTracker() {
  const { projectId } = useParams();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/owner/profile" className="inline-flex items-center gap-2 text-sm text-ivory-600 hover:text-terracotta-700 mb-3">
            <ArrowLeft className="w-4 h-4" />
            返回个人中心
          </Link>
          <h1 className="section-title mb-1">滨江壹号装修进度详情</h1>
          <p className="text-ivory-600">
            项目编号 {projectId || 'home-renovation'} · 89㎡ 三室两厅 · 华筑精工装饰承接
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge-success">
            <ShieldCheck className="w-3.5 h-3.5" />
            平台资金托管
          </span>
          <span className="badge-wood">第三方监理已绑定</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['当前阶段', '合同托管', ClipboardCheck],
          ['计划开工', '06月18日', CalendarDays],
          ['预算总额', '¥18.6万', Banknote],
          ['延期风险', '低风险', Timer],
        ].map(([label, value, Icon]) => (
          <section key={label as string} className="card-base p-5">
            <Icon className="w-5 h-5 text-terracotta-600 mb-3" />
            <div className="text-sm text-ivory-500">{label as string}</div>
            <div className="text-2xl font-mono font-semibold text-carbon-800 mt-1">{value as string}</div>
          </section>
        ))}
      </div>

      <section className="card-base p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl text-carbon-800">装修节点追踪</h2>
            <p className="text-sm text-ivory-600 mt-1">每个节点保留负责人、文件和验收状态</p>
          </div>
          <span className="text-sm font-mono text-terracotta-700">整体进度 60%</span>
        </div>
        <div className="h-2 rounded-full bg-ivory-200 overflow-hidden mb-7">
          <div className="h-full w-[60%] bg-gradient-to-r from-terracotta-500 to-wood-500 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {projectSteps.map((step, index) => (
            <div key={step.name} className="rounded-xl border border-ivory-300 bg-ivory-50 p-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm mb-3 ${
                  step.status === 'done'
                    ? 'bg-terracotta-500 text-white'
                    : step.status === 'active'
                      ? 'bg-wood-500 text-white'
                      : 'bg-ivory-200 text-ivory-600'
                }`}
              >
                {step.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <h3 className="font-medium text-carbon-800">{step.name}</h3>
              <p className="text-xs text-ivory-500 mt-2">{step.date} · {step.owner}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">本周待确认事项</h2>
          <div className="space-y-3">
            {inspectionItems.map(([title, desc, status]) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-ivory-300 bg-ivory-50 p-4">
                {status === '待确认' ? (
                  <TriangleAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-carbon-800">{title}</h3>
                    <span className={status === '待确认' ? 'badge-warning' : 'badge-success'}>{status}</span>
                  </div>
                  <p className="text-sm text-ivory-600 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">项目资料</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-ivory-300 p-4">
                <FileText className="w-5 h-5 text-haze-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-carbon-800 truncate">{doc.name}</div>
                  <div className="text-xs text-ivory-500 mt-1">{doc.owner} · {doc.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card-base p-6">
        <h2 className="font-serif text-xl text-carbon-800 mb-5">服务团队与沟通记录</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            [Home, '项目经理', '张工', '负责施工排期、节点交付和现场协调'],
            [UserCheck, '第三方监理', '周明', '负责水电、泥瓦、竣工验收复核'],
            [MessageSquareText, '最近沟通', '06-12 18:40', '报价明细已发送，等待托管确认'],
            [MapPin, '施工地址', '滨江壹号 5栋1202', '已完成门禁报备和邻里告知'],
          ].map(([Icon, title, name, desc]) => (
            <div key={title as string} className="rounded-xl bg-ivory-50 border border-ivory-300 p-4">
              <Icon className="w-5 h-5 text-terracotta-600 mb-3" />
              <div className="text-xs text-ivory-500">{title as string}</div>
              <div className="font-medium text-carbon-800 mt-1">{name as string}</div>
              <p className="text-sm text-ivory-600 mt-2">{desc as string}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
