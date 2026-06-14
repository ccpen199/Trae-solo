import { useState } from 'react'
import {
  FilePlus,
  Unlock,
  Wifi,
  BellRing,
  FileCheck,
  ShieldAlert,
  CreditCard,
  Bell,
  Smartphone,
  X,
} from 'lucide-react'
import { lifecycleEvents, citizenCodes } from '../data/mockData'

const typeConfig: Record<string, { icon: typeof FileCheck; color: string; bg: string; dot: string; label: string }> = {
  application: { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500', label: '申领' },
  loss_report: { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500', label: '挂失' },
  nfc_recharge: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500', label: '充值' },
  balance_notification: { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-100', dot: 'bg-purple-500', label: '提醒' },
}

const statusMap: Record<string, { dot: string; label: string }> = {
  active: { dot: 'bg-green-500', label: '正常' },
  inactive: { dot: 'bg-gray-400', label: '未激活' },
  expired: { dot: 'bg-red-500', label: '已过期' },
}

const cardGradients = [
  'from-blue-500 to-cyan-400',
  'from-orange-500 to-amber-400',
  'from-emerald-500 to-teal-400',
  'from-purple-500 to-violet-400',
]

export default function CardLifecycle() {
  const [nfcModalOpen, setNfcModalOpen] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')

  const [notifies, setNotifies] = useState({
    lowBalance: true,
    rechargeSuccess: true,
    consume: false,
    monthlyBill: true,
  })
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(50)

  const presetAmounts = [50, 100, 200, 500]
  const nfcRechargeHistory = lifecycleEvents.filter((e) => e.type === 'nfc_recharge').slice(0, 3)

  const actionCards = [
    {
      icon: FilePlus,
      title: '在线申领',
      desc: '申领新市民码',
      button: '立即申领',
      borderColor: 'border-t-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      btnClass: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Unlock,
      title: '挂失解挂',
      desc: '挂失或解除挂失',
      button: '挂失/解挂',
      borderColor: 'border-t-orange-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      btnClass: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      icon: Wifi,
      title: 'NFC充值',
      desc: 'NFC近场充值',
      button: '立即充值',
      borderColor: 'border-t-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      btnClass: 'bg-green-500 hover:bg-green-600',
      onClick: () => setNfcModalOpen(true),
    },
    {
      icon: BellRing,
      title: '余额通知',
      desc: '余额变动实时提醒',
      button: '设置通知',
      borderColor: 'border-t-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      btnClass: 'bg-purple-500 hover:bg-purple-600',
    },
  ]

  const toggleNotify = (key: keyof typeof notifies) => {
    setNotifies((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {/* 卡片操作面板 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">卡片操作</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actionCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-lg border border-border bg-white p-5 shadow-sm ${card.borderColor} border-t-4`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <h3 className="mb-1 text-base font-semibold text-text-primary">{card.title}</h3>
              <p className="mb-4 text-sm text-text-secondary">{card.desc}</p>
              <button
                type="button"
                onClick={card.onClick}
                className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${card.btnClass}`}
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* NFC充值模拟面板 */}
      {nfcModalOpen && (
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">NFC充值</h2>
            <button
              type="button"
              onClick={() => setNfcModalOpen(false)}
              className="rounded-md p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          <div className="mb-6 flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br from-green-50 to-cyan-50 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-green-700">请将市民卡贴近手机NFC感应区域</p>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 animate-pulse text-green-500" />
              <span className="text-xs font-medium text-green-600">NFC感应中...</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-3 text-sm font-medium text-text-primary">选择充值金额</p>
            <div className="mb-3 grid grid-cols-4 gap-3">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt)
                    setCustomAmount('')
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    selectedAmount === amt
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-border bg-white text-text-primary hover:border-green-300'
                  }`}
                >
                  ¥{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="或输入自定义金额"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedAmount(null)
              }}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-green-500"
            />
          </div>

          <button
            type="button"
            className="mb-6 w-full rounded-lg bg-green-600 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            确认充值
          </button>

          <div>
            <p className="mb-3 text-sm font-medium text-text-primary">最近充值记录</p>
            <div className="space-y-3">
              {nfcRechargeHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{record.description}</p>
                      <p className="text-xs text-text-secondary">{record.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+¥{record.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 余额通知设置面板 */}
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-text-primary">余额通知设置</h2>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">余额不足提醒</p>
              <p className="mt-1 text-xs text-text-secondary">
                当余额低于 ¥{lowBalanceThreshold} 时发送提醒
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-text-secondary">¥10</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={lowBalanceThreshold}
                  onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-purple-500"
                />
                <span className="text-xs text-text-secondary">¥100</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleNotify('lowBalance')}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notifies.lowBalance ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifies.lowBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">充值成功提醒</p>
              <p className="mt-1 text-xs text-text-secondary">NFC充值成功后推送通知</p>
            </div>
            <button
              type="button"
              onClick={() => toggleNotify('rechargeSuccess')}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notifies.rechargeSuccess ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifies.rechargeSuccess ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">消费扣款提醒</p>
              <p className="mt-1 text-xs text-text-secondary">乘车消费时推送扣款通知</p>
            </div>
            <button
              type="button"
              onClick={() => toggleNotify('consume')}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notifies.consume ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifies.consume ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">月度账单提醒</p>
              <p className="mt-1 text-xs text-text-secondary">每月初推送上月消费账单</p>
            </div>
            <button
              type="button"
              onClick={() => toggleNotify('monthlyBill')}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notifies.monthlyBill ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifies.monthlyBill ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 生命周期时间线 */}
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-text-primary">生命周期时间线</h2>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border lg:block hidden" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border lg:hidden" />
          <div className="space-y-8">
            {lifecycleEvents.map((event, index) => {
              const config = typeConfig[event.type]
              const Icon = config.icon
              const isLeft = index % 2 === 0
              return (
                <div key={event.id} className="relative">
                  {/* 桌面端交替布局 */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
                    <div className={isLeft ? '' : 'order-3'}>
                      {isLeft && (
                        <div className="ml-auto max-w-xs rounded-lg border border-border bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: config.color.replace('text-', '') }}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-text-primary">{event.description}</p>
                          <p className="mt-1 text-xs text-text-secondary">{event.time}</p>
                          {event.amount != null && event.amount > 0 && (
                            <p className="mt-1 text-sm font-semibold text-green-600">
                              {event.type === 'nfc_recharge' ? '+' : '-'}¥{event.amount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`h-4 w-4 rounded-full border-2 border-white shadow ${config.dot}`} />
                    </div>

                    <div className={isLeft ? 'order-3' : ''}>
                      {!isLeft && (
                        <div className="max-w-xs rounded-lg border border-border bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <span className={`text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-text-primary">{event.description}</p>
                          <p className="mt-1 text-xs text-text-secondary">{event.time}</p>
                          {event.amount != null && event.amount > 0 && (
                            <p className="mt-1 text-sm font-semibold text-green-600">
                              {event.type === 'nfc_recharge' ? '+' : '-'}¥{event.amount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 移动端线性布局 */}
                  <div className="flex items-start gap-4 lg:hidden">
                    <div className="relative z-10 mt-1 flex shrink-0 flex-col items-center">
                      <div className={`h-4 w-4 rounded-full border-2 border-white shadow ${config.dot}`} />
                    </div>
                    <div className="flex-1 rounded-lg border border-border bg-gray-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{event.description}</p>
                      <p className="mt-1 text-xs text-text-secondary">{event.time}</p>
                      {event.amount != null && event.amount > 0 && (
                        <p className="mt-1 text-sm font-semibold text-green-600">
                          {event.type === 'nfc_recharge' ? '+' : '-'}¥{event.amount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 当前卡码状态 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">当前卡码状态</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {citizenCodes.map((card, idx) => {
            const st = statusMap[card.status]
            return (
              <div
                key={card.id}
                className="overflow-hidden rounded-xl shadow-sm"
              >
                <div className={`bg-gradient-to-br ${cardGradients[idx]} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold">{card.name}</p>
                      <p className="mt-1 font-mono text-xs opacity-80">{card.code}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1">
                      <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                      <span className="text-xs font-medium">{st.label}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs opacity-70">余额</p>
                      <p className="text-2xl font-bold">¥{card.balance.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-70">有效期至</p>
                      <p className="text-sm font-medium">{card.expiryDate}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border bg-white px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">市民码状态</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
