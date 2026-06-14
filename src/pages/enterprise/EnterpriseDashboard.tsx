import { Building2, Package, Receipt, Clock, Zap, ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnterpriseNavbar from '@/components/EnterpriseNavbar';
import PackageCard from '@/components/PackageCard';
import { useEnterpriseStore } from '@/store/useEnterpriseStore';
import type { ServicePackage } from '@/types';
import { cn } from '@/lib/utils';

export default function EnterpriseDashboard() {
  const enterprise = useEnterpriseStore((state) => state.enterprise);
  const servicePackages = useEnterpriseStore((state) => state.servicePackages);
  const batchOrders = useEnterpriseStore((state) => state.batchOrders);
  const bills = useEnterpriseStore((state) => state.bills);
  const createBatchOrder = useEnterpriseStore((state) => state.createBatchOrder);

  const enterpriseBatchOrders = enterprise
    ? batchOrders.filter((b) => b.enterprise_id === enterprise.id)
    : [];
  const enterpriseBills = enterprise
    ? bills.filter((b) => b.enterprise_id === enterprise.id)
    : [];

  const activeOrders = enterpriseBatchOrders.filter((b) => b.status === 'active');
  const unpaidBills = enterpriseBills.filter((b) => b.status === 'unpaid');

  const totalRemaining = activeOrders.reduce(
    (sum, o) => sum + (o.total_count - o.used_count),
    0
  );
  const totalUsed = enterpriseBatchOrders.reduce((sum, o) => sum + o.used_count, 0);
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  const handlePurchase = (pkg: ServicePackage) => {
    if (enterprise) {
      createBatchOrder(enterprise.id, pkg.id, 10);
    }
  };

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
                  </p>
                </div>
              </div>
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
                  <ArrowRight className="w-4 h-4 text-secondary-400" />
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
              <h2 className="text-xl font-bold text-secondary-900">我的服务包</h2>
              <p className="text-secondary-500 text-sm mt-1">正在生效中的服务包</p>
            </div>
            <Link
              to="/enterprise/orders"
              className="text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1 text-sm"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.slice(0, 3).map((order, index) => {
              const percent = Math.round((order.used_count / order.total_count) * 100);
              return (
                <div key={order.id} className={cn('card p-5 animate-fade-up', `stagger-${index + 1}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-secondary-800">{order.package_name}</h3>
                      <p className="text-xs text-secondary-400 mt-0.5">订单号 #{order.id}</p>
                    </div>
                    <span className="badge-green">使用中</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-secondary-500">使用进度</span>
                      <span className="font-medium text-secondary-700">
                        {order.used_count}/{order.total_count} 次
                      </span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-500">
                    <span>剩余 {order.total_count - order.used_count} 次</span>
                    <span>
                      到期：{new Date(order.expire_at).toLocaleDateString('zh-CN')}
                    </span>
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
            <h2 className="text-xl font-bold text-secondary-900">企业服务包采购</h2>
            <p className="text-secondary-500 text-sm mt-1">为您的企业选择合适的服务方案</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicePackages.map((pkg, index) => (
            <div key={pkg.id} className={cn('animate-fade-up', `stagger-${(index % 3) + 1}`)}>
              <PackageCard pkg={pkg} onPurchase={handlePurchase} featured={index === 1} />
            </div>
          ))}
        </div>
      </section>

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
              <p>企业专属客服：400-888-8888</p>
              <p>服务时间：工作日 09:00 - 18:00</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-secondary-700 text-center text-secondary-400 text-sm">
            © 2025 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
