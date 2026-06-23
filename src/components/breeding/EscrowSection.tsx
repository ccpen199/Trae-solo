import { useState } from 'react'
import { CreditCard, DollarSign, QrCode, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const escrowStatusMap: Record<string, { status: string; label: string }> = {
  pending: { status: 'warning', label: '待托管' },
  held: { status: 'success', label: '已托管' },
  released: { status: 'success', label: '已划转' },
  refunded: { status: 'danger', label: '已退款' },
}

interface Props {
  fee: number
  escrowStatus: string
  agreementStep: number
  onCreateEscrow: () => void
  processing: boolean
}

export default function EscrowSection({ fee, escrowStatus, agreementStep, onCreateEscrow, processing }: Props) {
  const [showMethods, setShowMethods] = useState(escrowStatus === 'pending' && agreementStep >= 1)
  const [selectedMethod, setSelectedMethod] = useState<'wechat' | 'alipay'>('wechat')
  const statusInfo = escrowStatusMap[escrowStatus] || { status: 'warning', label: '待托管' }
  const canCreate = agreementStep >= 1 && escrowStatus === 'pending'

  const timeline = [
    { label: '资金托管', done: escrowStatus !== 'pending', current: escrowStatus === 'pending' && agreementStep >= 1 },
    { label: '配种执行', done: escrowStatus === 'released' || escrowStatus === 'refunded', current: escrowStatus === 'held' },
    { label: '确认完成', done: escrowStatus === 'released', current: false },
    { label: '费用划转', done: escrowStatus === 'released', current: false },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 animate-fadeIn stagger-4">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        费用托管
      </h3>

      <div className="mb-6 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
        <p className="text-sm text-text-secondary mb-2">配种服务费用</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary">¥</span>
          <span className="text-4xl font-bold text-primary">{fee.toLocaleString()}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={statusInfo.status} label={statusInfo.label} size="md" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between relative">
          {timeline.map((step, i) => (
            <div key={i} className="flex flex-col items-center z-10 flex-1 last:flex-none">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step.done && 'bg-success text-white',
                  step.current && 'bg-primary text-white',
                  !step.done && !step.current && 'bg-stone-200 text-stone-400'
                )}
              >
                {step.done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs mt-2 text-center whitespace-nowrap',
                step.done && 'text-success font-medium',
                step.current && 'text-primary font-medium',
                !step.done && !step.current && 'text-stone-400'
              )}>
                {step.label}
              </span>
            </div>
          ))}
          <div className="absolute top-4 left-0 right-12 h-0.5 bg-stone-200 -z-0" />
        </div>
      </div>

      {escrowStatus === 'pending' && (
        <>
          {!canCreate ? (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">暂不可托管</p>
                <p className="text-xs text-text-secondary mt-1">请先完成协议签署后再进行费用托管</p>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowMethods(!showMethods)}
                className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                托管费用
              </button>

              {showMethods && (
                <div className="mt-4 p-4 bg-stone-50 rounded-xl animate-fadeIn space-y-3">
                  <p className="text-sm font-medium text-text-primary mb-2">选择支付方式</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setSelectedMethod('wechat')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition text-center',
                        selectedMethod === 'wechat' ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-primary/50'
                      )}
                    >
                      <QrCode className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium text-text-primary">微信支付</p>
                    </div>
                    <div
                      onClick={() => setSelectedMethod('alipay')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition text-center',
                        selectedMethod === 'alipay' ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-primary/50'
                      )}
                    >
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium text-text-primary">支付宝</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">配种费用</span>
                      <span className="text-text-primary">¥{fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">平台服务费 (5%)</span>
                      <span className="text-text-primary">¥{(fee * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-stone-200">
                      <span className="text-text-primary">合计托管</span>
                      <span className="text-primary">¥{(fee * 1.05).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={onCreateEscrow}
                    disabled={processing}
                    className="w-full py-3 bg-secondary text-white font-medium rounded-xl hover:bg-secondary-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4" />
                    确认托管 ¥{(fee * 1.05).toLocaleString()}
                  </button>
                  <div className="flex items-start gap-2 text-xs text-text-secondary pt-2">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>资金由平台第三方托管，配种完成确认后自动划转，安全有保障</p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {escrowStatus === 'held' && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-success">资金已安全托管</span>
          </div>
          <p className="text-xs text-text-secondary">
            款项已由平台第三方账户托管，配种完成双方确认后将自动划转至配种方账户
          </p>
        </div>
      )}

      {escrowStatus === 'released' && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-success">费用已划转完成</span>
          </div>
          <p className="text-xs text-text-secondary">
            配种服务已完成，费用 ¥{fee.toLocaleString()} 已划转至配种方账户
          </p>
        </div>
      )}
    </div>
  )
}
