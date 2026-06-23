import { useState } from 'react';
import {
  User, Shield, Clock, FileCheck, Bell, ChevronRight, QrCode, Download,
  Eye, CreditCard, FileText, AlertTriangle, CheckCircle2, AlertCircle,
  XCircle, Plus, Search, Tag, Sparkles, Building2, Mail, Phone,
  MapPin, Calendar, BadgeCheck
} from 'lucide-react';
import { credentials, serviceProgress, policies } from '../data/mock';

const credentialTypeMap: Record<string, { icon: any; color: string; label: string }> = {
  id_card: { icon: CreditCard, color: 'from-blue-500 to-blue-700', label: '身份证' },
  social_security: { icon: Shield, color: 'from-emerald-500 to-teal-700', label: '社保' },
  driver_license: { icon: FileCheck, color: 'from-amber-500 to-orange-700', label: '驾驶证' },
  household: { icon: Building2, color: 'from-purple-500 to-indigo-700', label: '不动产' },
  marriage: { icon: FileText, color: 'from-rose-500 to-pink-700', label: '婚姻证' },
  business_license: { icon: BadgeCheck, color: 'from-cyan-500 to-sky-700', label: '营业执照' },
};

const statusMap: Record<string, { text: string; color: string; icon: any; bg: string }> = {
  submitted: { text: '已提交', color: 'text-slate-700', icon: FileText, bg: 'bg-slate-100 border-slate-200' },
  reviewing: { text: '审核中', color: 'text-amber-700', icon: Clock, bg: 'bg-amber-50 border-amber-200' },
  approved: { text: '已审批', color: 'text-blue-700', icon: Eye, bg: 'bg-blue-50 border-blue-200' },
  rejected: { text: '已驳回', color: 'text-red-700', icon: XCircle, bg: 'bg-red-50 border-red-200' },
  completed: { text: '已完成', color: 'text-emerald-700', icon: CheckCircle2, bg: 'bg-emerald-50 border-emerald-200' },
};

const stepStatusMap = {
  completed: 'bg-emerald-500 text-white',
  current: 'bg-gov-600 text-white',
  pending: 'bg-gray-200 text-gray-400',
};

export default function PersonalSpace() {
  const [activeCredential, setActiveCredential] = useState<string | null>(credentials[0].id);
  const [progressTab, setProgressTab] = useState<'all' | 'processing' | 'completed'>('all');

  const filteredProgress = progressTab === 'all'
    ? serviceProgress
    : serviceProgress.filter(p => {
        if (progressTab === 'processing') return ['submitted', 'reviewing', 'approved'].includes(p.status);
        if (progressTab === 'completed') return ['completed', 'rejected'].includes(p.status);
        return true;
      });

  const selectedCredential = credentials.find(c => c.id === activeCredential);

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="bg-gradient-to-br from-gov-700 via-gov-600 to-blue-500 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden mb-8 shadow-xl">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-4xl font-bold shadow-lg">
                陈
              </div>
              <BadgeCheck className="absolute -bottom-1 -right-1 w-8 h-8 text-yellow-300 drop-shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">陈先生</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/50 text-emerald-100 text-xs font-medium flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />已实名
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-300/50 text-blue-100 text-xs font-medium">
                  闽政通L3认证
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-white/80 text-sm flex-wrap">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />chen***@163.com</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />138****6789</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />厦门市思明区</span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto grid grid-cols-3 gap-3 md:gap-6 w-full md:w-auto">
            <div className="p-3 md:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <p className="text-2xl md:text-3xl font-bold">{credentials.length}</p>
              <p className="text-xs md:text-sm text-white/70 mt-1">电子证照</p>
            </div>
            <div className="p-3 md:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <p className="text-2xl md:text-3xl font-bold">{serviceProgress.length}</p>
              <p className="text-xs md:text-sm text-white/70 mt-1">办件中</p>
            </div>
            <div className="p-3 md:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <p className="text-2xl md:text-3xl font-bold">{policies.length}</p>
              <p className="text-xs md:text-sm text-white/70 mt-1">匹配政策</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section id="credentials">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">
                <Shield className="w-6 h-6 text-gov-600" />
                个人电子证照库
                <span className="ml-2 text-sm font-normal text-gray-400">对接市电子证照共享平台</span>
              </h2>
              <button className="gov-btn-secondary !py-2 !px-4 text-sm">
                <Plus className="w-4 h-4" />添加证照
              </button>
            </div>

            <div className="grid lg:grid-cols-5 gap-5">
              <div className="lg:col-span-2 space-y-3">
                {credentials.map(cred => {
                  const typeCfg = credentialTypeMap[cred.type] || credentialTypeMap.id_card;
                  const Icon = typeCfg.icon;
                  const isActive = activeCredential === cred.id;
                  const statusColor = cred.status === 'valid'
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                    : cred.status === 'expiring'
                    ? 'text-amber-600 bg-amber-50 border-amber-100'
                    : 'text-red-600 bg-red-50 border-red-100';
                  return (
                    <button
                      key={cred.id}
                      onClick={() => setActiveCredential(cred.id)}
                      className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border-2 ${
                        isActive
                          ? 'bg-gov-50 border-gov-300 shadow-md'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeCfg.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">{cred.name}</p>
                            <span className={`gov-badge ${statusColor} shrink-0`}>
                              {cred.status === 'valid' ? '有效' : cred.status === 'expiring' ? '即将到期' : '已过期'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate font-mono">{cred.number}</p>
                        </div>
                        <ChevronRight className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-gov-600' : 'text-gray-300'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-3">
                {selectedCredential && (() => {
                  const typeCfg = credentialTypeMap[selectedCredential.type] || credentialTypeMap.id_card;
                  const Icon = typeCfg.icon;
                  return (
                    <div className={`rounded-3xl bg-gradient-to-br ${typeCfg.color} p-0.5 shadow-xl h-full`}>
                      <div className="rounded-[22px] bg-white h-full p-6 md:p-7">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${typeCfg.color} flex items-center justify-center text-white shadow-lg`}>
                              <Icon className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{selectedCredential.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">证件编号</p>
                              <p className="font-mono text-gray-800 mt-0.5">{selectedCredential.number}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2.5 rounded-xl bg-gov-50 text-gov-700 hover:bg-gov-100 transition-colors" title="亮证">
                              <QrCode className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors" title="下载">
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-xs text-gray-500 mb-1">签发机关</p>
                            <p className="font-medium text-gray-900">{selectedCredential.issuer}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-xs text-gray-500 mb-1">签发日期</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />{selectedCredential.issueDate}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-xs text-gray-500 mb-1">有效期至</p>
                            <p className={`font-medium flex items-center gap-1.5 ${selectedCredential.status === 'expiring' ? 'text-amber-700' : 'text-gray-900'}`}>
                              <Calendar className={`w-4 h-4 ${selectedCredential.status === 'expiring' ? 'text-amber-500' : 'text-gray-400'}`} />
                              {selectedCredential.expiryDate}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-xs text-gray-500 mb-1">证照状态</p>
                            {selectedCredential.status === 'valid' && (
                              <p className="font-medium text-emerald-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />有效
                              </p>
                            )}
                            {selectedCredential.status === 'expiring' && (
                              <p className="font-medium text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />即将到期，请及时换证
                              </p>
                            )}
                            {selectedCredential.status === 'expired' && (
                              <p className="font-medium text-red-700 flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-red-500" />已过期
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center bg-gray-50/50">
                          <div className="w-40 h-40 bg-white rounded-xl shadow-inner flex items-center justify-center border border-gray-100">
                            <div className="text-center">
                              <QrCode className="w-20 h-20 text-gray-700 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">扫码亮证</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-3 text-center">使用闽政通/本平台扫一扫功能出示证照核验<br />电子证照与实体证照具有同等法律效力</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          <section id="progress">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">
                <Clock className="w-6 h-6 text-gov-600" />
                我的办事进度
              </h2>
              <div className="flex gap-2">
                {(['all', 'processing', 'completed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setProgressTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      progressTab === tab
                        ? 'bg-gov-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'all' ? '全部' : tab === 'processing' ? '办理中' : '已完成'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredProgress.map(item => {
                const status = statusMap[item.status];
                const StatusIcon = status.icon;
                return (
                  <div key={item.id} className="gov-card p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${status.bg} border flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`w-6 h-6 ${status.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{item.serviceName}</h3>
                            <span className={`gov-badge ${status.bg} border ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />{status.text}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <span>申请编号：<span className="font-mono text-gray-700">{item.applicationNo}</span></span>
                            <span>受理部门：<span className="text-gray-700">{item.bureau}</span></span>
                            <span>提交时间：<span className="text-gray-700">{item.submittedAt}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">预计办结</p>
                          <p className="font-semibold text-gray-900 text-sm">{item.estimatedDate}</p>
                        </div>
                        <button className="gov-btn-secondary !py-2 !px-4 text-sm">
                          详情<ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="grid grid-cols-5 gap-2">
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="relative">
                            {idx < item.steps.length - 1 && (
                              <div
                                className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                  idx < item.currentStep - 1
                                    ? 'bg-emerald-400'
                                    : idx === item.currentStep - 1
                                    ? 'bg-gradient-to-r from-emerald-400 to-gray-200'
                                    : 'bg-gray-200'
                                }`}
                              />
                            )}
                            <div className="relative flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-4 z-10 ${
                                  stepStatusMap[step.status]
                                } ${step.status === 'current' ? 'ring-4 ring-gov-100 animate-pulse-slow' : ''} bg-white`}
                                style={{
                                  background: step.status === 'pending' ? undefined : undefined,
                                  backgroundColor: step.status === 'completed' ? '#10b981' : step.status === 'current' ? '#1a4fb0' : '#e5e7eb',
                                  color: step.status === 'pending' ? '#9ca3af' : '#fff',
                                  borderColor: '#fff'
                                }}
                              >
                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                              </div>
                              <p className={`mt-2 text-xs text-center font-medium ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
                                {step.name}
                              </p>
                              {step.time && (
                                <p className="text-[10px] text-gray-400 mt-0.5 text-center">{step.time.split(' ')[0]}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">
                <Sparkles className="w-6 h-6 text-gov-600" />
                政策智能匹配
                <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  AI 匹配
                </span>
              </h2>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索政策关键词…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-gov-300 focus:outline-none focus:ring-2 focus:ring-gov-100 text-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap mb-5">
              <span className="gov-chip"><Tag className="w-3.5 h-3.5" />就业创业</span>
              <span className="gov-chip"><Tag className="w-3.5 h-3.5" />住房保障</span>
              <span className="gov-chip"><Tag className="w-3.5 h-3.5" />社会保障</span>
              <span className="gov-chip"><Tag className="w-3.5 h-3.5" />惠企政策</span>
            </div>

            <div className="space-y-3">
              {policies.map(policy => (
                <div key={policy.id} className="gov-card p-4 cursor-pointer group hover:border-gov-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-gov-700 transition-colors line-clamp-2 text-sm leading-snug">
                      {policy.title}
                    </h3>
                    <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex flex-col items-center justify-center text-white shadow-sm">
                      <span className="text-[10px] opacity-80">匹配</span>
                      <span className="text-base font-bold leading-none">{policy.matchingScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{policy.summary}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="gov-badge bg-gov-50 text-gov-700 border border-gov-100 !text-[10px]">{policy.category}</span>
                      <span>{policy.issuer}</span>
                    </div>
                    <span className="flex items-center gap-1"><Bell className="w-3 h-3" />{policy.publishDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 gov-btn-secondary">查看全部政策</button>
          </section>

          <section className="gov-card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              提醒事项
            </h3>
            <div className="space-y-3">
              {[
                { type: '证照到期', text: '您的驾驶证将于 2024-06-19 到期', level: 'high', action: '立即换证' },
                { type: '办事提醒', text: '"新生儿五证联办"正在卫健委审核中', level: 'info', action: '查看进度' },
                { type: '政策推送', text: '您可能符合《高校毕业生就业补贴》条件', level: 'success', action: '立即申报' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    item.level === 'high' ? 'bg-red-500 animate-pulse-slow' :
                    item.level === 'success' ? 'bg-emerald-500' : 'bg-gov-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="gov-badge bg-white border-gray-200 text-gray-600 !text-[10px]">{item.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.text}</p>
                    <p className="text-xs text-gov-600 mt-1.5 font-medium hover:underline">{item.action} →</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
