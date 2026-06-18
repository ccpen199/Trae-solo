import { useState } from 'react'
import StepIndicator from '@/components/insurance/StepIndicator'
import IdentityStep from '@/components/insurance/IdentityStep'
import QueryStep from '@/components/insurance/QueryStep'
import ResultStep from '@/components/insurance/ResultStep'

export default function InsuranceVerify() {
  const [step, setStep] = useState(1)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">个人参保状态核验</h1>
        <p className="text-sm text-gray-400 mt-1">对接全国社保联网接口，实时查询您的参保状态</p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 1 && <IdentityStep onVerified={() => setStep(2)} />}
      {step === 2 && <QueryStep onComplete={() => setStep(3)} />}
      {step === 3 && <ResultStep />}
    </div>
  )
}
