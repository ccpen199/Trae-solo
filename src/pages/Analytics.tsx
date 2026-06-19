import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Network,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default function Analytics() {
  const overviewStats = [
    { label: '团队总人数', value: '12,800+', change: '+8.2%', trend: 'up', icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: '本月GMV', value: '¥5,820万', change: '+15.6%', trend: 'up', icon: ShoppingBag, color: 'from-violet-500 to-purple-600' },
    { label: '动销SKU数', value: '168', change: '+12', trend: 'up', icon: Package, color: 'from-sky-500 to-blue-600' },
    { label: '市场饱和度预警', value: '6', change: '+2', trend: 'up', icon: AlertTriangle, color: 'from-rose-500 to-pink-600' },
  ]

  const regions = [
    { name: '华东区', value: 2180, saturation: 78, trend: 'up', growth: 12.5 },
    { name: '华南区', value: 1860, saturation: 85, trend: 'up', growth: 8.3 },
    { name: '华北区', value: 1620, saturation: 62, trend: 'up', growth: 15.2 },
    { name: '西南区', value: 1280, saturation: 45, trend: 'up', growth: 22.8 },
    { name: '华中区', value: 1050, saturation: 38, trend: 'up', growth: 18.6 },
    { name: '东北区', value: 860, saturation: 32, trend: 'down', growth: -3.2 },
    { name: '西北区', value: 520, saturation: 18, trend: 'up', growth: 28.4 },
  ]

  const teamFission = [
    { level: 1, count: 86, label: '直属一级' },
    { level: 2, count: 432, label: '二级团队' },
    { level: 3, count: 1856, label: '三级团队' },
    { level: 4, count: 4528, label: '四级及以下' },
  ]

  const warnings = [
    { type: 'saturation', region: '华南区-广东省深圳市', level: 'high', desc: '直销员密度过高，建议开拓新区域' },
    { type: 'saturation', region: '华东区-上海市浦东新区', level: 'medium', desc: '生活馆覆盖趋近饱和' },
    { type: 'low_sales', region: '东北区-黑龙江省', level: 'medium', desc: '近30天销量下降 3.2%' },
    { type: 'inventory', region: '西南区-成都仓', level: 'high', desc: '松花粉片库存积压 45 天' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-rose-600" />
            经销商数据看板
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            团队裂变图谱 · 产品动销分析 · 区域市场饱和度预警
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option>全国</option>
            <option>华东区</option>
            <option>华南区</option>
            <option>华北区</option>
          </select>
          <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option>近30天</option>
            <option>近90天</option>
            <option>本年度</option>
          </select>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200">
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
                    s.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {s.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {s.change}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl lg:text-3xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 团队裂变图谱 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Network className="w-5 h-5 text-violet-600" />
            团队裂变图谱
          </h3>
          <div className="flex items-end justify-around gap-2 h-48">
            {teamFission.map((t, i) => (
              <div key={t.level} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-sm font-bold text-slate-800">{t.count.toLocaleString()}</div>
                <div
                  className={`w-full rounded-t-xl bg-gradient-to-t ${
                    i === 0
                      ? 'from-violet-500 to-purple-500'
                      : i === 1
                      ? 'from-violet-400 to-purple-400'
                      : i === 2
                      ? 'from-violet-300 to-purple-300'
                      : 'from-violet-200 to-purple-200'
                  }`}
                  style={{ height: `${(t.count / 5000) * 100}%`, minHeight: '20px' }}
                />
                <div className="text-xs text-slate-600 text-center">{t.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-violet-600">5</div>
              <div className="text-xs text-slate-500">裂变层级</div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-600">2.3x</div>
              <div className="text-xs text-slate-500">裂变系数</div>
            </div>
          </div>
        </div>

        {/* 区域市场分析 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-emerald-600" />
            区域市场分析
          </h3>
          <div className="space-y-4">
            {regions.map((r) => (
              <div key={r.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-400">{r.value.toLocaleString()} 人</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        r.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {r.trend === 'up' ? '+' : ''}{r.growth}%
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.saturation >= 75
                          ? 'bg-rose-50 text-rose-600'
                          : r.saturation >= 50
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      饱和度 {r.saturation}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      r.saturation >= 75
                        ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                        : r.saturation >= 50
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    }`}
                    style={{ width: `${r.saturation}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 产品动销 TOP */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center justify-between mb-6">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              产品动销 TOP 5
            </span>
            <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              全部 <ChevronRight className="w-4 h-4" />
            </button>
          </h3>
          <div className="space-y-4">
            {[
              { name: '国珍松花粉片', sales: 8620, amount: '¥342万', share: 38.2, icon: '🌰' },
              { name: '国珍松花钙奶粉', sales: 5890, amount: '¥140万', share: 18.5, icon: '🥛' },
              { name: '国珍玛咖压片糖果', sales: 4320, amount: '¥141万', share: 15.8, icon: '💪' },
              { name: '国珍竹康宁片', sales: 3120, amount: '¥149万', share: 11.2, icon: '🎋' },
              { name: '国珍葡萄籽VE', sales: 2680, amount: '¥96万', share: 9.8, icon: '🍇' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="text-3xl">{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 truncate">{p.name}</span>
                    <span className="text-sm font-bold text-slate-800 ml-2">{p.amount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{ width: `${p.share}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right">
                      {p.sales.toLocaleString()} 件
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 预警信息 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            市场预警
            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
              {warnings.length}
            </span>
          </h3>
          <div className="space-y-3">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition hover:shadow-md ${
                  w.level === 'high'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      w.level === 'high' ? 'text-rose-500' : 'text-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          w.level === 'high'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {w.level === 'high' ? '高危' : '中危'}
                      </span>
                      <span className="text-xs text-slate-500">{w.region}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{w.desc}</p>
                    <button className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1">
                      查看详情 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
