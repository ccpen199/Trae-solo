import { useState } from 'react'
import PensionForm, { type PensionFormData } from '../components/PensionForm'
import PensionResult, { type PensionResultData, calculatePension } from '../components/PensionResult'

const defaultForm: PensionFormData = {
  gender: 'male',
  birthMonth: '',
  retireAge: 60,
  paymentYears: 15,
  avgPaymentBase: 8000,
  personalAccountBalance: 50000,
  localAvgSalary: 8000,
}

export default function PensionCalculator() {
  const [form, setForm] = useState<PensionFormData>(defaultForm)
  const [result, setResult] = useState<PensionResultData | null>(null)

  const handleCalculate = () => {
    const r = calculatePension(
      form.avgPaymentBase,
      form.localAvgSalary,
      form.paymentYears,
      form.personalAccountBalance,
      form.retireAge
    )
    setResult(r)
  }

  const handleReset = () => {
    setForm(defaultForm)
    setResult(null)
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <PensionForm form={form} onChange={setForm} onCalculate={handleCalculate} onReset={handleReset} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <PensionResult result={result} />
        </div>
      </div>
    </div>
  )
}
