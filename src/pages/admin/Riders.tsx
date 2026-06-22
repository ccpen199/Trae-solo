import { Search, Plus, UserRound, Star, TrendingUp, MapPin } from 'lucide-react'

export default function AdminRiders() {
  const riders = [
    { id: 1, name: '王师傅', phone: '139****6666', township: '乌峰街道', orders: 256, rating: 4.9, status: '在线', income: 4580 },
    { id: 2, name: '李师傅', phone: '138****5555', township: '乌峰街道', orders: 198, rating: 4.8, status: '在线', income: 3820 },
    { id: 3, name: '张师傅', phone: '137****4444', township: '南台街道', orders: 167, rating: 4.7, status: '配送中', income: 3210 },
    { id: 4, name: '赵师傅', phone: '136****3333', township: '泼机镇', orders: 145, rating: 4.6, status: '在线', income: 2890 },
    { id: 5, name: '刘师傅', phone: '135****2222', township: '母享镇', orders: 98, rating: 4.5, status: '离线', income: 1860 },
    { id: 6, name: '陈师傅', phone: '134****1111', township: '坡头镇', orders: 87, rating: 4.8, status: '在线', income: 1720 },
  ]

  const statusColors: Record<string, string> = {
    在线: 'bg-jade-50 text-jade-600',
    配送中: 'bg-purple-50 text-purple-600',
    离线: 'bg-rock-100 text-rock-500',
    休假: 'bg-amber-50 text-amber-600',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-rock-900">骑手管理</h1>
        <button className="flex items-center gap-2 bg-jade-500 hover:bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> 添加骑手
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '注册骑手', value: '86', icon: UserRound, color: 'text-jade-500' },
          { label: '在线骑手', value: '68', icon: UserRound, color: 'text-blue-500' },
          { label: '今日配送', value: '342', icon: TrendingUp, color: 'text-purple-500' },
          { label: '平均评分', value: '4.8', icon: Star, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-rock-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rock-500">{label}</p>
                <p className="text-2xl font-bold text-rock-900 mt-1">{value}</p>
              </div>
              <Icon size={24} className={color} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              placeholder="搜索骑手姓名、手机号..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400">
            <option>全部区域</option>
            <option>乌峰街道</option>
            <option>南台街道</option>
            <option>泼机镇</option>
            <option>母享镇</option>
          </select>
          <select className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400">
            <option>全部状态</option>
            <option>在线</option>
            <option>配送中</option>
            <option>离线</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rock-50 text-rock-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">骑手</th>
                <th className="text-left px-4 py-3 font-medium">负责区域</th>
                <th className="text-left px-4 py-3 font-medium">累计配送</th>
                <th className="text-left px-4 py-3 font-medium">评分</th>
                <th className="text-left px-4 py-3 font-medium">本月收入</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-medium text-sm">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-rock-900">{r.name}</p>
                        <p className="text-xs text-rock-500">{r.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-rock-600">
                      <MapPin size={14} />
                      {r.township}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-rock-700">{r.orders} 单</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-rock-700">{r.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-jade-600">¥{r.income.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-jade-600 hover:text-jade-700 text-sm font-medium">
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
