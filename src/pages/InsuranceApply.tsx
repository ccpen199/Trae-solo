import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import {
  Shield, CheckCircle2, FileSpreadsheet, Calculator, Truck, Package,
  MapPin, CalendarClock, ChevronRight, CreditCard, FileCheck, Sparkles,
  AlertCircle, ArrowRight, CircleDot, Circle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const types = [
  { key: 'basic', name: '基本险', desc: '自然灾害、意外事故、雨淋', rate: 0.08, color: 'from-slate2-500 to-slate2-600' },
  { key: 'comprehensive', name: '综合险', desc: '基本险+破损+失窃+雨淋', rate: 0.12, color: 'from-violet-500 to-indigo-600' },
  { key: 'all_risk', name: '一切险', desc: '综合险+温控异常+延误', rate: 0.18, color: 'from-[#C8102E] to-red-600' },
] as const

export default function InsuranceApply() {
  const navigate = useNavigate()
  const { cargoOrders, addCargoOrder } = useAppStore()
  const [step, setStep] = useState(1)
  const [orderId, setOrderId] = useState(cargoOrders[0]?.id || '')
  const [type, setType] = useState<typeof types[number]['key']>('comprehensive')
  const [cargoValue, setCargoValue] = useState(cargoOrders[0]?.declaredValue || 1000000)
  const [weight, setWeight] = useState(cargoOrders[0]?.weight || 10)
  const [deductible, setDeductible] = useState(2000)

  const order = cargoOrders.find((o) => o.id === orderId)

  useEffect(() => {
    if (order) {
      setCargoValue(order.declaredValue)
      setWeight(order.weight)
    }
  }, [orderId])

  const selType = types.find((t) => t.key === type)!
  const basePremium = (cargoValue * selType.rate) / 1000
  const weightSurcharge = Math.max(0, (weight - 5) * 80)
  const totalPremium = Math.round(basePremium + weightSurcharge)
  const coverageAmount = Math.round(cargoValue * (type === 'all_risk' ? 1.1 : 1))

  const submit = () => {
    alert('投保成功！电子保单已生成，请前往保单管理查看。')
    navigate('/insurance/policies')
  }

  return (
    <div className="space-y-6">
      {/* 步骤条 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { n: 1, t: '选择运单' },
            { n: 2, t: '填写信息' },
            { n: 3, t: '选择险种' },
            { n: 4, t: '确认支付' },
          ].map((s, idx, arr) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s.n
                    ? 'bg-gradient-to-br from-[#C8102E] to-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-slate2-100 text-slate2-400'
                }`}>
                  {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                </div>
                <span className={`mt-2 text-xs font-medium ${step >= s.n ? 'text-slate2-800' : 'text-slate2-400'}`}>{s.t}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`w-16 md:w-24 h-0.5 mx-2 md:mx-4 ${step > s.n ? 'bg-gradient-to-r from-[#C8102E] to-violet-500' : 'bg-slate2-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 步骤1: 选择关联运单 */}
          {step === 1 && (
            <div className="card-base p-6 animate-fadeInUp">
              <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#C8102E]" />
                选择需要投保的货源订单
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {cargoOrders.filter(o => ['published', 'assigned', 'in_transit'].includes(o.status)).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOrderId(o.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      orderId === o.id
                        ? 'border-[#C8102E]/40 bg-gradient-to-r from-red-50 to-transparent shadow-sm'
                        : 'border-transparent bg-slate2-50/50 hover:border-slate2-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${orderId === o.id ? 'text-[#C8102E]' : 'text-slate2-300'}`}>
                          {orderId === o.id ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-slate2-700">{o.orderNo}</span>
                            {o.erpOrderNo && <span className="text-[10px] text-success-600 bg-success-50 px-1.5 py-0.5 rounded">ERP: {o.erpOrderNo}</span>}
                          </div>
                          <div className="text-sm font-semibold text-slate2-800 mb-1">{o.cargoName}</div>
                          <div className="text-[11px] text-slate2-500 flex items-center gap-2">
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{o.origin.city} → {o.destination.city}</span>
                            <span>·</span>
                            <span>{o.weight}吨 · {o.volume}m³ · {o.quantity}件</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate2-400 mb-0.5">申报价值</div>
                        <div className="text-lg font-bold font-mono text-[#C8102E]">¥{(o.declaredValue / 10000).toFixed(0)}万</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 步骤2: 填写信息 */}
          {step === 2 && order && (
            <div className="card-base p-6 space-y-5 animate-fadeInUp">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                货物投保信息
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">货物名称</label>
                  <input defaultValue={order.cargoName} className="w-full h-11 px-3.5 rounded-xl bg-slate2-50 border border-slate2-100 text-sm focus:outline-none focus:bg-white focus:border-[#C8102E]/40 focus:ring-2 focus:ring-red-50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">货物类型</label>
                  <input defaultValue={order.cargoType} className="w-full h-11 px-3.5 rounded-xl bg-slate2-50 border border-slate2-100 text-sm focus:outline-none focus:bg-white focus:border-[#C8102E]/40 focus:ring-2 focus:ring-red-50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">申报价值 (元)</label>
                  <input
                    type="number"
                    value={cargoValue}
                    onChange={(e) => setCargoValue(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate2-200 text-sm font-mono font-bold focus:outline-none focus:border-[#C8102E]/40 focus:ring-2 focus:ring-red-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">货物重量 (吨)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate2-200 text-sm font-mono focus:outline-none focus:border-[#C8102E]/40 focus:ring-2 focus:ring-red-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">运输路线</label>
                  <input
                    defaultValue={`${order.origin.province}${order.origin.city} → ${order.destination.province}${order.destination.city}`}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate2-50 border border-slate2-100 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">保险期限</label>
                  <div className="flex items-center gap-2">
                    <input type="date" defaultValue={order.pickupTime.slice(0, 10)} className="flex-1 h-11 px-3 rounded-xl bg-slate2-50 border border-slate2-100 text-xs font-mono" />
                    <ArrowRight className="w-4 h-4 text-slate2-300" />
                    <input type="date" defaultValue={order.deliveryTime.slice(0, 10)} className="flex-1 h-11 px-3 rounded-xl bg-slate2-50 border border-slate2-100 text-xs font-mono" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-blue-700 leading-relaxed">
                    <strong>温馨提示：</strong>请准确填写货物价值，不足额投保将按比例赔付；超额投保部分无效。
                    货物价值超过 500 万元需人工核保，请联系 95518。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤3: 选择险种 */}
          {step === 3 && (
            <div className="card-base p-6 space-y-5 animate-fadeInUp">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C8102E]" />
                选择投保险种方案
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {types.map((t) => {
                  const active = type === t.key
                  const premium = Math.round(cargoValue * t.rate / 1000 + Math.max(0, (weight - 5) * 80))
                  return (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-[#C8102E]/40 shadow-xl scale-[1.02] ring-4 ring-red-50'
                          : 'border-slate2-100 hover:border-slate2-200 hover:shadow-md'
                      }`}
                    >
                      {t.key === 'all_risk' && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#C8102E] to-red-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> 推荐
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate2-800 mb-1">{t.name}</div>
                      <div className="text-[11px] text-slate2-500 mb-4 leading-relaxed">{t.desc}</div>
                      <div className="pt-3 border-t border-slate2-100">
                        <div className="text-[10px] text-slate2-400 mb-0.5">费率</div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate2-700">{t.rate}‰</span>
                          <span className="text-xl font-extrabold font-mono text-[#C8102E]">¥{premium}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 免赔额选择 */}
              <div className="p-5 rounded-xl bg-slate2-50/60 border border-slate2-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate2-800">绝对免赔额</div>
                    <div className="text-[11px] text-slate2-500 mt-0.5">选择免赔额可调整保费高低</div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#C8102E]">¥ {deductible}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 2000, 5000, 10000].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeductible(d)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        deductible === d
                          ? 'bg-gradient-to-br from-[#C8102E] to-red-600 text-white shadow-md'
                          : 'bg-white border border-slate2-200 text-slate2-600 hover:border-[#C8102E]/30'
                      }`}
                    >
                      ¥{d.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 步骤4: 确认支付 */}
          {step === 4 && order && (
            <div className="card-base p-6 space-y-5 animate-fadeInUp">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-success-50 to-transparent border border-success-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success-400 to-success-600 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-lg font-bold text-success-700">投保信息校验通过</div>
                  <div className="text-xs text-slate2-500 mt-0.5">请确认以下信息，无误后完成支付即可生成电子保单</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 text-sm">
                <div className="space-y-3 p-4 rounded-xl bg-slate2-50/60">
                  <div className="text-xs font-bold text-slate2-500 uppercase tracking-wider mb-2">关联订单</div>
                  <Row k="订单号" v={<span className="font-mono">{order.orderNo}</span>} />
                  <Row k="货物名称" v={order.cargoName} />
                  <Row k="申报价值" v={<span className="font-mono font-bold text-slate2-800">¥{cargoValue.toLocaleString()}</span>} />
                  <Row k="运输路线" v={`${order.origin.city} → ${order.destination.city}`} />
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-slate2-50/60">
                  <div className="text-xs font-bold text-slate2-500 uppercase tracking-wider mb-2">保险方案</div>
                  <Row k="投保险种" v={<span className={`px-2 py-0.5 rounded bg-gradient-to-br ${selType.color} text-white text-[11px] font-bold`}>{selType.name}</span>} />
                  <Row k="适用费率" v={<span className="font-mono text-[#C8102E] font-bold">{selType.rate}‰</span>} />
                  <Row k="绝对免赔" v={<span className="font-mono">¥{deductible.toLocaleString()}</span>} />
                  <Row k="保险金额" v={<span className="font-mono font-bold text-[#C8102E]">¥{coverageAmount.toLocaleString()}</span>} />
                </div>
              </div>

              <div className="pt-4">
                <div className="text-xs font-bold text-slate2-500 uppercase tracking-wider mb-3">选择支付方式</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: '企业对公', desc: '银行转账', icon: '🏦' },
                    { name: '企业支付宝', desc: '即时到账', icon: '💙' },
                    { name: '企业微信', desc: '即时到账', icon: '💚' },
                  ].map((p, i) => (
                    <button
                      key={p.name}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        i === 0 ? 'border-[#C8102E]/40 bg-red-50/50 shadow-sm' : 'border-slate2-100 hover:border-slate2-200'
                      }`}
                    >
                      <div className="text-2xl mb-1.5">{p.icon}</div>
                      <div className="text-sm font-bold text-slate2-800">{p.name}</div>
                      <div className="text-[10px] text-slate2-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <button
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl border border-slate2-200 text-slate2-600 text-sm font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← 上一步
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#C8102E] to-red-600 text-white font-bold hover:shadow-xl hover:shadow-red-500/30 transition-all"
              >
                下一步 <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-success-500 to-emerald-600 text-white font-bold hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                立即支付 ¥{totalPremium.toLocaleString()}
              </button>
            )}
          </div>
        </div>

        {/* 右侧保费面板 */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card-base overflow-hidden sticky top-6">
            <div className="px-5 py-4 bg-gradient-to-r from-[#C8102E] via-red-500 to-[#C8102E] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                  <Calculator className="w-6 h-6 text-yellow-200" />
                </div>
                <div>
                  <div className="text-xs opacity-80">实时保费估算</div>
                  <div className="text-[10px] opacity-70 mt-0.5">PICC 中国人保承保</div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate2-50 to-white border border-slate2-100 text-center">
                <div className="text-[11px] text-slate2-400 mb-1">应付保费</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold font-mono text-[#C8102E] tracking-tight">¥{totalPremium.toLocaleString()}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate2-100 text-[10px] text-slate2-400 flex items-center justify-center gap-3">
                  <span>含增值税专票</span>
                  <span className="w-1 h-1 rounded-full bg-slate2-300" />
                  <span className="text-success-600">比线下节省 18%</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <CalcRow k="货物申报价值" v={`¥${cargoValue.toLocaleString()}`} />
                <CalcRow k={`${selType.name}费率 (${selType.rate}‰)`} v={`¥${Math.round(basePremium).toLocaleString()}`} />
                <CalcRow k="吨位附加费" v={weightSurcharge > 0 ? `¥${weightSurcharge}` : '免费'} />
                <CalcRow k={`免赔额 (¥${deductible}) 优惠`} v={weight > 5 ? `- ¥${Math.round(deductible * 0.01)}` : '-'} accent />
              </div>

              <div className="pt-3 border-t border-slate2-100 space-y-2.5 text-xs">
                <CalcRow k="最高赔付金额" v={<span className="font-bold font-mono text-slate2-800">¥{coverageAmount.toLocaleString()}</span>} />
                <CalcRow k="保单生效时间" v={<span className="font-mono text-success-600">支付成功即时</span>} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate2-100 text-center">
                <div className="p-2 rounded-lg bg-slate2-50">
                  <FileCheck className="w-4 h-4 mx-auto mb-1 text-success-500" />
                  <div className="text-[9px] text-slate2-500">电子存证</div>
                </div>
                <div className="p-2 rounded-lg bg-slate2-50">
                  <Shield className="w-4 h-4 mx-auto mb-1 text-[#C8102E]" />
                  <div className="text-[9px] text-slate2-500">PICC承保</div>
                </div>
                <div className="p-2 rounded-lg bg-slate2-50">
                  <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 text-primary-500" />
                  <div className="text-[9px] text-slate2-500">即时出单</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate2-400">{k}</span>
      <span className="text-slate2-800 text-xs font-medium">{v}</span>
    </div>
  )
}

function CalcRow({ k, v, accent }: { k: string; v: any; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate2-500">{k}</span>
      <span className={`font-medium ${accent ? 'text-success-600' : 'text-slate2-700 font-mono'}`}>{v}</span>
    </div>
  )
}
