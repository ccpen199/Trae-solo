import { ArrowRight, ShieldCheck, Clock, Star, Sparkles, Baby, ChefHat, ClipboardList, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ServiceCard from '@/components/ServiceCard';
import QuickOrderForm from '@/components/QuickOrderForm';
import { useAppStore, serviceTypeList } from '@/store';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

function getStatusBadge(status: Order['status']) {
  const map: Record<Order['status'], { className: string; label: string }> = {
    pending: { className: 'badge-gray', label: '待派单' },
    assigned: { className: 'badge-blue', label: '待接单' },
    accepted: { className: 'badge-blue', label: '已接单' },
    departing: { className: 'badge-orange', label: '已出发' },
    arrived: { className: 'badge-orange', label: '服务中' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

export default function Home() {
  const orders = useAppStore((state) => state.orders);
  const recentOrders = orders.slice(0, 2);

  const features = [
    { icon: ShieldCheck, title: '实名认证', desc: '所有阿姨均经过严格身份核验' },
    { icon: Clock, title: '准时到达', desc: '迟到赔付，保障您的时间' },
    { icon: Star, title: '品质保障', desc: '不满意可申请重服务或退款' },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 animate-fade-up stagger-1">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                暖心到家 · 专业家政服务
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 leading-tight">
                让家更温暖
                <br />
                <span className="text-primary-500">省心又安心</span>
              </h1>
              <p className="text-lg text-secondary-600 leading-relaxed">
                专业阿姨上门服务，保洁、育婴、做饭一站式解决。
                实名认证、品质保障、准时赔付，给您最贴心的家政体验。
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#services" className="btn-primary inline-flex items-center gap-2">
                  立即预约
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link to="/orders" className="btn-secondary inline-flex items-center gap-2">
                  我的订单
                  <ClipboardList className="w-5 h-5" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4">
                {[
                  { num: '10万+', label: '服务家庭' },
                  { num: '5000+', label: '认证阿姨' },
                  { num: '98%', label: '好评率' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl md:text-3xl font-bold text-secondary-800">{stat.num}</p>
                    <p className="text-sm text-secondary-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-up stagger-2">
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-40 animate-float" />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-secondary-200 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
              <div className="relative card p-6 md:p-8">
                <QuickOrderForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">选择您需要的服务</h2>
          <p className="text-secondary-500">三大核心服务，满足您的家庭需求</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {serviceTypeList.map((service, index) => (
            <div key={service.type} className={cn('animate-fade-up', `stagger-${index + 1}`)}>
              <ServiceCard {...service} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={cn('flex items-start gap-4 animate-fade-up', `stagger-${index + 1}`)}>
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-800 mb-1">{feature.title}</h3>
                    <p className="text-secondary-500">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">我的订单</h2>
            <p className="text-secondary-500 mt-1">查看您最近的服务订单</p>
          </div>
          <Link to="/orders" className="text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="card p-8">
            <p className="text-center text-secondary-500">暂无订单，快去下单吧~</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {recentOrders.map((order) => {
              const Icon = serviceIconMap[order.service_type];
              const badge = getStatusBadge(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="card-hover p-6 block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
                        <p className="text-sm text-secondary-500">订单号 #{order.id}</p>
                      </div>
                    </div>
                    <span className={badge.className}>{badge.label}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-secondary-600">
                      <MapPin className="w-4 h-4 text-secondary-400" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Clock className="w-4 h-4 text-secondary-400" />
                      <span>{order.start_time} · {order.duration_hours}小时</span>
                    </div>
                    {order.worker_name && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Phone className="w-4 h-4 text-secondary-400" />
                        <span>{order.worker_name} · {order.worker_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <p className="text-2xl font-bold text-primary-600">¥{order.amount}</p>
                    <span className="text-sm text-secondary-400">点击查看详情 →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="bg-secondary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">暖</span>
              </div>
              <div>
                <p className="text-lg font-bold">暖心到家</p>
                <p className="text-secondary-300 text-sm">让每一个家都温暖如初</p>
              </div>
            </div>
            <div className="text-secondary-300 text-sm text-center md:text-right">
              <p>客服电话：400-888-8888</p>
              <p>服务时间：08:00 - 22:00</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-secondary-700 text-center text-secondary-400 text-sm">
            © 2025 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
