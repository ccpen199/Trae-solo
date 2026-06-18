import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Info } from 'lucide-react'

export interface PensionResultData {
  monthlyTotal: number
  yearlyTotal: number
  basePension: number
  personalPension: number
  avgIndex: number
  paymentMonths: number
  retireAge: number
  paymentYears: number
  localAvgSalary: number
  avgPaymentBase: number
  personalAccountBalance: number
}

const PAYMENT_MONTHS_MAP: Record<number, number> = {
  60: 139,
  55: 170,
  50: 195,
  45: 216,
}

interface PensionResultProps {
  result: PensionResultData | null
}

export function calculatePension(
  avgPaymentBase: number,
  localAvgSalary: number,
  paymentYears: number,
  personalAccountBalance: number,
  retireAge: number
): PensionResultData {
  const avgIndex = avgPaymentBase / localAvgSalary
  const basePension = (localAvgSalary + localAvgSalary * avgIndex) / 2 * paymentYears * 0.01
  const paymentMonths = PAYMENT_MONTHS_MAP[retireAge] ?? 139
  const personalPension = personalAccountBalance / paymentMonths
  const monthlyTotal = basePension + personalPension
  const yearlyTotal = monthlyTotal * 12

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    personalPension: Math.round(personalPension * 100) / 100,
    avgIndex: Math.round(avgIndex * 1000) / 1000,
    paymentMonths,
    retireAge,
    paymentYears,
    localAvgSalary,
    avgPaymentBase,
    personalAccountBalance,
  }
}

function formatMoney(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PensionResult({ result }: PensionResultProps) {
  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4"
            style={{ color: '#86909C' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F2F3F5' }}
            >
              <Calculator size={28} style={{ color: '#86909C' }} />
            </div>
            <p className="text-sm">请输入左侧参数，点击开始测算</p>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: '#86909C' }}>月养老金总额</p>
              <p className="text-5xl font-bold mt-1" style={{ color: '#165DFF' }}>
                ¥{formatMoney(result.monthlyTotal)}
              </p>
              <p className="text-sm mt-2" style={{ color: '#86909C' }}>
                年养老金：¥{formatMoney(result.yearlyTotal)}
              </p>
            </div>

            <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: '#F7F8FA' }}>
              <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>养老金明细</h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#4E5969' }}>基础养老金</span>
                    <span className="font-semibold" style={{ color: '#165DFF' }}>¥{formatMoney(result.basePension)}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#86909C' }}>
                    = (社平工资 + 社平工资 × 平均缴费指数) / 2 × 缴费年限 × 1%
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>
                    = ({result.localAvgSalary} + {result.localAvgSalary} × {result.avgIndex}) / 2 × {result.paymentYears} × 1%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#4E5969' }}>个人账户养老金</span>
                    <span className="font-semibold" style={{ color: '#165DFF' }}>¥{formatMoney(result.personalPension)}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#86909C' }}>
                    = 个人账户余额 / 计发月数
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>
                    = {result.personalAccountBalance.toLocaleString()} / {result.paymentMonths}
                  </p>
                </div>

                <div className="rounded-lg p-3 border-2" style={{ borderColor: '#165DFF', backgroundColor: '#E8F0FF' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm" style={{ color: '#165DFF' }}>月养老金合计</span>
                    <span className="font-bold" style={{ color: '#165DFF' }}>¥{formatMoney(result.monthlyTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #E5E6EB' }}>
                <div className="flex justify-between text-xs" style={{ color: '#4E5969' }}>
                  <span>平均缴费指数</span>
                  <span>{result.avgIndex}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: '#4E5969' }}>
                  <span>计发月数（{result.retireAge}岁退休）</span>
                  <span>{result.paymentMonths}月</span>
                </div>
              </div>

              <div className="pt-2" style={{ borderTop: '1px solid #E5E6EB' }}>
                <h4 className="text-xs font-medium mb-2" style={{ color: '#4E5969' }}>计发月数对照表</h4>
                <div className="grid grid-cols-4 gap-2 text-xs text-center">
                  {Object.entries(PAYMENT_MONTHS_MAP).map(([age, months]) => (
                    <div
                      key={age}
                      className="rounded py-1.5"
                      style={{
                        backgroundColor: Number(age) === result.retireAge ? '#E8F0FF' : '#fff',
                        color: Number(age) === result.retireAge ? '#165DFF' : '#4E5969',
                      }}
                    >
                      {age}岁 / {months}月
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-1.5 px-1">
              <Info size={13} className="mt-0.5 shrink-0" style={{ color: '#86909C' }} />
              <p className="text-xs" style={{ color: '#86909C' }}>
                以上为模拟测算结果，实际待遇以经办机构核定为准
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
