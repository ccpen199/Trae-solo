import { User, CalendarDays, Clock, TrendingUp, Wallet, Landmark } from 'lucide-react'

export interface PensionFormData {
  gender: 'male' | 'female'
  birthMonth: string
  retireAge: number
  paymentYears: number
  avgPaymentBase: number
  personalAccountBalance: number
  localAvgSalary: number
}

interface PensionFormProps {
  form: PensionFormData
  onChange: (data: PensionFormData) => void
  onCalculate: () => void
  onReset: () => void
}

const maleRetireAges = [60, 55, 50]
const femaleRetireAges = [55, 50, 45]

export default function PensionForm({ form, onChange, onCalculate, onReset }: PensionFormProps) {
  const retireAges = form.gender === 'male' ? maleRetireAges : femaleRetireAges

  const update = <K extends keyof PensionFormData>(key: K, value: PensionFormData[K]) => {
    if (key === 'gender') {
      const newGender = value as 'male' | 'female'
      const newAges = newGender === 'male' ? maleRetireAges : femaleRetireAges
      onChange({ ...form, gender: newGender, retireAge: newAges[0] })
    } else {
      onChange({ ...form, [key]: value })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#165DFF' }}>养老金计发模拟器</h1>
        <p className="mt-1 text-sm" style={{ color: '#86909C' }}>输入缴费参数，自动测算您的养老金待遇</p>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <User size={15} /> 性别
        </label>
        <div className="flex gap-3">
          {(['male', 'female'] as const).map((g) => (
            <label
              key={g}
              className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm transition-colors"
              style={{
                borderColor: form.gender === g ? '#165DFF' : '#E5E6EB',
                backgroundColor: form.gender === g ? '#E8F0FF' : '#fff',
                color: form.gender === g ? '#165DFF' : '#4E5969',
              }}
            >
              <input
                type="radio"
                name="gender"
                value={g}
                checked={form.gender === g}
                onChange={() => update('gender', g)}
                className="accent-[#165DFF]"
              />
              {g === 'male' ? '男' : '女'}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <CalendarDays size={15} /> 出生年月
        </label>
        <input
          type="month"
          value={form.birthMonth}
          onChange={(e) => update('birthMonth', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <Clock size={15} /> 退休年龄
        </label>
        <select
          value={form.retireAge}
          onChange={(e) => update('retireAge', Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 bg-white"
          style={{ borderColor: '#E5E6EB' }}
        >
          {retireAges.map((age) => (
            <option key={age} value={age}>{age}岁</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <TrendingUp size={15} /> 缴费年限（年）
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={45}
            value={form.paymentYears}
            onChange={(e) => update('paymentYears', Number(e.target.value))}
            className="flex-1 accent-[#165DFF]"
          />
          <input
            type="number"
            min={1}
            max={45}
            value={form.paymentYears}
            onChange={(e) => {
              const v = Math.min(45, Math.max(1, Number(e.target.value) || 1))
              update('paymentYears', v)
            }}
            className="w-16 px-2 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
            style={{ borderColor: '#E5E6EB' }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <Wallet size={15} /> 月均缴费基数（元）
        </label>
        <input
          type="number"
          min={3000}
          max={30000}
          step={100}
          value={form.avgPaymentBase}
          onChange={(e) => update('avgPaymentBase', Number(e.target.value) || 3000)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
          placeholder="3000-30000"
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <Landmark size={15} /> 个人账户余额（元）
        </label>
        <input
          type="number"
          value={form.personalAccountBalance || ''}
          onChange={(e) => update('personalAccountBalance', Number(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
          placeholder="请输入个人账户余额"
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <Landmark size={15} /> 当地上年度社平工资（元）
        </label>
        <input
          type="number"
          value={form.localAvgSalary}
          onChange={(e) => update('localAvgSalary', Number(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
          placeholder="默认8000"
        />
      </div>

      <button
        onClick={onCalculate}
        className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
        style={{ backgroundColor: '#165DFF' }}
      >
        开始测算
      </button>

      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-lg font-medium text-sm border transition-colors hover:bg-gray-50"
        style={{ borderColor: '#E5E6EB', color: '#4E5969' }}
      >
        重置
      </button>
    </div>
  )
}
