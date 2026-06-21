import { useAppStore } from '@/store'
import {
  CreditCard, Plus, Receipt, FileText, Download, Search,
  CheckCircle2, RefreshCcw, ArrowUpRight, Shield, History,
  ChevronDown, Zap,
} from 'lucide-react'
import { useState } from 'react'

export default function EtcService() {
  const { etcCards } = useAppStore()
  const [selectedCard, setSelectedCard] = useState(etcCards[0]?.id || '')
  const [amount, setAmount] = useState(500)

  const card = etcCards.find(c => c.id === selectedCard)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '绑定ETC卡', count: etcCards.length, icon: CreditCard, color: 'from-sky-500 to-indigo-600' },
          { label: '本月充值', count: '¥67,200', icon: Plus, color: 'from-emerald-500 to-teal-600' },
          { label: '本月通行', count: '¥34,580', icon: Receipt, color: 'from-primary-500 to-violet-600' },
          { label: '累计发票', count: 128, icon: FileText, color: 'from-amber-500 to-orange-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-base p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate2-400 font-medium">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate2-800 tracking-tight">{s.count}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 卡片网格 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" />
                我的 ETC 卡片
              </h3>
              <button className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                绑定新卡
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {etcCards.map((c) => {
                const active = selectedCard === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCard(c.id)}
                    className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all ${
                      active ? 'ring-4 ring-sky-200 shadow-xl scale-[1.01]' : 'ring-1 ring-slate2-100 hover:shadow-lg'
                    } ${
                      c.status === 'frozen'
                        ? 'bg-gradient-to-br from-slate2-200 to-slate2-300'
                        : 'bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 text-white'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className={`text-[10px] mb-0.5 ${c.status === 'frozen' ? 'text-slate2-500' : 'opacity-70'}`}>ETC · 全国通行</div>
                          <div className={`text-lg font-mono font-bold tracking-widest ${c.status === 'frozen' ? 'text-slate2-500' : ''}`}>
                            {c.cardNo}
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-lg ${
                          c.status === 'frozen' ? 'bg-slate2-400/40' : 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md'
                        }`} />
                      </div>
                      <div className="mb-4">
                        <div className={`text-[10px] mb-0.5 ${c.status === 'frozen' ? 'text-slate2-500' : 'opacity-70'}`}>绑定车牌</div>
                        <div className={`text-sm font-bold font-mono ${c.status === 'frozen' ? 'text-slate2-500' : ''}`}>
                          {c.vehiclePlate}
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className={`text-[10px] mb-0.5 ${c.status === 'frozen' ? 'text-slate2-500' : 'opacity-70'}`}>
                            {c.status === 'frozen' ? '账户状态' : '账户余额'}
                          </div>
                          {c.status === 'frozen' ? (
                            <span className="text-sm font-bold text-slate2-500">已冻结</span>
                          ) : (
                            <div className="text-2xl font-extrabold font-mono">¥{c.balance.toLocaleString()}</div>
                          )}
                        </div>
                        {c.status === 'active' && (
                          <div className="text-right text-[10px]">
                            <div className="opacity-70 mb-0.5">本月消费</div>
                            <div className="font-mono font-bold">¥{c.monthConsumption.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {active && c.status === 'active' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 充值记录 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-primary-500" />
                充值与消费记录
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate2-400" />
                  <input placeholder="搜索记录..." className="w-44 h-8 pl-9 pr-3 rounded-lg bg-slate2-50 border border-transparent text-[11px] focus:outline-none focus:bg-white focus:border-primary-300 transition-all" />
                </div>
                <button className="h-8 px-3 rounded-lg bg-slate2-50 text-slate2-500 text-[11px] hover:bg-white hover:border-slate2-200 border border-transparent transition-all flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  导出
                </button>
                <button className="h-8 px-3 rounded-lg bg-primary-50 text-primary-600 text-[11px] hover:bg-primary-100 transition-colors flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  发票
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate2-50 max-h-[380px] overflow-y-auto">
              {[
                { t: '2026-06-20 15:30', type: '充值', amount: '+5,000', bal: '23,650.50', status: 'success', way: '企业支付宝' },
                { t: '2026-06-19 08:12', type: '通行费-广深高速', amount: '-168.50', bal: '18,650.50', status: 'success', way: '粤B·D12345' },
                { t: '2026-06-18 10:45', type: '充值', amount: '+10,000', bal: '18,819.00', status: 'success', way: '对公转账' },
                { t: '2026-06-17 16:20', type: '通行费-京港澳', amount: '-580.00', bal: '8,819.00', status: 'success', way: '粤B·D12345' },
                { t: '2026-06-16 09:05', type: '通行费-武深高速', amount: '-245.80', bal: '9,399.00', status: 'success', way: '粤B·D12345' },
                { t: '2026-06-15 14:30', type: '充值', amount: '+8,000', bal: '9,644.80', status: 'success', way: '微信企业版' },
              ].map((r, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate2-50/50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.type.startsWith('充值') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {r.type.startsWith('充值') ? <Plus className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate2-800">{r.type}</span>
                      <span className="text-[10px] text-slate2-400 bg-slate2-50 px-1.5 py-0.5 rounded">{r.way}</span>
                      {r.status === 'success' && <span className="text-[10px] text-success-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />成功</span>}
                    </div>
                    <div className="text-[11px] text-slate2-400 mt-0.5 font-mono">{r.t}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-extrabold font-mono ${r.type.startsWith('充值') ? 'text-emerald-600' : 'text-slate2-800'}`}>
                      {r.amount}
                    </div>
                    <div className="text-[10px] text-slate2-400 mt-0.5">余额 ¥{r.bal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧充值面板 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {card && card.status === 'active' && (
            <div className="card-base overflow-hidden card-hover sticky top-6">
              <div className="px-5 py-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-medium opacity-90">即时到账 · 10秒内</span>
                  </div>
                  <div className="text-lg font-bold">在线充值 ETC</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    充值卡: <span className="font-mono">{card.cardNo.slice(-4)}</span> · {card.vehiclePlate}
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold text-slate2-600 mb-2">选择充值金额</div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[100, 300, 500, 1000, 3000, 5000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        className={`py-2.5 rounded-xl font-bold transition-all ${
                          amount === v
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                            : 'bg-slate2-50 text-slate2-700 hover:bg-sky-50 hover:text-sky-600 border border-transparent hover:border-sky-200'
                        }`}
                      >
                        ¥{v}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate2-400">¥</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-12 pl-9 pr-4 rounded-xl bg-white border-2 border-slate2-200 text-xl font-mono font-bold focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </div>
                </div>

                {amount >= 1000 && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-700 leading-relaxed">
                        充值满 <strong>¥1000</strong> 享赠 <strong>¥{Math.floor(amount * 0.005)}</strong> 通行券
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate2-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate2-500">当前余额</span>
                    <span className="font-mono font-bold text-slate2-700">¥{card.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate2-500">充值金额</span>
                    <span className="font-mono font-bold text-sky-600">¥{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate2-500">赠送金额</span>
                    <span className="font-mono font-bold text-emerald-600">+ ¥{amount >= 1000 ? Math.floor(amount * 0.005) : 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate2-100">
                    <span className="text-sm font-bold text-slate2-800">充值后余额</span>
                    <span className="text-lg font-extrabold font-mono text-slate2-800">
                      ¥{(card.balance + amount + (amount >= 1000 ? Math.floor(amount * 0.005) : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 text-white font-bold hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  确认充值 ¥{amount.toLocaleString()}
                </button>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-lg bg-slate2-50 text-slate2-500 flex flex-col items-center gap-0.5">
                    <Shield className="w-4 h-4" />
                    资金安全
                  </div>
                  <div className="p-2 rounded-lg bg-slate2-50 text-slate2-500 flex flex-col items-center gap-0.5">
                    <Zap className="w-4 h-4" />
                    即时到账
                  </div>
                  <div className="p-2 rounded-lg bg-slate2-50 text-slate2-500 flex flex-col items-center gap-0.5">
                    <Receipt className="w-4 h-4" />
                    电子发票
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
