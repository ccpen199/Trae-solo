import { useState } from 'react';
import { Building2, Package, Receipt, Clock, Zap, ArrowRight, TrendingUp, CheckCircle2, Plus, Minus, Calendar, MapPin, Users, BadgeCheck, FileCheck, ChevronRight, Shield, CreditCard, FileText, Search, Filter, Download, Eye, Phone, Mail, UserCheck, AlertCircle, CheckCircle, XCircle, Star, Sparkles, Baby, ChefHat, CircleDollarSign, Timer, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnterpriseNavbar from '@/components/EnterpriseNavbar';
import PackageCard from '@/components/PackageCard';
import { useEnterpriseStore } from '@/store/useEnterpriseStore';
import type { ServicePackage, ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const packageIconMap: Record<string, typeof Sparkles> = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

export default function EnterpriseDashboard() {
  const enterprise = useEnterpriseStore((state) => state.enterprise);
  const servicePackages = useEnterpriseStore((state) => state.servicePackages);
  const batchOrders = useEnterpriseStore((state) => state.batchOrders);
  const bills = useEnterpriseStore((state) => state.bills);
  const createBatchOrder = useEnterpriseStore((state) => state.createBatchOrder);
  const payBill = useEnterpriseStore((state) => state.payBill);

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(302);
  const [purchaseCount, setPurchaseCount] = useState(5);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | 'all'>('all');
  const [billFilter, setBillFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  const enterpriseBatchOrders = enterprise
    ? batchOrders.filter((b) => b.enterprise_id === enterprise.id)
    : [];
  const enterpriseBills = enterprise
    ? bills.filter((b) => b.enterprise_id === enterprise.id)
    : [];

  const activeOrders = enterpriseBatchOrders.filter((b) => b.status === 'active');
  const unpaidBills = enterpriseBills.filter((b) => b.status === 'unpaid');
  const paidBills = enterpriseBills.filter((b) => b.status === 'paid');
  const filteredBills = billFilter === 'all' ? enterpriseBills : billFilter === 'unpaid' ? unpaidBills : paidBills;

  const totalRemaining = activeOrders.reduce(
    (sum, o) => sum + (o.total_count - o.used_count),
    0
  );
  const totalUsed = enterpriseBatchOrders.reduce((sum, o) => sum + o.used_count, 0);
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaidAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);

  const selectedPackage = servicePackages.find(p => p.id === selectedPackageId);
  const packageTotal = selectedPackage ? selectedPackage.price * purchaseCount : 0;
  const packageSavings = selectedPackage ? (selectedPackage.original_price - selectedPackage.price) * purchaseCount : 0;

  const filteredPackages = selectedServiceType === 'all' 
    ? servicePackages 
    : servicePackages.filter(p => p.service_types.includes(selectedServiceType));

  const handlePurchase = (pkg: ServicePackage) => {
    if (enterprise) {
      createBatchOrder(enterprise.id, pkg.id, 10);
    }
  };

  const handleConfirmPurchase = () => {
    if (!enterprise || !selectedPackageId) return;
    setPurchasing(true);
    setTimeout(() => {
      createBatchOrder(enterprise.id, selectedPackageId, purchaseCount * 10);
      setPurchasing(false);
      setShowPurchaseModal(false);
    }, 1500);
  };

  const handlePayBill = (billId: number) => {
    payBill(billId);
  };

  const reviewRecords = [
    { id: 1, date: '2024-06-15', type: '日常保洁', address: '总部A座12层', worker: '王秀兰', qualityScore: 98, reviewer: '行政-李娜', status: 'pass', remark: '清洁质量优秀，工位整理规范' },
    { id: 2, date: '2024-06-14', type: '日常保洁', address: '总部B座8层', worker: '张淑珍', qualityScore: 95, reviewer: '行政-王强', status: 'pass', remark: '会议室桌面整洁，玻璃清洁透亮' },
    { id: 3, date: '2024-06-13', type: '上门烹饪', address: '员工餐厅', worker: '刘春梅', qualityScore: 92, reviewer: 'HR-赵敏', status: 'pass', remark: '菜品口味良好，分量充足' },
    { id: 4, date: '2024-06-12', type: '日常保洁', address: '总部A座5层', worker: '李桂芳', qualityScore: 78, reviewer: '行政-李娜', status: 'fail', remark: '茶水台有积水，垃圾桶未更换' },
    { id: 5, date: '2024-06-11', type: '深度保洁', address: '总部A座20层', worker: '张淑珍', qualityScore: 96, reviewer: '行政-王强', status: 'pass', remark: '深度保洁达标，空调滤网清洁彻底' },
  ];

  const quickEntries = [
    {
      icon: Package,
      label: '服务包订单',
      desc: '查看已采购服务包',
      path: '/enterprise/orders',
      color: 'from-primary-400 to-primary-600',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
    },
    {
      icon: Receipt,
      label: '账单管理',
      desc: `待支付 ¥${totalUnpaidAmount.toLocaleString()}`,
      path: '/enterprise/billing',
      color: 'from-secondary-400 to-secondary-600',
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-500',
    },
    {
      icon: Zap,
      label: '快速下单',
      desc: '使用服务包余额',
      path: '/enterprise/orders',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      icon: TrendingUp,
      label: '使用统计',
      desc: '查看消耗明细',
      path: '/enterprise/orders',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <EnterpriseNavbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-fade-up">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-card">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                    您好，{enterprise?.name || '企业客户'}
                  </h1>
                  <p className="text-secondary-500 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      企业认证已通过
                    </span>
                    <span className="mx-1">·</span>
                    <span>联系人：{enterprise?.contact}</span>
                    <span className="mx-1">·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {enterprise?.phone}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowPurchaseModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-medium hover:shadow-lg hover:shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                批量采购服务包
              </button>
              <Link 
                to="/enterprise/billing"
                className="px-5 py-2.5 bg-white text-secondary-700 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                统一结算
              </Link>
            </div>

            {unpaidBills.length > 0 && (
              <div className="card p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white animate-fade-up stagger-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">您有 {unpaidBills.length} 笔待支付账单</p>
                    <p className="text-2xl font-bold">¥{totalUnpaidAmount.toLocaleString()}</p>
                  </div>
                  <Link
                    to="/enterprise/billing"
                    className="px-4 py-2 bg-white text-primary-600 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    去支付
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              {
                label: '有效服务包',
                value: activeOrders.length,
                suffix: '个',
                icon: Package,
                color: 'from-primary-500 to-primary-600',
              },
              {
                label: '剩余服务次数',
                value: totalRemaining,
                suffix: '次',
                icon: Clock,
                color: 'from-secondary-500 to-secondary-600',
              },
              {
                label: '累计使用',
                value: totalUsed,
                suffix: '次',
                icon: CheckCircle2,
                color: 'from-emerald-500 to-teal-500',
              },
              {
                label: '待支付金额',
                value: totalUnpaidAmount,
                suffix: '元',
                icon: Receipt,
                color: 'from-amber-500 to-orange-500',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn('card p-5 animate-fade-up', `stagger-${index + 1}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-secondary-800">
                    {stat.value.toLocaleString()}
                    <span className="text-sm font-normal text-secondary-500 ml-1">{stat.suffix}</span>
                  </p>
                  <p className="text-sm text-secondary-500 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">快速入口</h2>
            <p className="text-secondary-500 text-sm mt-1">常用功能一键直达</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickEntries.map((entry, index) => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.label}
                to={entry.path}
                className={cn('card-hover p-5 block animate-fade-up', `stagger-${index + 1}`)}
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br', entry.color, 'shadow-soft')}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-secondary-800 mb-1 flex items-center gap-1">
                  {entry.label}
                  <ChevronRight className="w-4 h-4 text-secondary-400" />
                </h3>
                <p className="text-sm text-secondary-500">{entry.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {activeOrders.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-green-500" />
                我的服务包
              </h2>
              <p className="text-secondary-500 text-sm mt-1">正在生效中的服务包明细</p>
            </div>
            <Link
              to="/enterprise/orders"
              className="text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1 text-sm"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.slice(0, 6).map((order, index) => {
              const percent = Math.round((order.used_count / order.total_count) * 100);
              const remaining = order.total_count - order.used_count;
              const daysLeft = Math.ceil((new Date(order.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={order.id} className={cn('card p-5 animate-fade-up border-2 border-primary-50', `stagger-${(index % 3) + 1}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-secondary-800">{order.package_name}</h3>
                      <p className="text-xs text-secondary-400 mt-0.5">订单号 #{order.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="badge-green text-xs">使用中</span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', daysLeft < 30 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                        剩余{daysLeft}天
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-secondary-500 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />使用进度
                      </span>
                      <span className="font-bold text-secondary-700">
                        {order.used_count}/{order.total_count} 次
                      </span>
                    </div>
                    <div className="h-2.5 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', percent > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-primary-400 to-primary-600')}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-green-500 text-[10px] mb-0.5">剩余次数</p>
                      <p className="font-bold text-green-700">{remaining}次</p>
                    </div>
                    <div className="p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="text-orange-500 text-[10px] mb-0.5">有效期至</p>
                      <p className="font-bold text-orange-700">{new Date(order.expire_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-secondary-500">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      采购金额: <span className="font-bold text-secondary-700">¥{order.total_amount.toLocaleString()}</span>
                    </div>
                    <button className="text-primary-600 text-xs font-bold hover:text-primary-700 flex items-center gap-0.5">
                      立即使用 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" />
              服务包采购中心
            </h2>
            <p className="text-secondary-500 text-sm mt-1">为您的企业选择合适的服务方案</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary-400" />
            <div className="flex gap-1">
              {[{v:'all',l:'全部'},{v:'cleaning',l:'保洁'},{v:'babysitting',l:'育婴'},{v:'cooking',l:'餐饮'}].map((t) => (
                <button 
                  key={t.v}
                  onClick={() => setSelectedServiceType(t.v as any)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    selectedServiceType === t.v 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
                  )}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg, index) => {
            const Icon = packageIconMap[pkg.service_types[0]] || Sparkles;
            const isSelected = selectedPackageId === pkg.id;
            return (
              <div 
                key={pkg.id} 
                className={cn(
                  'animate-fade-up cursor-pointer transition-all',
                  isSelected && 'scale-[1.02]'
                )}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                <div className={cn(
                  'card-hover p-0 overflow-hidden h-full',
                  isSelected ? 'ring-2 ring-primary-500 border-primary-300' : ''
                )}>
                  <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', index === 1 ? 'from-orange-400 to-orange-600' : 'from-primary-400 to-primary-600')}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {index === 1 && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">热门推荐</span>
                      )}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-secondary-800 mb-1">{pkg.name}</h3>
                    <p className="text-xs text-secondary-500">{pkg.description}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary-600">¥{pkg.price.toLocaleString()}</span>
                      <span className="text-sm text-secondary-400 line-through mb-1">¥{pkg.original_price.toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded ml-auto">
                        省¥{pkg.original_price - pkg.price}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {pkg.features.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-secondary-600">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xs text-secondary-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        有效期{pkg.valid_days}天
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePurchase(pkg); }}
                        className="px-4 py-1.5 bg-primary-500 text-white rounded-full text-xs font-bold hover:bg-primary-600 transition-colors"
                      >
                        立即采购
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  统一结算面板
                </h2>
                <p className="text-secondary-500 text-sm mt-1">企业账单汇总与统一支付</p>
              </div>
              <div className="flex gap-1">
                {[{v:'all',l:'全部'},{v:'unpaid',l:'待支付'},{v:'paid',l:'已支付'}].map((t) => (
                  <button 
                    key={t.v}
                    onClick={() => setBillFilter(t.v as any)}
                    className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
                      billFilter === t.v 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
                    )}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 text-center">
                <p className="text-[10px] text-red-600 mb-0.5">待支付</p>
                <p className="text-xl font-bold text-red-700">¥{totalUnpaidAmount.toLocaleString()}</p>
                <p className="text-[9px] text-red-500 mt-0.5">{unpaidBills.length}笔</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100 text-center">
                <p className="text-[10px] text-green-600 mb-0.5">已支付</p>
                <p className="text-xl font-bold text-green-700">¥{totalPaidAmount.toLocaleString()}</p>
                <p className="text-[9px] text-green-500 mt-0.5">{paidBills.length}笔</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 text-center">
                <p className="text-[10px] text-blue-600 mb-0.5">累计</p>
                <p className="text-xl font-bold text-blue-700">¥{(totalUnpaidAmount + totalPaidAmount).toLocaleString()}</p>
                <p className="text-[9px] text-blue-500 mt-0.5">{enterpriseBills.length}笔</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bill.status === 'unpaid' ? 'bg-orange-100' : 'bg-green-100')}>
                        <Receipt className={cn('w-4 h-4', bill.status === 'unpaid' ? 'text-orange-600' : 'text-green-600')} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary-800">{bill.period}账单</p>
                        <p className="text-[10px] text-secondary-400">#{bill.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary-800">¥{bill.amount.toLocaleString()}</p>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        bill.status === 'unpaid' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      )}>
                        {bill.status === 'unpaid' ? '待支付' : '已支付'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-2">
                    {bill.items.map((item, ii) => (
                      <div key={ii} className="flex items-center justify-between text-[10px]">
                        <span className="text-secondary-500">{item.description}</span>
                        <span className="text-secondary-700 font-medium">¥{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-3 text-[10px] text-secondary-400">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        出账: {new Date(bill.issued_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Timer className="w-3 h-3" />
                        到期: {new Date(bill.due_date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                    {bill.status === 'unpaid' ? (
                      <button 
                        onClick={() => handlePayBill(bill.id)}
                        className="px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-bold hover:bg-orange-600 transition-colors flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" />立即支付
                      </button>
                    ) : (
                      <button className="px-3 py-1 bg-gray-100 text-secondary-600 rounded-full text-[10px] font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />查看发票
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-500" />
                  服务复查留痕
                </h2>
                <p className="text-secondary-500 text-sm mt-1">服务质量抽检与复查记录</p>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-secondary-400" />
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-secondary-600 rounded-lg text-[10px] font-medium hover:bg-gray-200 transition-colors">
                  <Download className="w-3 h-3" />导出
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 text-center border border-green-100">
                <p className="text-lg font-bold text-green-700">{reviewRecords.filter(r => r.status === 'pass').length}</p>
                <p className="text-[9px] text-green-600">合格</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 text-center border border-red-100">
                <p className="text-lg font-bold text-red-700">{reviewRecords.filter(r => r.status === 'fail').length}</p>
                <p className="text-[9px] text-red-600">不合格</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 text-center border border-blue-100">
                <p className="text-lg font-bold text-blue-700">{Math.round(reviewRecords.reduce((s,r)=>s+r.qualityScore,0)/reviewRecords.length)}</p>
                <p className="text-[9px] text-blue-600">平均分</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 text-center border border-amber-100">
                <p className="text-lg font-bold text-amber-700">{Math.round(reviewRecords.filter(r => r.status === 'pass').length / reviewRecords.length * 100)}%</p>
                <p className="text-[9px] text-amber-600">合格率</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {reviewRecords.map((record) => (
                <div key={record.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', 
                        record.status === 'pass' 
                          ? 'bg-gradient-to-br from-green-400 to-green-500' 
                          : 'bg-gradient-to-br from-red-400 to-red-500'
                      )}>
                        {record.status === 'pass' 
                          ? <CheckCircle className="w-4 h-4 text-white" />
                          : <XCircle className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-secondary-800">{record.type}</p>
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', 
                            record.status === 'pass' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          )}>
                            {record.status === 'pass' ? '复查通过' : '需要整改'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-secondary-400 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />{record.date}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{record.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-0.5 mb-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn('w-3 h-3', 
                              s <= Math.ceil(record.qualityScore / 20) 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-200'
                            )} 
                          />
                        ))}
                      </div>
                      <p className={cn('text-lg font-bold leading-none', 
                        record.qualityScore >= 90 ? 'text-green-600' 
                          : record.qualityScore >= 80 ? 'text-amber-600' 
                          : 'text-red-600'
                      )}>
                        {record.qualityScore}
                        <span className="text-[9px] font-normal text-secondary-400">分</span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 text-primary-500 flex-shrink-0" />
                      <span className="text-secondary-500">服务阿姨:</span>
                      <span className="text-secondary-700 font-medium">{record.worker}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck className="w-3 h-3 text-teal-500 flex-shrink-0" />
                      <span className="text-secondary-500">复查人:</span>
                      <span className="text-secondary-700 font-medium">{record.reviewer}</span>
                    </div>
                  </div>
                  {record.remark && (
                    <div className={cn('p-2 rounded-lg text-[10px]', 
                      record.status === 'pass' 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    )}>
                      {record.status === 'fail' && <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />}
                      {record.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                批量采购确认
              </h3>
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100 mb-5">
              <p className="text-sm font-bold text-secondary-800 mb-1">{selectedPackage.name}</p>
              <p className="text-xs text-secondary-500 mb-3">{selectedPackage.description}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-secondary-400">单价</p>
                  <p className="text-xl font-bold text-primary-600">¥{selectedPackage.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-secondary-400">原价</p>
                  <p className="text-sm text-secondary-400 line-through">¥{selectedPackage.original_price.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-medium text-secondary-700 mb-2 block flex items-center justify-between">
                <span>采购份数（每份含10次服务）</span>
                <span className="text-primary-600 font-bold">{purchaseCount}份 = {purchaseCount * 10}次</span>
              </label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPurchaseCount(Math.max(1, purchaseCount - 1))}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-secondary-600 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center py-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 text-xl font-bold text-orange-700">
                  {purchaseCount}
                </div>
                <button 
                  onClick={() => setPurchaseCount(Math.min(50, purchaseCount + 1))}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-secondary-600 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[1,5,10,20].map((n) => (
                  <button 
                    key={n}
                    onClick={() => setPurchaseCount(n)}
                    className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                      purchaseCount === n 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
                    )}
                  >
                    {n}份
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-500">商品小计</span>
                <span className="text-secondary-700 font-medium">¥{(selectedPackage.price * purchaseCount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-500 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-500" />企业优惠
                </span>
                <span className="text-green-600 font-bold">-¥{packageSavings.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-gray-200">
                <span className="text-secondary-700 font-bold">应付金额</span>
                <span className="text-2xl font-bold text-primary-600">¥{packageTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-secondary-700 font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:shadow-lg hover:shadow-primary-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    采购中...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    确认采购
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-secondary-800 text-white py-10 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold">暖心到家 · 企业版</p>
                <p className="text-secondary-300 text-sm">让企业后勤更省心</p>
              </div>
            </div>
            <div className="text-secondary-300 text-sm text-center md:text-right">
              <p className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <Phone className="w-3.5 h-3.5" />
                企业专属客服：400-888-8888
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5" />
                enterprise@nuanxin.com
              </p>
              <p className="mt-1 text-secondary-400">服务时间：工作日 09:00 - 18:00</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-secondary-700 text-center text-secondary-400 text-sm">
            © 2026 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
