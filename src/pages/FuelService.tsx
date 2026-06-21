import { useAppStore } from '@/store'
import { Fuel, Plus, Receipt, History, CheckCircle2, FileText, Zap, Crown, Star } from 'lucide-react'
import { useState } from 'react'

export default function FuelService() {
  const { fuelCards } = useAppStore()
  const [brand, setBrand] = useState('全部')
  const [selectedPackage, setSelectedPackage] = useState(2)

  const brands = ['全部', '中国石化', '中国石油', '壳牌']
  const filtered = brand === '全部' ? fuelCards : fuelCards.filter(f => f.brand === brand)

  const packages = [
    { name: '5000元套餐', amount: 5000, discount: 0.935, original: 5000, save: '最高325元', gift: '送玻璃水×2' },
    { name: '10000元套餐', amount: 10000, discount: 0.92, original: 10000, save: '最高800元', gift: '送保养抵扣券' },
    { name: '20000元套餐', amount: 20000, discount: 0.905, original: 20000, save: '最高1,900元', gift: '送ETC充值¥500' },
    { name: '50000元尊享', amount: 50000, discount: 0.88, original: 50000, save: '最高6,000元', gift: '专属VIP客服' },
  ]

  return (
    <div className="space-y-6">
      {/* 品牌合作横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-yellow-400/10 rounded-full translate-y-1/2" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs opacity-90 mb-1.5 flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-200" />
              官方品牌战略合作
            </div>
            <h2 className="text-2xl font-bold tracking-wide">全国三大油企联合折扣中心</h2>
            <p className="text-sm opacity-90 mt-1">中石化 / 中石油 / 壳牌 · 最高 12% 立减 · 全国 3 万+ 站点通用</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { brand: '中国石化', color: 'from-red-500 to-red-600', letter: 'S' },
              { brand: '中国石油', color: 'from-emerald-500 to-emerald-600', letter: 'P' },
              { brand: '壳牌', color: 'from-yellow-400 to-yellow-500', letter: 'V' },
            ].map((b) => (
              <div key={b.brand} className="text-center">
                <div className={`w-12 h-12 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-1.5 font-bold text-xl shadow-inner`}>
                  {b.letter}
                </div>
                <div className="text-[10px] opacity-90 font-medium">{b.brand}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '已绑油卡', count: fuelCards.length, icon: Fuel, color: 'from-amber-500 to-orange-500' },
          { label: '累计充值', count: '¥458,600', icon: Plus, color: 'from-emerald-500 to-teal-500' },
          { label: '累计节省', count: '¥38,980', icon: Receipt, color: 'from-primary-500 to-violet-500' },
          { label: '本月消费', count: '¥62,480', icon: History, color: 'from-blue-500 to-sky-500' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-base p-5 card-hover relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${s.color} opacity-5 -translate-y-1/2 translate-x-1/2`} />
              <div className="relative flex items-center justify-between mb-3">
                <span className="text-xs text-slate2-400 font-medium">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate2-800 tracking-tight relative">{s.count}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* 品牌筛选 + 油卡列表 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      brand === b
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : 'bg-slate2-50 text-slate2-500 hover:bg-slate2-100'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                绑定新油卡
              </button>
            </div>
            <div className="p-5 space-y-4">
              {filtered.map((f) => (
                <div key={f.id} className="p-5 rounded-2xl border border-slate2-100 bg-gradient-to-br from-slate2-50/80 via-white to-white hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        f.brand === '中国石化' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                        f.brand === '中国石油' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        'bg-gradient-to-br from-yellow-400 to-amber-500'
                      }`}>
                        <Fuel className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-slate2-800">{f.brand}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${
                            f.discount <= 0.9 ? 'bg-gradient-to-r from-accent-500 to-red-500' :
                            f.discount <= 0.93 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            'bg-gradient-to-r from-sky-500 to-indigo-500'
                          }`}>
                            {(f.discount * 10).toFixed(1)}折
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            f.status === 'active' ? 'bg-success-50 text-success-600' : 'bg-slate2-100 text-slate2-500'
                          }`}>
                            {f.status === 'active' ? '正常' : '停用'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate2-500 mb-1">卡号: {f.cardNo}</div>
                        <div className="text-[11px] text-slate2-500 flex items-center gap-2">
                          <span>绑定: <span className="font-mono text-slate2-700">{f.vehiclePlate}</span></span>
                          <span className="w-1 h-1 rounded-full bg-slate2-200" />
                          <span>本月已消费 82 次</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate2-400 mb-0.5">账户余额</div>
                      <div className="text-2xl font-extrabold font-mono text-slate2-800">¥{f.balance.toLocaleString()}</div>
                      <button className="mt-2 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold hover:shadow-md transition-all flex items-center gap-1 ml-auto">
                        <Plus className="w-3 h-3" />
                        立即充值
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 消费记录 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="px-5 py-4 border-b border-slate2-100 flex items-center justify-between">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                加油消费记录
              </h3>
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">查看全部 →</button>
            </div>
            <div className="divide-y divide-slate2-50 max-h-[360px] overflow-y-auto">
              {[
                { t: '2026-06-21 09:15', station: '中石化深圳龙岗店', l: '0# 柴油 458L', amt: 3480.8, save: 278.46, card: '粤B·D12345', brand: '中国石化' },
                { t: '2026-06-20 14:32', station: '中石油长沙望城站', l: '0# 柴油 320L', amt: 2432.0, save: 194.56, card: '粤B·88888', brand: '中国石油' },
                { t: '2026-06-19 21:08', station: '壳牌武汉东西湖', l: '95# 汽油 180L', amt: 1692.0, save: 135.36, card: '浙B·23456', brand: '壳牌' },
                { t: '2026-06-19 08:45', station: '中石化赣州服务区', l: '0# 柴油 560L', amt: 4256.0, save: 340.48, card: '粤B·D12345', brand: '中国石化' },
                { t: '2026-06-18 16:20', station: '中石油广州白云', l: '0# 柴油 280L', amt: 2128.0, save: 170.24, card: '鲁F·H6666', brand: '中国石油' },
                { t: '2026-06-18 06:10', station: '中石化烟台福山站', l: '0# 柴油 380L', amt: 2888.0, save: 231.04, card: '鲁F·H6666', brand: '中国石化' },
              ].map((r, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate2-50/60 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
                    r.brand === '中国石化' ? 'bg-red-500' : r.brand === '中国石油' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate2-800 truncate">{r.station}</span>
                      <span className="text-[10px] text-slate2-400 bg-slate2-50 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{r.card}</span>
                    </div>
                    <div className="text-[11px] text-slate2-500 flex items-center gap-2">
                      <span className="font-mono">{r.t}</span>
                      <span className="w-1 h-1 rounded-full bg-slate2-200" />
                      <span>{r.l}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold font-mono text-slate2-800">¥{r.amt.toFixed(2)}</div>
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
                      <Zap className="w-3 h-3" />
                      省 ¥{r.save.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧套餐 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="card-base overflow-hidden card-hover">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-transparent border-b border-amber-100">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                折扣充值套餐
                <span className="text-[10px] font-normal text-amber-600 ml-1">本月限量 200 份</span>
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {packages.map((p, i) => {
                const active = selectedPackage === i
                const actualPay = Math.round(p.amount * p.discount)
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPackage(i)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                      active
                        ? 'border-amber-400 shadow-xl ring-4 ring-amber-50 scale-[1.01] bg-gradient-to-r from-amber-50/80 to-white'
                        : 'border-slate2-100 hover:border-amber-200 hover:shadow-md'
                    }`}
                  >
                    {i === packages.length - 1 && (
                      <div className="absolute -top-2 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-accent-500 to-red-500 text-white text-[10px] font-bold shadow-md flex items-center gap-0.5">
                        <Crown className="w-3 h-3" /> 最划算
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate2-800">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-accent-500 to-red-500 text-white font-bold">
                            {(p.discount * 10).toFixed(1)}折
                          </span>
                        </div>
                        <div className="text-[11px] text-slate2-500 mt-1 flex items-center gap-2">
                          <span className="text-emerald-600 font-semibold">{p.save}</span>
                          <span className="w-1 h-1 rounded-full bg-slate2-200" />
                          <span>{p.gift}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate2-400 line-through">¥{p.original.toLocaleString()}</span>
                        </div>
                        <div className="text-2xl font-extrabold font-mono bg-gradient-to-r from-accent-500 to-red-500 bg-clip-text text-transparent">
                          ¥{actualPay.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className={`mt-3 h-1 rounded-full overflow-hidden ${active ? 'bg-amber-100' : 'bg-slate2-100'}`}>
                      <div
                        className={`h-full ${active ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate2-300'}`}
                        style={{ width: `${40 + i * 15}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-slate2-400 flex justify-between">
                      <span>已售 {40 + i * 15}%</span>
                      <span>剩余 {200 - Math.floor((40 + i * 15) * 2)} 份</span>
                    </div>
                  </button>
                )
              })}
              <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold hover:shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 mt-2">
                <Zap className="w-4 h-4" />
                立即抢购 ¥{Math.round(packages[selectedPackage].amount * packages[selectedPackage].discount).toLocaleString()}
              </button>
            </div>
          </div>

          {/* 发票与说明 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-base p-4 card-hover">
              <FileText className="w-5 h-5 text-primary-500 mb-2" />
              <div className="text-sm font-bold text-slate2-800 mb-0.5">电子发票</div>
              <div className="text-[10px] text-slate2-500">按月汇总 · 增值税专票</div>
            </div>
            <div className="card-base p-4 card-hover">
              <CheckCircle2 className="w-5 h-5 text-success-500 mb-2" />
              <div className="text-sm font-bold text-slate2-800 mb-0.5">保障承诺</div>
              <div className="text-[10px] text-slate2-500">官方正品 · 假一赔十</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
