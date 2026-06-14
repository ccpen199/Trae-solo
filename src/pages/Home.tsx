import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, Shield, UserCog, Scale, Sparkles, MapPin, Users,
  Clock, ChevronLeft, ChevronRight, ChevronDown, FileText, Award, Building,
  Banknote, GraduationCap, Gavel, CreditCard, BarChart3, TrendingUp, PieChart as PieIcon,
  CheckCircle2, XCircle, AlertTriangle, FileCheck, Eye, Calendar, Phone,
  Landmark, Building2, Network, Calculator, Download, Handshake, ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/api/client';

const policies = [
  { id: 1, title: '关于进一步做好稳就业工作的实施意见', tag: '就业扶持', date: '2026-06-01' },
  { id: 2, title: '2026年度失业保险稳岗返还政策解读', tag: '稳岗返还', date: '2026-05-28' },
  { id: 3, title: '加强新时代高技能人才队伍建设的意见', tag: '技能培训', date: '2026-05-25' },
  { id: 4, title: '创业担保贷款贴息政策最新通知', tag: '创业扶持', date: '2026-05-20' },
];

const businessDomains = [
  { icon: Briefcase, title: '就业服务', desc: '岗位推荐、失业登记、就业援助', color: 'from-blue-500 to-cyan-500', to: '/employment/unemployment-register' },
  { icon: Shield, title: '社保服务', desc: '参保登记、社保查询、待遇领取', color: 'from-gov-500 to-gov-700', to: '/social-insurance/payment-query' },
  { icon: UserCog, title: '人事人才', desc: '职称评审、人才引进、档案服务', color: 'from-purple-500 to-indigo-500', to: '/personnel/title-review' },
  { icon: Scale, title: '劳动关系', desc: '劳动合同、仲裁申请、监察投诉', color: 'from-orange-500 to-red-500', to: '/labor-relations/arbitration' },
];

const staticMatchedPolicies = [
  { id: 1, name: '失业保险稳岗返还', category: '稳岗返还', amount: 125600, matchScore: 95, deadline: '2026-12-31' },
  { id: 2, name: '企业吸纳就业社保补贴', category: '社保补贴', amount: 48000, matchScore: 88, deadline: '2026-10-31' },
  { id: 3, name: '创业担保贷款贴息', category: '创业扶持', amount: 300000, matchScore: 82, deadline: '2026-11-30' },
  { id: 4, name: '职业技能提升补贴', category: '技能培训', amount: 15000, matchScore: 76, deadline: '2026-09-30' },
];

const hotServices = [
  { icon: FileText, title: '失业登记', color: 'bg-gov-50 text-gov-600' },
  { icon: CreditCard, title: '参保证明', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Banknote, title: '稳岗返还', color: 'bg-gold-50 text-gold-600' },
  { icon: Award, title: '创业贷款', color: 'bg-purple-50 text-purple-600' },
  { icon: GraduationCap, title: '技能报名', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Gavel, title: '仲裁申请', color: 'bg-orange-50 text-orange-600' },
  { icon: Search, title: '社保查询', color: 'bg-blue-50 text-blue-600' },
  { icon: Users, title: '职称评审', color: 'bg-pink-50 text-pink-600' },
  { icon: Building, title: '档案查询', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Shield, title: '社保卡挂失', color: 'bg-red-50 text-red-600' },
];

const myOngoingServices = [
  {
    id: 1, domain: '就业服务', title: '失业登记', status: '待签章', statusType: 'warning', progress: 3, totalSteps: 5,
    lastAction: '已提交电子签章申请', lastTime: '2小时前', to: '/employment/unemployment-register',
    records: [
      { time: '2026-06-11 10:30', action: '提交基本信息', operator: '张三（本人）', result: '通过' },
      { time: '2026-06-11 10:32', action: '填写失业情况', operator: '张三（本人）', result: '通过' },
      { time: '2026-06-11 10:35', action: '选择就业意向', operator: '张三（本人）', result: '通过' },
      { time: '2026-06-11 10:38', action: '电子签章签署', operator: '系统', result: '待签章' },
      { time: '—', action: '提交完成', operator: '—', result: '待办' },
    ],
  },
  {
    id: 2, domain: '社保服务', title: '参保证明', status: '已存证', statusType: 'success', progress: 2, totalSteps: 3,
    lastAction: '区块链存证完成，可下载', lastTime: '1天前', to: '/social-insurance/payment-query',
    records: [
      { time: '2026-06-10 14:20', action: '生成参保证明', operator: '社保系统', result: '成功' },
      { time: '2026-06-10 14:21', action: '区块链存证', operator: '链上存证服务', result: '已上链，哈希 0x3f8a…b2c1' },
      { time: '2026-06-10 14:22', action: '下载证明文件', operator: '—', result: '可下载' },
    ],
  },
  {
    id: 3, domain: '人事人才', title: '技能等级认定报名', status: '核验中', statusType: 'info', progress: 2, totalSteps: 4,
    lastAction: '成绩核验中，请稍候', lastTime: '3小时前', to: '/personnel/skill-cert',
    records: [
      { time: '2026-06-11 08:00', action: '提交报名信息', operator: '张三（本人）', result: '通过' },
      { time: '2026-06-11 09:15', action: '考试成绩核验', operator: '省鉴定中心', result: '核验中' },
      { time: '—', action: '资格审核', operator: '人社局', result: '待办' },
      { time: '—', action: '发放证书', operator: '—', result: '待办' },
    ],
  },
  {
    id: 4, domain: '劳动关系', title: '劳动仲裁申请', status: '待补材料', statusType: 'danger', progress: 1, totalSteps: 4,
    lastAction: '材料不完整，请补充', lastTime: '昨天', to: '/labor-relations/arbitration',
    records: [
      { time: '2026-06-09 11:00', action: '提交仲裁申请', operator: '张三（本人）', result: '材料不全' },
      { time: '2026-06-09 11:05', action: '补正通知', operator: '仲裁委', result: '需补充：劳动合同复印件、工资流水' },
      { time: '—', action: '立案审查', operator: '仲裁委', result: '待补正' },
      { time: '—', action: '开庭审理', operator: '—', result: '待办' },
    ],
  },
];

const outlets = [
  { id: 1, name: '市民中心人社服务大厅', address: '人民中路101号市民中心1-2层', queue: 15, distance: '1.2km', updatedAt: '3分钟前', vrAvailable: true, appointmentAvailable: true },
  { id: 2, name: '高新区政务服务中心', address: '科技大道88号政务中心3楼', queue: 8, distance: '3.5km', updatedAt: '2分钟前', vrAvailable: true, appointmentAvailable: true },
  { id: 3, name: '东区街道便民服务中心', address: '解放东路256号', queue: 3, distance: '0.8km', updatedAt: '5分钟前', vrAvailable: false, appointmentAvailable: true },
  { id: 4, name: '经开区综合服务中心', address: '开发大道999号', queue: 12, distance: '5.2km', updatedAt: '4分钟前', vrAvailable: true, appointmentAvailable: true },
  { id: 5, name: '西湖区政务服务站', address: '湖滨南路66号', queue: 6, distance: '2.1km', updatedAt: '6分钟前', vrAvailable: false, appointmentAvailable: false },
];

const visitRecords = [
  { id: 1, outlet: '市民中心人社服务大厅', business: '失业登记', date: '2026-05-28 14:30', status: '已完成' },
  { id: 2, outlet: '高新区政务服务中心', business: '社保查询', date: '2026-05-15 09:15', status: '已完成' },
];

const domainStats = [
  { name: '就业服务', online: 12500, offline: 3200, total: 15700, satisfaction: 97.8, overtime: 86, returnRate: 2.3, certDownloads: 4500, policyCash: 12800 },
  { name: '社保服务', online: 18600, offline: 5100, total: 23700, satisfaction: 98.5, overtime: 52, returnRate: 1.1, certDownloads: 18200, policyCash: 35600 },
  { name: '人事人才', online: 8200, offline: 2300, total: 10500, satisfaction: 96.2, overtime: 120, returnRate: 3.5, certDownloads: 2800, policyCash: 8900 },
  { name: '劳动关系', online: 4500, offline: 1800, total: 6300, satisfaction: 94.7, overtime: 210, returnRate: 5.8, certDownloads: 1200, policyCash: 3200 },
];

const matchSourceData = [
  { name: '医保核验', count: 18600, fill: '#10B981' },
  { name: '税务核验', count: 15200, fill: '#E6A23C' },
  { name: '市监管核验', count: 21300, fill: '#165DFF' },
  { name: '社保数据', count: 25600, fill: '#8B5CF6' },
  { name: '公积金数据', count: 9800, fill: '#F97316' },
];

const monthlyData = [
  { month: '1月', 办件量: 42000, 匹配数: 3200 },
  { month: '2月', 办件量: 38000, 匹配数: 2800 },
  { month: '3月', 办件量: 55000, 匹配数: 4100 },
  { month: '4月', 办件量: 52000, 匹配数: 3800 },
  { month: '5月', 办件量: 68000, 匹配数: 5200 },
  { month: '6月', 办件量: 75000, 匹配数: 6100 },
];

const categoryData = [
  { name: '就业服务', value: 35, color: '#165DFF' },
  { name: '社保服务', value: 28, color: '#10B981' },
  { name: '人事人才', value: 20, color: '#E6A23C' },
  { name: '劳动关系', value: 17, color: '#8B5CF6' },
];

const dailyData = [
  { day: '周一', 线上: 8500, 线下: 3200 },
  { day: '周二', 线上: 9200, 线下: 3800 },
  { day: '周三', 线上: 11000, 线下: 4500 },
  { day: '周四', 线上: 9800, 线下: 3600 },
  { day: '周五', 线上: 12500, 线下: 5100 },
  { day: '周六', 线上: 6500, 线下: 2800 },
  { day: '周日', 线上: 4200, 线下: 1500 },
];

const AnimatedSection = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <div
    className={cn('opacity-0 translate-y-5 animate-fade-in-up', className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [matchedPolicies, setMatchedPolicies] = useState(staticMatchedPolicies);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    const keyword = searchText.trim();
    navigate(keyword ? `/policy-match?keyword=${encodeURIComponent(keyword)}` : '/policy-match');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % policies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await api.get('/policy-match/match');
        if (data && Array.isArray(data)) {
          setMatchedPolicies(data);
        }
      } catch {
        setMatchedPolicies(staticMatchedPolicies);
      }
    };
    fetchPolicies();
  }, []);

  const categoryColors: Record<string, string> = {
    '稳岗返还': 'bg-gold-100 text-gold-700',
    '社保补贴': 'bg-emerald-100 text-emerald-700',
    '创业扶持': 'bg-purple-100 text-purple-700',
    '技能培训': 'bg-cyan-100 text-cyan-700',
    '就业扶持': 'bg-gov-100 text-gov-700',
  };

  return (
    <div className="space-y-8">
        <AnimatedSection delay={0}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gov-600 via-gov-500 to-gov-700 p-8 md:p-12 shadow-gov-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400"></div>
            <div className="absolute top-20 right-10 w-40 h-40 border border-gold-400/20 rounded-full"></div>
            <div className="absolute bottom-10 left-20 w-60 h-60 border border-gold-400/10 rounded-full"></div>
            <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-gold-400/5 rounded-full"></div>

            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/20 text-gold-200 text-sm font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                全省一体化政务服务平台
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                XX省人力资源和社会保障一体化政务服务平台
              </h1>
              <p className="text-lg md:text-xl text-gov-100 mb-8 tracking-widest">
                安全 · 便捷 · 智能
              </p>

              <div className="relative max-w-2xl mx-auto mb-10">
                <div className="absolute inset-0 bg-gold-400/30 rounded-2xl blur-xl -z-10"></div>
                <div className="flex items-center bg-white rounded-2xl p-2 shadow-2xl">
                  <Search className="w-6 h-6 text-gray-400 ml-4" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    placeholder="请输入您要办理的服务名称或政策关键词"
                    className="flex-1 px-4 py-3 text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-8 py-3 bg-gradient-to-r from-gov-500 to-gov-700 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    搜索服务
                  </button>
                </div>
              </div>

              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold-400" />
                    政策速递
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + policies.length) % policies.length)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % policies.length)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {policies.map((policy) => (
                      <div key={policy.id} className="w-full flex-shrink-0">
                        <div className="bg-white rounded-xl p-5 text-left cursor-pointer hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gov-700 mb-2 hover:text-gov-600 transition-colors">
                                {policy.title}
                              </h4>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="px-2.5 py-0.5 rounded-full bg-gov-50 text-gov-600 font-medium text-xs">
                                  {policy.tag}
                                </span>
                                <span className="text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {policy.date}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {policies.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        idx === currentSlide ? 'w-8 bg-gold-400' : 'w-2 bg-white/40 hover:bg-white/60'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {businessDomains.map((domain, idx) => {
              const Icon = domain.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(domain.to)}
                  className="group relative bg-white rounded-xl p-6 cursor-pointer border border-gray-100 hover:border-gov-300 transition-all duration-300 hover:-translate-y-2 hover:shadow-gov-lg overflow-hidden"
                >
                  <div className={cn('absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500', domain.color)}></div>
                  <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300', domain.color)}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-gov-600 transition-colors">
                    {domain.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{domain.desc}</p>
                  <div className="flex items-center text-sm text-gov-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    进入服务
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="relative bg-white rounded-2xl border-2 border-gold-300 overflow-hidden shadow-gov">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400"></div>
            <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-gold-400 rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-gold-400 rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-gold-400 rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-gold-400 rounded-br-lg"></div>

            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">免申即享 · 精准匹配</h2>
                    <p className="text-sm text-gray-500">基于大数据智能匹配，政策主动找人</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/policy-match')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  查看全部匹配
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedPolicies.slice(0, 4).map((policy: any) => {
                  const isWsg = policy.category === '稳岗返还' || policy.name?.includes('稳岗');
                  const claimStatus = isWsg ? 'ready' : 'none';
                  return (
                    <div
                      key={policy.id}
                      className="relative p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gold-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate('/policy-match')}
                    >
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gov-50 text-gov-600 text-xs font-medium">
                        匹配度 {policy.matchScore || policy.match_score || 85}%
                      </div>
                      <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-3',
                        categoryColors[policy.category] || 'bg-gray-100 text-gray-700'
                      )}>
                        {policy.category}
                      </span>
                      <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-gov-600 transition-colors">
                        {policy.name}
                      </h4>
                      <div className="flex items-end justify-between mt-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">预估金额</p>
                          <p className="text-xl font-bold text-gold-600">
                            ¥{(policy.amount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">截止日期</p>
                          <p className="text-sm text-gray-600 font-medium">{policy.deadline}</p>
                        </div>
                      </div>

                      {isWsg && (
                        <div className="space-y-2.5 pt-3 border-t border-gold-100">
                          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Network className="w-3.5 h-3.5 text-gov-500" />
                            省三网核验依据
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: '医保', icon: <Shield className="w-3 h-3" />, pass: true },
                              { label: '税务', icon: <Landmark className="w-3 h-3" />, pass: true },
                              { label: '市监', icon: <Building2 className="w-3 h-3" />, pass: true },
                            ].map((item) => (
                              <div key={item.label} className={cn(
                                'flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium border',
                                item.pass
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              )}>
                                {item.icon}
                                {item.pass ? '通过' : '未过'}
                              </div>
                            ))}
                          </div>

                          <div className={cn(
                            'flex items-center justify-between p-2 rounded-lg',
                            claimStatus === 'ready' ? 'bg-gold-50 border border-gold-200' : 'bg-gray-50 border border-gray-200'
                          )}>
                            <div className="flex items-center gap-1.5">
                              {claimStatus === 'ready' ? (
                                <Handshake className="w-3.5 h-3.5 text-gold-600" />
                              ) : (
                                <FileCheck className="w-3.5 h-3.5 text-gray-500" />
                              )}
                              <span className="text-xs font-medium text-gray-700">
                                {claimStatus === 'ready' ? '待申领 · 免申即享' : '查看详情'}
                              </span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-gold-500 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={280}>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">我的办理 · 继续办理</h2>
                  <p className="text-sm text-gray-500">四大域业务状态追踪，一键直达未完办事项</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  <span className="text-gov-600 font-bold">{myOngoingServices.length}</span> 项进行中
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOngoingServices.map((svc) => {
                const statusColors: Record<string, string> = {
                  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  warning: 'bg-gold-50 text-gold-700 border-gold-200',
                  info: 'bg-gov-50 text-gov-700 border-gov-200',
                  danger: 'bg-red-50 text-red-700 border-red-200',
                };
                const progressPercent = Math.round((svc.progress / svc.totalSteps) * 100);
                const isExpanded = expandedServiceId === svc.id;
                return (
                  <div
                    key={svc.id}
                    className="relative rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gov-300 hover:shadow-gov transition-all duration-300"
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedServiceId(isExpanded ? null : svc.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium text-gray-400">{svc.domain}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          statusColors[svc.statusType]
                        )}>
                          {svc.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">{svc.title}</h4>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>办理进度</span>
                          <span className="font-medium text-gov-600">{svc.progress}/{svc.totalSteps} 步</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gov-400 to-gov-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{svc.lastAction}</span>
                        <span className="text-gov-600 font-medium flex items-center gap-1">
                          {isExpanded ? '收起记录' : '查看经办记录'}
                          <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                        </span>
                      </div>
                    </div>

                    {isExpanded && svc.records && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">经办记录</p>
                        <div className="space-y-0">
                          {svc.records.map((rec, ri) => {
                            const isDone = rec.result === '通过' || rec.result === '成功' || rec.result === '可下载' || rec.result === '已上链，哈希 0x3f8a…b2c1';
                            const isPending = rec.result === '待签章' || rec.result === '待办' || rec.result === '核验中' || rec.result === '待补正';
                            const isIssue = rec.result === '材料不全' || rec.result.startsWith('需补充');
                            return (
                              <div key={ri} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                    isDone ? 'bg-emerald-100 text-emerald-600' :
                                    isPending ? 'bg-gold-100 text-gold-600' :
                                    isIssue ? 'bg-red-100 text-red-600' :
                                    'bg-gray-100 text-gray-500'
                                  )}>
                                    {isDone ? <CheckCircle2 className="w-3 h-3" /> :
                                     isPending ? <Clock className="w-3 h-3" /> :
                                     <AlertTriangle className="w-3 h-3" />}
                                  </div>
                                  {ri < svc.records.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1"></div>}
                                </div>
                                <div className="pb-4 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-medium text-gray-800">{rec.action}</span>
                                    <span className={cn(
                                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                                      isDone ? 'bg-emerald-50 text-emerald-700' :
                                      isPending ? 'bg-gold-50 text-gold-700' :
                                      isIssue ? 'bg-red-50 text-red-700' :
                                      'bg-gray-50 text-gray-600'
                                    )}>
                                      {rec.result}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                    <span>{rec.time}</span>
                                    <span>经办：{rec.operator}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(svc.to); }}
                          className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-gov-500 to-gov-700 text-white text-sm font-medium hover:shadow-gov transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5"
                        >
                          继续办理 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">热门服务 Top 10</h2>
                <p className="text-sm text-gray-500">高频业务一站式直达</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {hotServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div
                    key={idx}
                    className="group relative flex flex-col items-center p-5 rounded-xl cursor-pointer hover:shadow-gov transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gov-200"
                  >
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {idx + 1}
                    </div>
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300', service.color)}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gov-600 transition-colors">
                      {service.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gov-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gov-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">服务网点地图</h2>
                  <p className="text-sm text-gray-500">就近办理 · 查看排队状态</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              <div className="lg:col-span-2 border-r border-gray-100">
                <div className="divide-y divide-gray-100">
                  {outlets.map((outlet, idx) => (
                    <div
                      key={outlet.id}
                      onClick={() => navigate('/service-outlets')}
                      className={cn(
                        'p-5 cursor-pointer hover:bg-gov-50/50 transition-colors',
                        idx === 0 && 'bg-gov-50/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          idx === 0 ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-500'
                        )}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800 truncate">{outlet.name}</h4>
                            {outlet.vrAvailable && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gov-100 text-gov-700 text-[10px] font-medium flex items-center gap-0.5">
                                <Eye className="w-3 h-3" /> VR
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-3 truncate">{outlet.address}</p>
                          <div className="flex items-center gap-3 text-xs flex-wrap">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                              <Users className="w-3 h-3" />
                              排队 {outlet.queue}人
                            </span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              {outlet.updatedAt}更新
                            </span>
                            <span className="text-gray-400">{outlet.distance}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 relative min-h-[420px] bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 overflow-hidden" ref={mapRef}>
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#93C5FD" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gov-500/10 animate-pulse-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gov-500/5"></div>

                {outlets.map((outlet, idx) => {
                  const positions = [
                    { top: '35%', left: '45%' },
                    { top: '25%', left: '70%' },
                    { top: '55%', left: '30%' },
                    { top: '65%', left: '75%' },
                    { top: '20%', left: '25%' },
                  ];
                  return (
                    <div
                      key={outlet.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={positions[idx]}
                    >
                      <div className="relative">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-125',
                          idx === 0 ? 'bg-gov-500' : 'bg-white'
                        )}>
                          <MapPin className={cn('w-5 h-5', idx === 0 ? 'text-white' : 'text-gov-500')} />
                        </div>
                        {outlet.vrAvailable && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">
                            V
                          </div>
                        )}
                        {idx === 0 && (
                          <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full border-2 border-gov-500 animate-ping opacity-50"></div>
                        )}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap bg-white rounded-lg shadow-lg px-3 py-2 text-xs z-10 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="font-semibold text-gray-800 mb-1">{outlet.name}</p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3 text-orange-500" />
                            排队 {outlet.queue} 人 · {outlet.updatedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
                  <div
                    onClick={() => navigate('/outlets-vr')}
                    className="px-4 py-3 bg-white/95 backdrop-blur rounded-xl shadow-lg text-sm font-medium text-gov-700 hover:bg-white transition-colors cursor-pointer border border-gov-100 flex items-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">VR 实景导航</p>
                      <p className="text-xs text-gray-500">360°全景漫游 · 提前熟悉</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                  </div>

                  <div className="px-4 py-3 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-500 mb-1.5">排队数据更新</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      实时 · 2 分钟前
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-md border border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-2">图例</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-gov-500"></span>
                        当前选择
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-white border border-gray-300"></span>
                        其他网点
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">V</span>
                        VR 可用
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        排队中
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/outlets-vr')}
                    className="px-5 py-3 bg-gradient-to-r from-gov-500 to-gov-700 text-white rounded-xl shadow-gov hover:shadow-gov-lg transition-all hover:scale-[1.03] text-sm font-semibold flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    预约办理
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">平台数据统计</h2>
                  <p className="text-sm text-gray-500">多维分析 · 可复查口径 · 实时数据</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gov-600">330K+</p>
                  <p className="text-xs text-gray-500">累计办件</p>
                </div>
                <div className="text-center px-4 border-x border-gray-100">
                  <p className="text-2xl font-bold text-emerald-600">25.2K+</p>
                  <p className="text-xs text-gray-500">政策匹配</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gold-600">98.5%</p>
                  <p className="text-xs text-gray-500">满意度</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gov-600" />
                  <h4 className="font-semibold text-gray-700">月度办件量趋势</h4>
                  <span className="ml-auto text-[11px] text-gray-400">口径：全渠道线上线下合计</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="办件量" stroke="#165DFF" strokeWidth={3} dot={{ r: 4, fill: '#165DFF' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="匹配数" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <PieIcon className="w-4 h-4 text-gold-600" />
                  <h4 className="font-semibold text-gray-700">四大域业务分布</h4>
                  <span className="ml-auto text-[11px] text-gray-400">口径：按业务域分类占比</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, '占比']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-semibold text-gray-700">四大域线上线下对比</h4>
                  <span className="ml-auto text-[11px] text-gray-400">本月数据 · 可复查</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                      <Bar dataKey="线上" fill="#165DFF" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="线下" fill="#E6A23C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Network className="w-4 h-4 text-gov-600" />
                  <h4 className="font-semibold text-gray-700">免申即享 · 测算来源分布</h4>
                  <span className="ml-auto text-[11px] text-gray-400">三网核验 · 可复查口径</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={matchSourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={11} width={70} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(22, 93, 255, 0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(value: number) => [`${value.toLocaleString()} 条`, '核验数据量']}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                        {matchSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-gray-700">本周线上线下办件对比</h4>
                <span className="ml-auto text-[11px] text-gray-400">口径：自然周累计</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Legend />
                    <Bar dataKey="线上" fill="#165DFF" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="线下" fill="#E6A23C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-4 h-4 text-gov-600" />
                <h4 className="font-semibold text-gray-700">分域业务质量与政策兑现报表</h4>
                <span className="ml-auto text-[11px] text-gray-400">口径：本月累计 · 可复查</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">业务域</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">办理量</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">超时件</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">材料退回率</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">存证下载</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">政策兑现金额</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">满意度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainStats.map((d) => (
                      <tr key={d.name} className="border-b border-gray-100 hover:bg-white/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{d.name}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{d.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn('font-medium', d.overtime > 100 ? 'text-red-600' : d.overtime > 50 ? 'text-gold-600' : 'text-emerald-600')}>
                            {d.overtime}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">件</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn('font-medium', d.returnRate > 4 ? 'text-red-600' : d.returnRate > 2 ? 'text-gold-600' : 'text-emerald-600')}>
                            {d.returnRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">{d.certDownloads.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gov-600 font-medium">¥{(d.policyCash / 10000).toFixed(1)}万</td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn('font-medium', d.satisfaction >= 98 ? 'text-emerald-600' : d.satisfaction >= 96 ? 'text-gold-600' : 'text-red-600')}>
                            {d.satisfaction}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/50 font-semibold">
                      <td className="py-3 px-4 text-gray-800">合计</td>
                      <td className="py-3 px-4 text-right text-gray-800">{domainStats.reduce((s, d) => s + d.total, 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-800">{domainStats.reduce((s, d) => s + d.overtime, 0)}<span className="text-xs text-gray-400 ml-1">件</span></td>
                      <td className="py-3 px-4 text-right text-gray-800">{(domainStats.reduce((s, d) => s + d.returnRate * d.total, 0) / domainStats.reduce((s, d) => s + d.total, 0)).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-gray-800">{domainStats.reduce((s, d) => s + d.certDownloads, 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gov-600">¥{(domainStats.reduce((s, d) => s + d.policyCash, 0) / 10000).toFixed(1)}万</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{(domainStats.reduce((s, d) => s + d.satisfaction, 0) / domainStats.length).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AnimatedSection>
    </div>
  );
}
