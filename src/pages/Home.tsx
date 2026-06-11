import { Link } from 'react-router-dom'
import { Smartphone, Laptop, Tablet, Watch, Recycle, ArrowRight, Clock, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const serviceCategories = [
  { icon: Smartphone, label: '手机维修', color: 'bg-blue-500', count: '200+项目' },
  { icon: Laptop, label: '笔记本维修', color: 'bg-purple-500', count: '150+项目' },
  { icon: Tablet, label: '平板维修', color: 'bg-orange-500', count: '100+项目' },
  { icon: Watch, label: '智能穿戴维修', color: 'bg-pink-500', count: '80+项目' },
  { icon: Recycle, label: '设备回收', color: 'bg-accent', count: '即时估价' },
]

const activeOrders = [
  { id: 'ORD-20240101', device: 'iPhone 15 Pro', issue: '屏幕碎裂', status: 'repairing', statusLabel: '维修中', color: 'bg-purple-500', countdown: 3600 },
  { id: 'ORD-20240102', device: 'MacBook Air M2', issue: '电池更换', status: 'accepted', statusLabel: '已接单', color: 'bg-blue-500', countdown: 7200 },
  { id: 'ORD-20240103', device: 'iPad Pro', issue: '主板故障', status: 'arrived', statusLabel: '已到场', color: 'bg-indigo-500', countdown: 1800 },
]

const popularItems = [
  { rank: 1, name: 'iPhone 屏幕更换', price: '¥299', trend: 'up' },
  { rank: 2, name: 'MacBook 电池更换', price: '¥499', trend: 'up' },
  { rank: 3, name: 'iPad 屏幕维修', price: '¥399', trend: 'down' },
  { rank: 4, name: '华为手机换屏', price: '¥259', trend: 'up' },
  { rank: 5, name: '笔记本清灰保养', price: '¥99', trend: 'stable' },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const step = Math.ceil(target / 60)
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + step
        if (next >= target) {
          clearInterval(timer)
          return target
        }
        return next
      })
    }, 30)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span className="font-title text-3xl font-bold text-white sm:text-4xl">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function Home() {
  return (
    <div className="animate-fade-in">
      <section className="gradient-hero relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="font-title text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              智能终端上门快修
              <span className="text-accent">服务平台</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              专业认证技师 · 全程视频记录 · 配件一物一码溯源 · 资金托管保障
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { target: 1280, suffix: '+认证技师' },
                { target: 58, suffix: '+服务城市' },
                { target: 98600, suffix: '+完成订单' },
              ].map((stat) => (
                <div key={stat.suffix} className="text-center">
                  <AnimatedCounter target={stat.target} suffix="" />
                  <p className="mt-1 text-sm text-gray-400">{stat.suffix}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/diagnosis"
                className="gradient-accent rounded-lg px-8 py-3 font-medium text-primary shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
              >
                立即诊断
              </Link>
              <Link
                to="/booking"
                className="rounded-lg border border-gray-600 px-8 py-3 font-medium text-white transition-all hover:border-accent hover:text-accent"
              >
                预约维修
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-title text-2xl font-bold text-primary">服务类别</h2>
        <p className="mt-1 text-gray-500">选择您需要的服务类型</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {serviceCategories.map((cat) => (
            <Link
              key={cat.label}
              to="/diagnosis"
              className="group rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`inline-flex rounded-xl ${cat.color} p-3 text-white`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-medium text-primary">{cat.label}</h3>
              <p className="mt-1 text-xs text-gray-400">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-title text-2xl font-bold text-primary">进行中的订单</h2>
              <p className="mt-1 text-gray-500">实时追踪您的维修进度</p>
            </div>
            <Link to="/booking" className="flex items-center gap-1 text-sm text-accent hover:underline">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {activeOrders.map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="min-w-[280px] shrink-0 rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${order.color}`} />
                  <span className="text-xs font-medium text-gray-500">{order.id}</span>
                </div>
                <h4 className="mt-2 font-medium text-primary">{order.device}</h4>
                <p className="text-sm text-gray-500">{order.issue}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {order.statusLabel}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {Math.floor(order.countdown / 60)}分钟
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-title text-2xl font-bold text-primary">热门维修项目</h2>
        <p className="mt-1 text-gray-500">最受欢迎的维修服务</p>
        <div className="mt-8 rounded-lg border border-gray-100 bg-white shadow-sm">
          {popularItems.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between border-b border-gray-50 px-6 py-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full font-title text-sm font-bold ${
                  item.rank <= 3 ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.rank}
                </span>
                <span className="font-medium text-primary">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-title text-lg font-bold text-accent">{item.price}</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
