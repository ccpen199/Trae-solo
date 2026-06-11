import Link from 'next/link';

const quickLinks = [
  { title: '宠物商城', desc: '主粮、玩具、护理用品浏览与筛选', href: '/shop', color: 'bg-orange-500' },
  { title: '限时秒杀', desc: '秒杀商品、库存与下单入口', href: '/shop/flash-sale', color: 'bg-red-500' },
  { title: '购物车', desc: '本地购物车和服务端购物车联动', href: '/cart', color: 'bg-teal-500' },
  { title: '我的订单', desc: '订单列表、详情、取消和确认收货', href: '/order', color: 'bg-blue-500' },
  { title: '宠物社区', desc: '动态、话题、问诊和领养内容', href: '/community', color: 'bg-purple-500' },
  { title: '个人中心', desc: '会员信息、宠物档案和用户资料', href: '/user', color: 'bg-emerald-500' },
];

const stats = [
  ['精选商品', '128'],
  ['活跃订单', '36'],
  ['社区内容', '2.4k'],
  ['领养信息', '58'],
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-20 md:pb-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-orange-600">Pet Life Platform</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
            宠趣生活服务台
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            本地复验模式已接入 SQLite API，可直接进入商城、购物车、订单和社区业务页面。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              进入商城
            </Link>
            <Link
              href="/order"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-600"
            >
              查看订单
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-2 w-12 rounded-full ${item.color}`} />
            <h2 className="mt-4 text-lg font-semibold text-slate-950 group-hover:text-orange-600">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
