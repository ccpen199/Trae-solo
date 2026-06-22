import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid3x3,
  ChevronRight,
  Search,
  Star,
  FileCheck2,
  Car,
  Stethoscope,
  GraduationCap,
  Home as HomeIcon,
  Users,
  Receipt,
  Wallet,
  Trees,
  ClipboardList,
  Building2,
  Bus,
  Train,
  Plane,
  Droplets,
  Zap,
  Wifi,
  Phone as PhoneIcon,
  Mail,
  BookOpen,
  Utensils,
  Dumbbell,
  Palette,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Briefcase,
  Baby,
  Flower2,
  type LucideIcon,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: string;
  hot?: boolean;
  new?: boolean;
  desc?: string;
}

const categories = [
  { key: 'all', label: '全部服务', icon: Grid3x3 },
  { key: 'gov', label: '政务服务', icon: FileCheck2 },
  { key: 'life', label: '生活服务', icon: HomeIcon },
  { key: 'health', label: '医疗健康', icon: Stethoscope },
  { key: 'edu', label: '教育培训', icon: GraduationCap },
  { key: 'traffic', label: '交通出行', icon: Car },
  { key: 'social', label: '社会保障', icon: Users },
];

const servicesData: Service[] = [
  { id: 'idcard', title: '身份证办理', icon: FileCheck2, color: 'text-gov-600', bgColor: 'bg-gov-100', category: 'gov', hot: true, desc: '首次申领、换领、补领' },
  { id: 'passport', title: '护照办理', icon: FileCheck2, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'gov', desc: '普通护照首次申请' },
  { id: 'household', title: '户籍迁移', icon: HomeIcon, color: 'text-purple-600', bgColor: 'bg-purple-100', category: 'gov', desc: '市内迁移、市外迁入' },
  { id: 'license', title: '营业执照', icon: Building2, color: 'text-amber-600', bgColor: 'bg-amber-100', category: 'gov', new: true, desc: '个体工商户注册登记' },
  { id: 'socialsec', title: '社保查询', icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100', category: 'social', hot: true, desc: '缴费明细、账户余额' },
  { id: 'pension', title: '养老金认证', icon: Flower2, color: 'text-rose-600', bgColor: 'bg-rose-100', category: 'social', desc: '领取资格人脸识别认证' },
  { id: 'medicare', title: '医保服务', icon: HeartHandshake, color: 'text-red-600', bgColor: 'bg-red-100', category: 'social', hot: true, desc: '异地就医备案、报销' },
  { id: 'housingfund', title: '公积金', icon: HomeIcon, color: 'text-orange-600', bgColor: 'bg-orange-100', category: 'social', desc: '提取、贷款查询' },
  { id: 'register', title: '预约挂号', icon: Stethoscope, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: 'health', hot: true, desc: '各大医院在线预约' },
  { id: 'vaccine', title: '疫苗接种', icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-100', category: 'health', new: true, desc: '疫苗预约与接种记录' },
  { id: 'healthfile', title: '健康档案', icon: Stethoscope, color: 'text-cyan-600', bgColor: 'bg-cyan-100', category: 'health', desc: '个人健康信息查询' },
  { id: 'hospital', title: '医院导航', icon: MapPin as LucideIcon, color: 'text-red-500', bgColor: 'bg-red-50', category: 'health', desc: '附近医疗机构查询' },
  { id: 'schoolquery', title: '学区查询', icon: GraduationCap, color: 'text-indigo-600', bgColor: 'bg-indigo-100', category: 'edu', desc: '对口学校一键查询' },
  { id: 'schoolenroll', title: '入学报名', icon: BookOpen, color: 'text-violet-600', bgColor: 'bg-violet-100', category: 'edu', new: true, desc: '中小学在线报名' },
  { id: 'bus', title: '公交查询', icon: Bus, color: 'text-blue-500', bgColor: 'bg-blue-100', category: 'traffic', hot: true, desc: '实时到站、线路查询' },
  { id: 'subway', title: '地铁出行', icon: Train, color: 'text-green-500', bgColor: 'bg-green-100', category: 'traffic', desc: '线路图、换乘查询' },
  { id: 'parking', title: '智慧停车', icon: Car, color: 'text-warm-600', bgColor: 'bg-warm-100', category: 'traffic', desc: '附近车位实时查询' },
  { id: 'trafficfine', title: '违章查询', icon: Car, color: 'text-yellow-600', bgColor: 'bg-yellow-100', category: 'traffic', desc: '机动车违法记录' },
  { id: 'flight', title: '航班信息', icon: Plane, color: 'text-sky-600', bgColor: 'bg-sky-100', category: 'traffic', desc: '航班动态、机场大巴' },
  { id: 'waterpay', title: '水费缴纳', icon: Droplets, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'life', desc: '在线缴费、账单查询' },
  { id: 'elecpay', title: '电费缴纳', icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100', category: 'life', hot: true, desc: '在线缴费、账单查询' },
  { id: 'gaspay', title: '燃气缴纳', icon: Flame as LucideIcon, color: 'text-orange-500', bgColor: 'bg-orange-100', category: 'life', desc: '在线缴费、账单查询' },
  { id: 'netpay', title: '宽带缴费', icon: Wifi, color: 'text-purple-500', bgColor: 'bg-purple-100', category: 'life', desc: '宽带、固话充值' },
  { id: 'phonepay', title: '话费充值', icon: PhoneIcon, color: 'text-green-500', bgColor: 'bg-green-100', category: 'life', desc: '手机话费在线充值' },
  { id: 'taxpay', title: '税务服务', icon: Receipt, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: 'gov', desc: '个税申报、发票服务' },
  { id: 'legal', title: '法律援助', icon: Scale, color: 'text-gold-600', bgColor: 'bg-amber-50', category: 'gov', desc: '免费法律咨询服务' },
  { id: 'job', title: '就业服务', icon: Briefcase, color: 'text-blue-700', bgColor: 'bg-blue-50', category: 'social', new: true, desc: '招聘信息、技能培训' },
  { id: 'baby', title: '生育服务', icon: Baby, color: 'text-pink-500', bgColor: 'bg-pink-100', category: 'social', desc: '生育登记、补贴申领' },
  { id: 'elderly', title: '为老服务', icon: Users, color: 'text-warm-700', bgColor: 'bg-warm-100', category: 'social', desc: '适老化改造、助餐服务' },
  { id: 'canteen', title: '便民食堂', icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-100', category: 'life', desc: '社区食堂、老年助餐' },
  { id: 'gym', title: '健身场馆', icon: Dumbbell, color: 'text-rose-500', bgColor: 'bg-rose-100', category: 'life', desc: '公共运动场馆查询' },
  { id: 'culture', title: '文化场馆', icon: Palette, color: 'text-purple-500', bgColor: 'bg-purple-100', category: 'life', desc: '图书馆、博物馆、美术馆' },
  { id: 'mail', title: '邮政服务', icon: Mail, color: 'text-green-600', bgColor: 'bg-green-100', category: 'life', desc: '网点查询、快递寄件' },
  { id: 'wallet', title: '便民缴费', icon: Wallet, color: 'text-warm-600', bgColor: 'bg-warm-100', category: 'life', desc: '综合缴费服务' },
  { id: 'env', title: '环保举报', icon: Trees, color: 'text-green-600', bgColor: 'bg-green-100', category: 'life', desc: '环境污染问题举报' },
  { id: 'report', title: '投诉建议', icon: ClipboardList, color: 'text-orange-600', bgColor: 'bg-orange-100', category: 'gov', hot: true, desc: '政务服务投诉与建议' },
  { id: 'more', title: '更多服务', icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100', category: 'life', desc: '敬请期待' },
];

const hotServices = servicesData.filter((s) => s.hot).slice(0, 6);

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [keyword, setKeyword] = useState('');

  const filtered = servicesData.filter((s) => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (keyword && !s.title.includes(keyword) && !s.desc?.includes(keyword)) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">服务大厅</span>
      </nav>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <Grid3x3 className="w-8 h-8 text-gov-600" />
          服务大厅
        </h1>
        <p className="section-subtitle">政务服务、生活服务一应俱全，足不出户即可办理</p>
      </div>

      <div className="card p-6 mb-8 bg-gradient-to-r from-gov-500 to-gov-700 text-white border-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg md:text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-warm-300" fill="currentColor" />
            热门服务
          </h2>
          <span className="text-sm text-white/70">最受欢迎的便民服务</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {hotServices.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Icon className={cn('w-6 h-6', s.color)} />
                </div>
                <span className="text-sm font-medium">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索服务名称，如社保、挂号、违章..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all text-base"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="card p-3 h-fit lg:sticky lg:top-24">
          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left',
                    active ? 'bg-gov-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filtered.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className="card p-4 md:p-5 text-left hover:-translate-y-1 animate-fade-in-up group relative overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {(s.hot || s.new) && (
                    <span
                      className={cn(
                        'absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded text-white',
                        s.hot ? 'bg-red-500' : 'bg-green-500',
                      )}
                    >
                      {s.hot ? 'HOT' : 'NEW'}
                    </span>
                  )}
                  <div
                    className={cn(
                      'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm',
                      s.bgColor,
                    )}
                  >
                    <Icon className={cn('w-6 h-6 md:w-7 md:h-7', s.color)} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base group-hover:text-gov-600 transition-colors">
                    {s.title}
                  </h3>
                  {s.desc && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.desc}</p>}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="card p-20 text-center">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">未找到相关服务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
