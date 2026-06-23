import { useState } from 'react';
import {
  Building2, Plus, FileX, Gift, HardHat, Receipt, Utensils,
  ChevronRight, Clock, FileCheck, CheckCircle2, AlertCircle,
  UserCheck, Landmark, Bank, Users, Sparkles, ArrowRight,
  Building, Briefcase, Search, Tag, TrendingUp, BarChart3,
  Zap, Shield, ListTodo, List, Paperclip, BuildingOffice
} from 'lucide-react';
import { enterpriseServices } from '../data/mock';

const serviceTypes = [
  { key: 'all', label: '全部服务', icon: Building2 },
  { key: 'establish', label: '企业开办', icon: Plus, color: 'from-emerald-500 to-teal-600' },
  { key: 'cancel', label: '企业注销', icon: FileX, color: 'from-rose-500 to-red-600' },
  { key: 'subsidy', label: '补贴申领', icon: Gift, color: 'from-amber-500 to-orange-600' },
  { key: 'tax', label: '税务服务', icon: Receipt, color: 'from-blue-500 to-indigo-600' },
  { key: 'permit', label: '资质许可', icon: HardHat, color: 'from-purple-500 to-violet-600' },
];

const quickStats = [
  { label: '在办企业数', value: '1,286,340', icon: BuildingOffice, change: '+2.3%', positive: true },
  { label: '本月新开办', value: '4,586', icon: Plus, change: '+8.6%', positive: true },
  { label: '惠企补贴发放', value: '¥18.2亿', icon: Gift, change: '+15.2%', positive: true },
  { label: '平均开办时长', value: '0.5天', icon: Clock, change: '-33%', positive: true },
];

export default function EnterpriseDesk() {
  const [activeType, setActiveType] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>(enterpriseServices[0].id);
  const [activeStep, setActiveStep] = useState<number>(0);

  const filtered = activeType === 'all'
    ? enterpriseServices
    : enterpriseServices.filter(s => s.type === activeType);

  const current = enterpriseServices.find(s => s.id === selectedService)!;
  const currentStep = current?.steps[activeStep];

  const requiredSteps = current?.steps.filter(s => s.required).length || 0;

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-gov-800 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden mb-8 shadow-xl">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -top-20 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        </div>
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-4">
              <Building2 className="w-4 h-4" />
              面向全市128万+市场主体
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              企业服务台 · 全生命周期<span className="text-emerald-300">图谱化</span>办事
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              涵盖企业开办、变更、注销、补贴申领、资质许可、税务服务全流程。
              通过服务编排引擎将跨部门事项封装为"一件事"，流程图谱可视化，环节进度实时跟踪。
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-semibold transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                <Plus className="w-5 h-5" />开办新企业
              </button>
              <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium transition-colors flex items-center gap-2">
                <Gift className="w-5 h-5" />惠企政策匹配
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickStats.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.positive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-white/60 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-5">
          <ListTodo className="w-6 h-6 text-gov-600" />
          全生命周期服务图谱
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {serviceTypes.map(type => {
            const Icon = type.icon;
            const active = activeType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => setActiveType(type.key)}
                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gov-600 text-white shadow-lg shadow-gov-600/20'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-500 px-1">选择服务类型</p>
          {filtered.map(service => {
            const active = selectedService === service.id;
            const typeCfg = serviceTypes.find(t => t.key === service.type) || serviceTypes[0];
            const bgColor = active ? 'gov-50' : 'white';
            const borderColor = active ? 'gov-300' : 'gray-100';
            return (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service.id); setActiveStep(0); }}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 bg-${bgColor} border-${borderColor} ${active ? 'shadow-md' : 'hover:border-gray-200 hover:bg-gray-50'}`}
                style={{
                  backgroundColor: active ? '#f0f7ff' : '#fff',
                  borderColor: active ? '#bfdbfe' : '#f3f4f6'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeCfg.color || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white shrink-0 shadow-md`}>
                    {typeCfg.icon && <typeCfg.icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{service.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{service.duration}</span>
                      <span className="flex items-center gap-1"><List className="w-3.5 h-3.5" />{service.steps.length}个环节</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {current && (
            <div className="gov-card p-6 md:p-8 h-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{current.name}</h3>
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Zap className="w-3 h-3 mr-1" />一件事集成办理
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">{current.description}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button className="gov-btn-secondary !py-2 !px-4 text-sm">
                    <FileCheck className="w-4 h-4" />申请指南
                  </button>
                  <button className="gov-btn-primary !py-2 !px-4 text-sm">
                    <Plus className="w-4 h-4" />立即办理
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-gov-50 to-blue-50 border border-gov-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">办理总时限</p>
                      <p className="font-bold text-gray-900 text-lg">{current.duration}</p>
                    </div>
                    <div className="w-px h-10 bg-gov-200" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">办理环节</p>
                      <p className="font-bold text-gray-900 text-lg">{current.steps.length} 个</p>
                    </div>
                    <div className="w-px h-10 bg-gov-200" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">必要环节</p>
                      <p className="font-bold text-gray-900 text-lg">{requiredSteps} 个</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gov-700">
                    <Shield className="w-4 h-4" />数据自动核验，无需重复提交
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gov-600" />流程图谱
                </h4>
                <div className="relative pb-2">
                  <div className="absolute top-8 left-6 right-6 h-0.5 bg-gray-200 rounded-full" />
                  <div className="relative grid gap-4" style={{ gridTemplateColumns: `repeat(${current.steps.length}, minmax(0, 1fr))` }}>
                    {current.steps.map((step, idx) => {
                      const isActive = activeStep === idx;
                      const isCompleted = idx < activeStep;
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveStep(idx)}
                          className="relative flex flex-col items-center text-center group z-10"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 transition-all duration-300 shrink-0 ${
                              isActive
                                ? 'bg-gov-600 text-white border-white shadow-lg shadow-gov-600/30 ring-4 ring-gov-100 scale-110'
                                : isCompleted
                                ? 'bg-emerald-500 text-white border-white shadow-md'
                                : 'bg-gray-100 text-gray-400 border-white'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                          </div>
                          <p className={`mt-2 text-xs font-medium leading-tight transition-colors ${
                            isActive ? 'text-gov-700' : isCompleted ? 'text-emerald-700' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          {!step.required && (
                            <span className="mt-1 text-[10px] text-gray-400">选办</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {currentStep && (
                <div className="rounded-2xl border-2 border-gov-200 bg-gradient-to-br from-white to-gov-50/40 p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gov-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                        {activeStep + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-bold text-gray-900">{currentStep.title}</h4>
                          <span className={`gov-badge ${currentStep.required ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {currentStep.required ? '必填环节' : '选填环节'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{currentStep.desc}</p>
                        {currentStep.bureau && (
                          <p className="text-xs text-gov-600 mt-2 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" />受理部门：{currentStep.bureau}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-gov-100">
                    <div className="p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />办理方式
                      </p>
                      <p className="text-sm font-medium text-gray-900">线上全程网办 / 线下一窗受理</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />办理时限
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {currentStep.required ? (activeStep === current.steps.length - 1 ? '1个工作日' : '即时-1个工作日') : '按需办理'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3 justify-end">
                    {activeStep > 0 && (
                      <button
                        onClick={() => setActiveStep(activeStep - 1)}
                        className="gov-btn-secondary !py-2 !px-4 text-sm"
                      >上一步</button>
                    )}
                    {activeStep < current.steps.length - 1 ? (
                      <button
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="gov-btn-primary !py-2 !px-4 text-sm"
                      >下一步 <ArrowRight className="w-4 h-4" /></button>
                    ) : (
                      <button className="gov-btn-primary !py-2 !px-4 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
                        <CheckCircle2 className="w-4 h-4" />进入办理入口
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <section className="gov-card p-6 md:p-8">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-gov-600" />
            所需材料清单
            <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {current?.requiredMaterials.length || 0} 项材料
            </span>
          </h3>
          <div className="space-y-3">
            {current?.requiredMaterials.map((mat, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gov-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 group-hover:border-gov-300 group-hover:bg-gov-100 flex items-center justify-center text-gray-500 group-hover:text-gov-700 transition-colors shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{mat}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Landmark className="w-3 h-3" />电子证照共享</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />系统自动核验</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg text-gray-400 hover:text-gov-700 hover:bg-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="gov-card p-6 md:p-8">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gov-600" />
            惠企政策匹配推荐
            <span className="ml-auto text-xs font-normal text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              AI 智能匹配 12 项
            </span>
          </h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索补贴、减税、人才政策…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gov-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-100 text-sm"
            />
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            <span className="gov-chip"><Tag className="w-3.5 h-3.5" />稳岗补贴</span>
            <span className="gov-chip"><Tag className="w-3.5 h-3.5" />技改补贴</span>
            <span className="gov-chip"><Tag className="w-3.5 h-3.5" />研发费用</span>
            <span className="gov-chip"><Tag className="w-3.5 h-3.5" />人才政策</span>
            <span className="gov-chip"><Tag className="w-3.5 h-3.5" />税收减免</span>
          </div>

          <div className="space-y-3">
            {[
              { name: '2024年度稳岗返还补贴', amount: '最高30万元', match: 98, tag: '人社局', hot: true },
              { name: '企业技术改造专项补贴', amount: '设备投资额10%', match: 95, tag: '工信局' },
              { name: '研发费用加计扣除政策', amount: '100%加计扣除', match: 92, tag: '税务局' },
              { name: '高层次人才引进补贴', amount: '每人30-100万', match: 88, tag: '人才局' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-100 hover:border-gov-200 hover:bg-gov-50/40 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 group-hover:text-gov-700 transition-colors">{item.name}</p>
                      {item.hot && <span className="gov-badge bg-red-50 text-red-600 border-red-100 !text-[10px]">HOT</span>}
                    </div>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-sm">
                    <span className="text-[9px] opacity-80">匹配</span>
                    <span className="text-sm font-bold leading-none">{item.match}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-amber-600">{item.amount}</span>
                  <span className="gov-badge bg-gov-50 text-gov-700 border border-gov-100 !text-[10px]">{item.tag}</span>
                  <span className="text-xs text-gray-400 ml-auto group-hover:text-gov-600 transition-colors flex items-center gap-1">
                    立即申报<ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="gov-card p-6 md:p-8">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-gov-600" />
          办事涉及委办局
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: '市场监督管理局', count: 215, icon: Landmark },
            { name: '税务局', count: 95, icon: Receipt },
            { name: '人社局', count: 186, icon: Users },
            { name: '公安局', count: 215, icon: Shield },
            { name: '工信局', count: 78, icon: Briefcase },
            { name: '财政局', count: 62, icon: Bank },
          ].map(bureau => {
            const Icon = bureau.icon;
            return (
              <div key={bureau.name} className="p-4 rounded-2xl border border-gray-100 hover:border-gov-200 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-11 h-11 rounded-xl bg-gov-50 group-hover:bg-gov-100 flex items-center justify-center text-gov-600 mb-3 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-800 leading-tight mb-1">{bureau.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />{bureau.count}项服务
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
