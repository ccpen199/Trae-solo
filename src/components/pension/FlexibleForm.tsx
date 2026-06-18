import { User, CalendarDays, Clock, TrendingUp, Wallet, Landmark } from 'lucide-react'
import type { FlexibleFormData } from './types'
import { maleRetireAges, femaleRetireAges } from './types'

interface FlexibleFormProps {
  form: FlexibleFormData
  onChange: (data: FlexibleFormData) => void
}

export default function FlexibleForm({ form, onChange }: FlexibleFormProps) {
  const retireAges = form.gender === 'male' ? maleRetireAges : femaleRetireAges

  const update = <K extends keyof FlexibleFormData>(key: K, value: FlexibleFormData[K]) => {
    if (key === 'gender') {
      const newGender = value as 'male' | 'female'
      const newAges = newGender === 'male' ? maleRetireAges : femaleRetireAges
      onChange({ ...form, gender: newGender, retireAge: newAges[0] })
    } else {
      onChange({ ...form, [key]: value })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
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
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <CalendarDays size={15} /> 出生年月
        </label>
        <input
          type="month"
          value={form.birthMonth}
          onChange={(e) => update('birthMonth', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-gray-200"
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Clock size={15} /> 退休年龄
        </label>
        <select
          value={form.retireAge}
          onChange={(e) => update('retireAge', Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white border-gray-200"
        >
          {retireAges.map((age) => (
            <option key={age} value={age}>{age}岁</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <TrendingUp size={15} /> 缴费年限（年）
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={40}
            value={form.paymentYears}
            onChange={(e) => update('paymentYears', Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <input
            type="number"
            min={1}
            max={40}
            value={form.paymentYears}
            onChange={(e) => {
              const v = Math.min(40, Math.max(1, Number(e.target.value) || 1))
              update('paymentYears', v)
            }}
            className="w-16 px-2 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 border-gray-200"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span className="flex items-center gap-1.5">
            <Wallet size={15} /> 缴费档次
          </span>
          <span className="text-primary font-semibold">{form.paymentGrade}%</span>
        </label>
        <input
          type="range"
          min={60}
          max={300}
          step={10}
          value={form.paymentGrade}
          onChange={(e) => update('paymentGrade', Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>60%（最低）</span>
          <span>300%（最高）</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          月缴费基数约 ¥{(form.localAvgSalary * form.paymentGrade / 100).toLocaleString()}
        </p>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Landmark size={15} /> 个人账户余额（元）
        </label>
        <input
          type="number"
          value={form.personalAccountBalance || ''}
          onChange={(e) => update('personalAccountBalance', Number(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-gray-200"
          placeholder="请输入个人账户余额"
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Landmark size={15} /> 当地上年度社平工资（元）
        </label>
        <input
          type="number"
          value={form.localAvgSalary}
          onChange={(e) => update('localAvgSalary', Number(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-gray-200"
          placeholder="默认8000"
        />
      </div>
    </div>
  )
}
