import type { LucideIcon } from 'lucide-react'
import { Search, Truck, UserRound, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminDelivery() {
  const deliveries = [
    { id: 'PS20240621001', orderId: 'DD202406210002', rider: '王师傅', customer: '王女士', address: '乌峰街道南台路88号', status: '配送中', distance: '1.2km', time: '约8分钟' },
    { id: 'PS20240621002', orderId: 'DD202406210005', rider: '李师傅', customer: '张先生', address: '南台街道赤水源大道156号', status: '配送中', distance: '2.5km', time: '约15分钟' },
    { id: 'PS20240621003', orderId: 'DD202406210008', rider: '张师傅', customer: '刘女士', address: '泼机镇龙翔路23号', status: '已取货', distance: '4.8km', time: '约25分钟' },
    { id: 'PS20240621004', orderId: 'DD202406210011', rider: '赵师傅', customer: '陈先生', address: '母享镇文昌街45号', status: '待取货', distance: '-', time: '-' },
    { id: 'PS20240621005', orderId: 'DD202406210013', rider: '王师傅', customer: '李先生', address: '乌峰街道南广路201号', status: '已送达', distance: '0.8km', time: '已完成' },
    { id: 'PS20240621006', orderId: 'DD202406210015', rider: '', customer: '周女士', address: '坡头镇振兴路12号', status: '待分配', distance: '-', time: '-' },
  ]

  const statusConfig: Record<string, { color: string; icon: LucideIcon }> = {
    待分配: { color: 'bg-amber-50 text-amber-600', icon: AlertCircle },
    待取货: { color: 'bg-blue-50 text-blue-600', icon: Clock },
    已取货: { color: 'bg-purple-50 text-purple-600', icon: Truck },
    配送中: { color: 'bg-purple-50 text-purple-600', icon: Truck },
    已送达: { color: 'bg-jade-50 text-jade-600', icon: CheckCircle2 },
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-rock-900 mb-6">配送订单</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: '待分配', value: '8', color: 'text-amber-500' },
          { label: '待取货', value: '15', color: 'text-blue-500' },
          { label: '配送中', value: '23', color: 'text-purple-500' },
          { label: '今日完成', value: '98', color: 'text-jade-500' },
          { label: '超时订单', value: '2', color: 'text-ember-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-rock-100">
            <p className="text-sm text-rock-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              placeholder="搜索配送单号、订单号..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400">
            <option>全部状态</option>
            <option>待分配</option>
            <option>待取货</option>
            <option>配送中</option>
            <option>已送达</option>
          </select>
          <select className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400">
            <option>全部骑手</option>
            <option>王师傅</option>
            <option>李师傅</option>
            <option>张师傅</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rock-50 text-rock-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">配送单号</th>
                <th className="text-left px-4 py-3 font-medium">关联订单</th>
                <th className="text-left px-4 py-3 font-medium">骑手</th>
                <th className="text-left px-4 py-3 font-medium">收货人</th>
                <th className="text-left px-4 py-3 font-medium">配送地址</th>
                <th className="text-left px-4 py-3 font-medium">距离</th>
                <th className="text-left px-4 py-3 font-medium">预计时间</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => {
                const config = statusConfig[d.status]
                const StatusIcon = config.icon
                return (
                  <tr key={d.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                    <td className="px-4 py-3 font-mono text-rock-700">{d.id}</td>
                    <td className="px-4 py-3 text-rock-600 font-mono text-xs">{d.orderId}</td>
                    <td className="px-4 py-3">
                      {d.rider ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white text-xs font-medium">
                            {d.rider[0]}
                          </div>
                          <span className="text-rock-700">{d.rider}</span>
                        </div>
                      ) : (
                        <span className="text-rock-400 flex items-center gap-1">
                          <UserRound size={14} /> 待分配
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-rock-700">{d.customer}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-1 text-rock-600">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0 text-rock-400" />
                        <span className="line-clamp-1">{d.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-rock-600">{d.distance}</td>
                    <td className="px-4 py-3 text-rock-600">{d.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                        <StatusIcon size={12} />
                        {d.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
