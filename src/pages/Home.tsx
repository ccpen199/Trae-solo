import { ArrowRight, ShieldCheck, Clock, Star, Sparkles, Baby, ChefHat, ClipboardList, MapPin, Phone, Zap, Shield, BadgeCheck, CircleDollarSign, Timer, Navigation, ChevronRight, HandHeart, LayoutDashboard, Building2, FileSearch, ScanLine, Flame, FileText, Mic, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
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
    arrived: { className: 'badge-orange', label: '已到达' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

function MiniProgress({ status }: { status: Order['status'] }) {
  const steps = ['pending', 'assigned', 'departing', 'arrived', 'servicing', 'completed'];
  const statusOrder: Record<string, number> = {
    pending: 0, assigned: 1, accepted: 1, departing: 2, arrived: 3, servicing: 4, completed: 5, cancelled: -1, compensated: 5,
  };
  const idx = statusOrder[status] ?? 0;
  const pct = status === 'cancelled' ? 0 : Math.min(100, (idx / 5) * 100);
  const labels: Record<string, string> = {
    pending: '正在匹配1km内阿姨...',
    assigned: '等待阿姨接单',
    accepted: '阿姨已接单',
    departing: '阿姨出发中',
    arrived: '阿姨已到达',
    servicing: '服务进行中',
    completed: '服务已完成',
    cancelled: '订单已取消',
    compensated: '已赔付',
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-primary-600 font-medium">{labels[status]}</span>
        <span className="text-secondary-400">{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const orders = useAppStore((state) => state.orders);
  const recentOrders = orders.slice(0, 3);

  const guarantees = [
    { icon: BadgeCheck, title: '三证实名认证', desc: '身份证+健康证+无犯罪记录，OCR自动识别+人工复核双重保障', tag: '强管控' },
    { icon: CircleDollarSign, title: '爽约全额赔付', desc: '阿姨迟到超30分钟或未上门，全额返现+30元补偿券，24小时自动到账', tag: '零风险' },
    { icon: Navigation, title: '1km智能派单', desc: '基于地理位置热力图调度，1km内优先派单，评分最高阿姨优先', tag: '极速匹配' },
    { icon: Shield, title: '全程保险保障', desc: '每单投保家政服务责任险，人身+财产双重保障，最高赔付50万元', tag: '安心服务' },
  ];

  const compensationRules = [
    { condition: '阿姨迟到超过30分钟', refund: '100%全额退款', coupon: '+30元补偿券' },
    { condition: '阿姨未按约定上门', refund: '100%全额退款', coupon: '+30元补偿券' },
    { condition: '服务质量不达标', refund: '免费重新服务或退款', coupon: '+20元补偿券' },
    { condition: '服务过程造成损失', refund: '保险理赔', coupon: '最高50万元' },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="absolute inset-0 opacity-[0.03] noise-bg pointer-events-none" />
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
                三证审核、1km派单、爽约赔付，给您最贴心的家政体验。
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Zap, text: '3秒极速下单' },
                  { icon: CircleDollarSign, text: '爽约全额赔付' },
                  { icon: Navigation, text: '1km智能派单' },
                ].map((item) => (
                  <span key={item.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-primary-200 text-primary-700 text-sm font-medium">
                    <item.icon className="w-4 h-4" />
                    {item.text}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#quick-order" className="btn-primary inline-flex items-center gap-2 animate-pulse-slow">
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
              <p className="text-xs text-secondary-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                想体验阿姨端/管理端/企业端？点击右上角角色切换即可
              </p>
            </div>

            <div id="quick-order" className="relative animate-fade-up stagger-2">
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-40 animate-float" />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-secondary-200 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
              <div className="relative card p-6 md:p-8 border-2 border-primary-100">
                <QuickOrderForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">选择您需要的服务</h2>
          <p className="text-secondary-500">三大核心服务，满足您的家庭需求</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {serviceTypeList.map((service, index) => {
            const Icon = serviceIconMap[service.type];
            return (
              <div key={service.type} className={cn('card-hover p-8 animate-fade-up', `stagger-${index + 1}`)}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-5">
                  <Icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-secondary-800 mb-2">{service.label}</h3>
                <p className="text-secondary-500 mb-4">{service.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">¥{service.price}</span>
                    <span className="text-sm text-secondary-400">/小时</span>
                  </div>
                  <a href="#quick-order" className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:text-primary-700">
                    立即预约 <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-secondary-900 mb-3">四重服务保障</h2>
            <p className="text-secondary-500">每一单都让您安心、放心</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {guarantees.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={cn('card p-6 text-center animate-fade-up', `stagger-${index + 1}`)}>
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <span className="badge-orange text-xs mb-2 inline-block">{item.tag}</span>
                  <h3 className="text-lg font-bold text-secondary-800 mb-2">{item.title}</h3>
                  <p className="text-secondary-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-4">
            <CircleDollarSign className="w-4 h-4" />
            爽约自动赔付
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">不满意？全额赔付</h2>
          <p className="text-secondary-500 max-w-2xl mx-auto">平台承诺爽约自动赔付，全额返现+补偿券，24小时内自动到账，让您下单零风险</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">赔付保障计划</h3>
                  <p className="text-primary-100 text-sm">平台先行垫付，保障您的每一分钱</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-100">最高赔付</p>
                  <p className="text-3xl font-bold">50万</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {compensationRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-cream-100 hover:bg-primary-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-800">{rule.condition}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-primary-600 font-bold">{rule.refund}</p>
                      <p className="text-xs text-secondary-500">{rule.coupon}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-start gap-3">
                  <Timer className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 text-sm">赔付时效</p>
                    <p className="text-yellow-700 text-sm mt-1">申请提交后24小时内自动审核到账，无需人工跟进。平台先行垫付，保障您的权益。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">我的订单</h2>
            <p className="text-secondary-500 mt-1">实时追踪服务进度，全程可视化</p>
          </div>
          <Link to="/orders" className="text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-secondary-500 mb-4">暂无订单，快去下单吧~</p>
            <a href="#quick-order" className="btn-primary inline-flex items-center gap-2">
              立即下单
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {recentOrders.map((order) => {
              const Icon = serviceIconMap[order.service_type];
              const badge = getStatusBadge(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="card-hover p-6 block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
                        <p className="text-xs text-secondary-400">#{order.id}</p>
                      </div>
                    </div>
                    <span className={badge.className}>{badge.label}</span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-secondary-600">
                      <MapPin className="w-3.5 h-3.5 text-secondary-400" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Clock className="w-3.5 h-3.5 text-secondary-400" />
                      <span>{order.start_time} · {order.duration_hours}h</span>
                    </div>
                    {order.worker_name && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Phone className="w-3.5 h-3.5 text-secondary-400" />
                        <span>{order.worker_name}</span>
                      </div>
                    )}
                  </div>

                  <MiniProgress status={order.status} />

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xl font-bold text-primary-600">¥{order.amount}</p>
                    <span className="text-xs text-primary-600 font-medium flex items-center gap-0.5">
                      详情 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">3秒完成预约</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">选服务、选地址、选时间，三步即可完成下单。爽约全额赔付，让您无忧体验。</p>
          <a href="#quick-order" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full font-bold text-lg hover:bg-primary-50 hover:shadow-lg transition-all active:scale-95">
            <Zap className="w-5 h-5" />
            立即下单体验
          </a>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">多端业务入口</h2>
          <p className="text-secondary-500">从不同角色视角体验平台完整能力</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/worker" className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <HandHeart className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">阿姨端</h3>
                <p className="text-xs text-secondary-500">阿姨接单工作台</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: ScanLine, text: '三证OCR识别+人工复核', desc: '身份证/健康证/无犯罪记录' },
                { icon: Star, text: '服务评分动态加权', desc: '准时率40% · 好评50% · 投诉10%' },
                { icon: Flame, text: '地理位置热力图调度', desc: '1km内优先派单' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2 text-sm">
                  <item.icon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-secondary-700 font-medium">{item.text}</p>
                    <p className="text-xs text-secondary-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1 text-orange-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入阿姨端 <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link to="/admin" className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">管理后台</h3>
                <p className="text-xs text-secondary-500">运营管理中枢</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: Shield, text: '保险SaaS集成', desc: '自动投保/出单/理赔' },
                { icon: FileText, text: 'SOP标准文档库', desc: '保洁/育婴/做饭三类SOP' },
                { icon: Mic, text: '录音转文字质检', desc: '关键词合规率自动检测' },
                { icon: BarChart3, text: '差评根因聚类', desc: '词云+饼图+趋势分析' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2 text-sm">
                  <item.icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-secondary-700 font-medium">{item.text}</p>
                    <p className="text-xs text-secondary-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1 text-teal-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入管理后台 <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link to="/enterprise" className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">企业客户</h3>
                <p className="text-xs text-secondary-500">批量采购服务包</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: Building2, text: '物业/公寓定制化服务包', desc: '按需组合保洁+育婴+做饭' },
                { icon: ClipboardList, text: '批量订单管理', desc: '次数卡模式一键消耗' },
                { icon: CircleDollarSign, text: '企业账单中心', desc: '月度账单+发票申请' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2 text-sm">
                  <item.icon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-secondary-700 font-medium">{item.text}</p>
                    <p className="text-xs text-secondary-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1 text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入企业端 <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
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
