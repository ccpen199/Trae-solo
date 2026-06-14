import { Link } from 'react-router-dom';
import {
  BellRing,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  Image,
  MapPin,
  Ruler,
  ShieldCheck,
  Star,
  WalletCards,
} from 'lucide-react';

const savedInspirations = [
  { id: 'modern-living', title: '现代简约客厅', style: '现代', color: '#C7774B', views: 873 },
  { id: 'nordic-bedroom', title: '北欧风卧室', style: '北欧', color: '#8DA6A3', views: 989 },
  { id: 'cream-kitchen', title: '奶油风厨房', style: '法式', color: '#D7B98D', views: 462 },
];

const appointments = [
  { company: '华筑精工装饰', time: '2026-06-15 14:00', status: '待上门量房' },
  { company: '艺境空间设计', time: '2026-06-17 10:30', status: '方案沟通中' },
];

const orders = [
  { name: '3D设计方案生成', status: '处理中', amount: '¥199' },
  { name: '上门量房预约', status: '已确认', amount: '¥0' },
];

const notifications = [
  '华筑精工装饰已确认 6 月 15 日量房',
  '现代简约客厅方案新增 3 张相似案例',
  '滨江壹号工地水电验收报告已更新',
];

export default function OwnerProfile() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <section className="card-base p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-wood-300 to-terracotta-400 flex items-center justify-center text-white text-3xl font-serif font-semibold shadow-glow-wood">
              林
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="section-title mb-0">林女士的装修档案</h1>
                <span className="badge-wood">业主用户</span>
                <span className="badge-success">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  资金托管已开通
                </span>
              </div>
              <p className="text-ivory-600">
                上海市徐汇区 · 89㎡ 三室两厅 · 现代简约 · 预算 18-22 万
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                {[
                  ['收藏案例', '36'],
                  ['预约量房', '2'],
                  ['对比方案', '3'],
                  ['托管金额', '¥50,000'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-ivory-100 border border-ivory-300 px-4 py-3">
                    <div className="text-lg font-mono font-semibold text-carbon-800">{value}</div>
                    <div className="text-xs text-ivory-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-carbon-800">项目进度</h2>
            <Link
              to="/owner/progress/home-renovation"
              className="inline-flex min-h-9 items-center rounded-btn border border-terracotta-200 bg-terracotta-50 px-3 text-sm font-medium text-terracotta-700 transition-colors hover:border-terracotta-300 hover:bg-terracotta-100"
            >
              查看详情
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { label: '需求确认', done: true },
              { label: '量房预约', done: true },
              { label: '方案报价', done: true },
              { label: '合同托管', done: false },
              { label: '开工交底', done: false },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                  step.done ? 'bg-terracotta-500 text-white' : 'bg-ivory-200 text-ivory-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-carbon-800">{step.label}</div>
                  <div className="h-1.5 rounded-full bg-ivory-200 mt-2 overflow-hidden">
                    <div className={`h-full rounded-full ${step.done ? 'w-full bg-terracotta-500' : 'w-1/3 bg-wood-300'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card-base p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl text-carbon-800">收藏灵感</h2>
              <p className="text-sm text-ivory-600 mt-1">最近收藏的风格案例和可复用配色</p>
            </div>
            <Link to="/owner/inspiration" className="btn-secondary text-sm">
              全部收藏 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedInspirations.map((item) => (
              <Link key={item.id} to={`/owner/inspiration/${item.id}`} className="group rounded-xl border border-ivory-300 bg-ivory-50 overflow-hidden hover:shadow-card transition-all">
                <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: item.color }}>
                  <Image className="w-10 h-10 text-white/85" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-carbon-800 group-hover:text-terracotta-700 transition-colors">{item.title}</h3>
                    <Heart className="w-4 h-4 text-terracotta-500 fill-terracotta-500" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-ivory-500">
                    <span>{item.style}</span>
                    <span>{item.views} 次查看</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">待办提醒</h2>
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-ivory-50 border border-ivory-200 p-3">
                <BellRing className="w-4 h-4 text-terracotta-500 mt-0.5 shrink-0" />
                <p className="text-sm text-carbon-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card-base p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-carbon-800">量房预约</h2>
            <CalendarCheck className="w-5 h-5 text-wood-600" />
          </div>
          <div className="space-y-4">
            {appointments.map((item) => (
              <div key={item.company} className="rounded-xl border border-ivory-300 p-4">
                <div className="font-medium text-carbon-800">{item.company}</div>
                <div className="flex items-center gap-2 text-sm text-ivory-600 mt-2">
                  <MapPin className="w-4 h-4" />
                  徐汇区漕河泾
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-ivory-500">{item.time}</span>
                  <span className="badge-haze">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-base p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-carbon-800">订单与托管</h2>
            <WalletCards className="w-5 h-5 text-wood-600" />
          </div>
          <div className="space-y-4">
            {orders.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-ivory-300 p-4">
                <div>
                  <div className="font-medium text-carbon-800">{item.name}</div>
                  <span className="badge-success mt-2">{item.status}</span>
                </div>
                <div className="font-mono font-semibold text-terracotta-600">{item.amount}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">常用入口</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '3D方案', to: '/owner/3d-generator', icon: Home },
              { label: '报价计算', to: '/owner/calculator', icon: Ruler },
              { label: '找公司', to: '/owner/companies', icon: Building2 },
              { label: '方案比价', to: '/owner/compare', icon: ClipboardList },
              { label: '我的预约', to: '/owner/appointments', icon: CalendarCheck },
              { label: '工艺库', to: '/owner/knowledge/process', icon: Star },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="rounded-xl border border-ivory-300 bg-ivory-50 p-4 hover:bg-white hover:shadow-card transition-all">
                  <Icon className="w-5 h-5 text-terracotta-600 mb-3" />
                  <span className="text-sm font-medium text-carbon-800">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
