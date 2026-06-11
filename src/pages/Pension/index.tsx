import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockPensionEstimate } from '@/mock/data'

const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省', '四川省', '湖北省', '湖南省', '河南省']

export default function Pension() {
  const [retireAge, setRetireAge] = useState(60)
  const [baseAmount, setBaseAmount] = useState(12000)
  const [payYears, setPayYears] = useState(25)
  const [accountBalance, setAccountBalance] = useState('96000')
  const [province, setProvince] = useState('北京市')

  const data = mockPensionEstimate
  const monthlyIncrease = Math.round(data.monthlyPension * 0.037)
  const handleCalculate = () => {}

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">养老金测算</h1>
        <p className="text-sm text-gray-500 mt-1">模拟退休待遇，提前规划养老</p>
      </div>

      <div className="flex gap-6">
        <div className="w-[40%] shrink-0">
          <div className="gov-card p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退休年龄 <span className="text-gov-gold font-bold text-lg ml-2">{retireAge}</span>
              </label>
              <input
                type="range" min={55} max={65} value={retireAge}
                onChange={(e) => setRetireAge(Number(e.target.value))}
                className="w-full accent-gov-blue h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>55</span><span>65</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                月缴费基数 <span className="text-gov-gold font-bold text-lg ml-2">¥{baseAmount.toLocaleString()}</span>
              </label>
              <input
                type="range" min={3000} max={30000} step={500} value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                className="w-full accent-gov-blue h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>¥3,000</span><span>¥30,000</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                缴费年限 <span className="text-gov-gold font-bold text-lg ml-2">{payYears}年</span>
              </label>
              <input
                type="range" min={15} max={40} value={payYears}
                onChange={(e) => setPayYears(Number(e.target.value))}
                className="w-full accent-gov-blue h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>15年</span><span>40年</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">个人账户余额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                <input
                  type="text" value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors"
                  placeholder="请输入个人账户余额"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所在省份</label>
              <select
                value={province} onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors bg-white"
              >
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <button onClick={handleCalculate} className="gov-btn-primary w-full text-center py-3">
              开始测算
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="gov-card p-6 bg-gradient-to-br from-gov-blue to-gov-blue-dark text-white">
            <p className="text-sm opacity-80">预估月养老金</p>
            <p className="text-4xl font-bold mt-2">
              <span className="text-gov-gold-light">¥{data.monthlyPension.toLocaleString()}</span>
            </p>
            <p className="text-xs opacity-60 mt-2">基于当前参数估算，仅供参考</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="gov-card p-4 text-center">
              <p className="text-xs text-gray-500">替代率</p>
              <p className="text-2xl font-bold text-gov-blue mt-1">{(data.replacementRate * 100).toFixed(0)}%</p>
            </div>
            <div className="gov-card p-4 text-center">
              <p className="text-xs text-gray-500">累计缴费</p>
              <p className="text-2xl font-bold text-gov-blue mt-1">¥{data.totalContribution.toLocaleString()}</p>
            </div>
            <div className="gov-card p-4 text-center">
              <p className="text-xs text-gray-500">预计月增额</p>
              <p className="text-2xl font-bold text-gov-gold mt-1">¥{monthlyIncrease}</p>
            </div>
          </div>

          <div className="gov-card p-6">
            <h2 className="gov-section-title mb-4">退休后养老金增长趋势</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.projectedPension} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="pensionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `¥${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '月养老金']}
                    labelFormatter={(label: number) => `${label}年`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="monthlyAmount" stroke="#1B3A5C" strokeWidth={2.5} fill="url(#pensionGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
