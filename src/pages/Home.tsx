import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  ChevronRight, Sparkles, TrendingUp, Clock, FileCheck,
  Briefcase, Home, Heart, GraduationCap, Car, Landmark,
  Shield, Zap, Users, Building2, MapPin, Bus, Stethoscope,
  Ticket, CreditCard, ArrowRight, BarChart3, Search
} from 'lucide-react';
import { governmentServices, policies, serviceBureauStats } from '../data/mock';
import type { GovernmentService } from '../types';

const iconMap: Record<string, any> = {
  Baby: LucideIcons.Baby,
  Users: Users,
  Home: Home,
  Heart: Heart,
  Landmark: Landmark,
  Car: Car,
  GraduationCap: GraduationCap,
  FileCheck: FileCheck,
  Building2: Building2,
  FileX: LucideIcons.FileX,
  Gift: LucideIcons.Gift,
  HardHat: LucideIcons.HardHat,
  Receipt: LucideIcons.Receipt,
  Utensils: LucideIcons.Utensils,
  Bus: Bus,
  Stethoscope: Stethoscope,
  Ticket: Ticket,
  CreditCard: CreditCard,
};

const quickServiceIcons = [
  { icon: Home, label: '公积金', color: 'bg-blue-50 text-blue-600' },
  { icon: Heart, label: '医保社保', color: 'bg-rose-50 text-rose-600' },
  { icon: GraduationCap, label: '教育服务', color: 'bg-purple-50 text-purple-600' },
  { icon: Car, label: '交管出行', color: 'bg-amber-50 text-amber-600' },
  { icon: FileCheck, label: '户籍证件', color: 'bg-teal-50 text-teal-600' },
  { icon: Landmark, label: '不动产', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Briefcase, label: '就业创业', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Building2, label: '企业服务', color: 'bg-orange-50 text-orange-600' },
  { icon: Bus, label: '交通出行', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Stethoscope, label: '预约挂号', color: 'bg-pink-50 text-pink-600' },
  { icon: Ticket, label: '文体预约', color: 'bg-violet-50 text-violet-600' },
  { icon: Shield, label: '更多服务', color: 'bg-slate-50 text-slate-600' },
];

const authMethods = [
  { name: '闽政通', desc: '福建省统一身份认证', color: 'from-blue-500 to-blue-700' },
  { name: '微信', desc: '微信授权快捷登录', color: 'from-green-500 to-emerald-600' },
  { name: '支付宝', desc: '实名认证账号登录', color: 'from-sky-500 to-blue-600' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'enterprise' | 'life'>('all');

  const filteredServices: GovernmentService[] = activeTab === 'all'
    ? governmentServices
    : governmentServices.filter(s => s.category === activeTab);

  const oneStopServices = governmentServices.filter(s => s.isOneStop);

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-gov-800 via-gov-700 to-gov-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-400 rounded-full blur-3xl" />
          <div className="absolute top-20 right-40 w-64 h-64 bg-indigo-300 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
                <Sparkles className="w-4 h-4" />
                接入30+委办局系统 · 1500+政务服务
              </span>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                厦门市民<span className="text-yellow-300">一站式</span><br />
                数字服务中枢
              </h2>
              <p className="text-lg text-white/80 leading-relaxed max-w-xl">
                作为市级政务与民生服务统一入口，通过统一身份认证、数据授权网关与服务编排引擎，
                为528万厦门市民和市场主体提供全生命周期、全场景覆盖的"一网通办"数字政务体验。
              </p>

              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="输入服务名称，如'新生儿五证联办'、'公积金提取'…"
                  className="w-full pl-14 pr-32 py-4 rounded-2xl text-gray-800 text-base shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300/30"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-xl bg-gov-700 text-white font-medium hover:bg-gov-800 transition-colors">
                  搜索服务
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">1,586</span>
                    <span className="text-white/60">项服务</span>
                  </div>
                  <p className="text-sm text-white/60">一网通办</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">98.6%</span>
                    <span className="text-white/60">满意度</span>
                  </div>
                  <p className="text-sm text-white/60">群众评价</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">32</span>
                    <span className="text-white/60">委办局</span>
                  </div>
                  <p className="text-sm text-white/60">已接入系统</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold">统一身份认证登录</h3>
                  <p className="text-sm text-white/70 mt-1">OAuth 2.0 安全桥接 · 一次认证全网通行</p>
                </div>
                <div className="space-y-3">
                  {authMethods.map(method => (
                    <button
                      key={method.name}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 hover:border-white/30 transition-all duration-200 group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                        {method.name[0]}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">{method.name}账号登录</p>
                        <p className="text-sm text-white/60">{method.desc}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/15 flex items-center justify-between text-sm">
                  <a className="text-white/70 hover:text-white flex items-center gap-1" href="#">
                    <FileCheck className="w-4 h-4" />实名认证说明
                  </a>
                  <a className="text-white/70 hover:text-white flex items-center gap-1" href="#">
                    <Zap className="w-4 h-4" />新用户注册
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gov-600" />
            高频便民服务
            <span className="ml-auto text-sm font-normal text-gray-400">12个常用场景一键直达</span>
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-4">
            {quickServiceIcons.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to="/personal"
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-200"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-gov-700">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title mb-2">
              <Sparkles className="w-6 h-6 text-gov-600" />
              "一件事"集成服务
            </h2>
            <p className="text-gray-500">将分散在多个部门的事项，通过服务编排引擎封装为"一件事"，群众只需一次提交</p>
          </div>
          <Link to="/personal" className="text-sm text-gov-600 hover:text-gov-800 flex items-center gap-1 font-medium">
            查看全部<ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {oneStopServices.map(service => {
            const Icon = iconMap[service.icon] || FileCheck;
            return (
              <div key={service.id} className="gov-card p-6 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gov-700 transition-colors">{service.name}</h3>
                      <span className="gov-badge bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 border border-orange-200">
                        一件事
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2">{service.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />{service.bureau}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{service.processingTime}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {service.tags.map(t => (
                        <span key={t} className="gov-chip !px-2.5 !py-0.5 !text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">
            <BarChart3 className="w-6 h-6 text-gov-600" />
            全部政务服务
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {([
            { k: 'all', l: '全部服务', c: 'gray' },
            { k: 'personal', l: '个人办事', c: 'blue' },
            { k: 'enterprise', l: '企业办事', c: 'emerald' },
            { k: 'life', l: '便民服务', c: 'purple' },
          ] as const).map(tab => (
            <button
              key={tab.k}
              onClick={() => setActiveTab(tab.k)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.k
                  ? 'bg-gov-600 text-white shadow-md shadow-gov-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.l}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map(service => {
            const Icon = iconMap[service.icon] || FileCheck;
            return (
              <div key={service.id} className="gov-card p-5 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gov-50 flex items-center justify-center text-gov-600 shrink-0 group-hover:bg-gov-100 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-gov-700 transition-colors text-sm">{service.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{service.processingTime}
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <TrendingUp className="w-3 h-3" />{service.visitCount.toLocaleString()}次
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 gov-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">
                <FileCheck className="w-6 h-6 text-gov-600" />
                政策智能匹配推送
              </h2>
              <Link to="/personal" className="text-sm text-gov-600 hover:text-gov-800 flex items-center gap-1 font-medium">
                全部政策<ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {policies.slice(0, 4).map(policy => (
                <Link key={policy.id} to="/personal" className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                  <div className="shrink-0 relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex flex-col items-center justify-center text-white shadow-md">
                      <span className="text-xs opacity-80">匹配度</span>
                      <span className="text-lg font-bold leading-none">{policy.matchingScore}%</span>
                    </div>
                    {policy.matchingScore >= 95 && (
                      <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold shadow">HOT</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gov-700 transition-colors line-clamp-1">{policy.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{policy.summary}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="gov-badge bg-gov-50 text-gov-700 border border-gov-100">{policy.category}</span>
                      <span>{policy.issuer}</span>
                      <span>{policy.publishDate}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="gov-card p-6 md:p-8">
            <h2 className="section-title mb-6">
              <MapPin className="w-6 h-6 text-gov-600" />
              委办局接入情况
            </h2>
            <div className="space-y-4">
              {serviceBureauStats.slice(0, 6).map((s, idx) => (
                <div key={s.bureau}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{s.bureau}</span>
                    <span className="text-gray-400 text-xs">{s.visits.toLocaleString()}次访问</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gov-400 to-gov-600 rounded-full transition-all duration-700"
                      style={{ width: `${(s.visits / 150000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-gov-50">
                  <p className="text-xl font-bold text-gov-700">32</p>
                  <p className="text-xs text-gray-500 mt-0.5">委办局</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <p className="text-xl font-bold text-emerald-700">86%</p>
                  <p className="text-xs text-gray-500 mt-0.5">网办率</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <p className="text-xl font-bold text-amber-700">1.2天</p>
                  <p className="text-xs text-gray-500 mt-0.5">平均办结</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-gov-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-80 h-80 bg-cyan-400 rounded-full blur-3xl" />
          </div>
          <div className="relative grid md:grid-cols-4 gap-8 items-center">
            <div className="md:col-span-2">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">等保三级 · 数据安全保障</h3>
              <p className="text-white/70 leading-relaxed mb-6">
                系统通过国家网络安全等级保护三级认证，所有政务数据不出市云，
                采用数据授权网关实现场景化最小化数据获取，全链路加密传输与存储。
              </p>
              <div className="flex flex-wrap gap-3">
                {['数据脱敏', '访问审计', '加密存储', '国密算法', '安全网关', '容灾备份'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {[
                { icon: Shield, label: '等保三级认证', val: '✓ 通过' },
                { icon: Lock, label: '政务数据', val: '不出市云' },
                { icon: FileCheck, label: '数据授权', val: '场景最小化' },
                { icon: Server, label: '容灾备份', val: '3地5中心' },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <item.icon className="w-7 h-7 mb-3 text-yellow-300" />
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-white/70 mt-1">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
