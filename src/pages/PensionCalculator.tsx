import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PensionForm from '../components/PensionForm'
import PensionResult from '../components/PensionResult'
import PensionComparisonChart from '../components/pension/PensionComparisonChart'
import OptimizationTips from '../components/pension/OptimizationTips'
import HistoryRecords from '../components/pension/HistoryRecords'
import type {
  PensionIdentity,
  EmployeeFormData,
  FlexibleFormData,
  ResidentFormData,
  PensionResultData,
  HistoryRecord,
  PensionFormData,
} from '../components/pension/types'
import {
  calcEmployeePension,
  calcFlexiblePension,
  calcResidentPension,
  generateChartComparison,
  generateOptimizationTips,
} from '../components/pension/calculator'

const defaultEmployeeForm: EmployeeFormData = {
  gender: 'male',
  birthMonth: '1970-01',
  retireAge: 60,
  paymentYears: 25,
  avgPaymentBase: 8000,
  personalAccountBalance: 120000,
  localAvgSalary: 8000,
  deemedPaymentYears: 3,
  transitionalPension: 200,
}

const defaultFlexibleForm: FlexibleFormData = {
  gender: 'male',
  birthMonth: '1975-06',
  retireAge: 60,
  paymentYears: 20,
  paymentGrade: 80,
  personalAccountBalance: 80000,
  localAvgSalary: 8000,
}

const defaultResidentForm: ResidentFormData = {
  gender: 'male',
  birthMonth: '1965-03',
  receiveAge: 60,
  paymentYears: 15,
  annualPaymentGrade: 2000,
  governmentSubsidy: 200,
  personalAccountBalance: 45000,
  basicPensionStandard: 238,
}

export default function PensionCalculator() {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState<PensionIdentity>('employee')
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(defaultEmployeeForm)
  const [flexibleForm, setFlexibleForm] = useState<FlexibleFormData>(defaultFlexibleForm)
  const [residentForm, setResidentForm] = useState<ResidentFormData>(defaultResidentForm)
  const [result, setResult] = useState<PensionResultData | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [comparisonData, setComparisonData] = useState<{ name: string; 基础养老金: number; 个人账户: number; 总养老金: number }[]>([])
  const [tips, setTips] = useState<string[]>([])

  const handleCalculate = () => {
    let calcResult: PensionResultData
    let currentForm: PensionFormData
    let avgSalary: number

    if (identity === 'employee') {
      calcResult = calcEmployeePension(employeeForm)
      currentForm = employeeForm
      avgSalary = employeeForm.localAvgSalary
    } else if (identity === 'flexible') {
      calcResult = calcFlexiblePension(flexibleForm)
      currentForm = flexibleForm
      avgSalary = flexibleForm.localAvgSalary
    } else {
      calcResult = calcResidentPension(residentForm)
      currentForm = residentForm
      avgSalary = 8000
    }

    setResult(calcResult)
    setComparisonData(generateChartComparison(identity, currentForm, avgSalary))
    setTips(generateOptimizationTips(identity, currentForm, calcResult))

    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      identity,
      timestamp: Date.now(),
      formData: currentForm,
      result: calcResult,
    }
    setHistory((prev) => [newRecord, ...prev].slice(0, 10))
  }

  const handleReset = () => {
    if (identity === 'employee') setEmployeeForm(defaultEmployeeForm)
    if (identity === 'flexible') setFlexibleForm(defaultFlexibleForm)
    if (identity === 'resident') setResidentForm(defaultResidentForm)
    setResult(null)
    setComparisonData([])
    setTips([])
  }

  const handleLoadRecord = (record: HistoryRecord) => {
    setIdentity(record.identity)
    if (record.identity === 'employee') {
      setEmployeeForm(record.formData as EmployeeFormData)
    } else if (record.identity === 'flexible') {
      setFlexibleForm(record.formData as FlexibleFormData)
    } else {
      setResidentForm(record.formData as ResidentFormData)
    }
    setResult(record.result)
    const avgSalary = (record.formData as EmployeeFormData | FlexibleFormData).localAvgSalary ?? 8000
    setComparisonData(generateChartComparison(record.identity, record.formData, avgSalary))
    setTips(generateOptimizationTips(record.identity, record.formData, record.result))
  }

  const recentHistory = history.slice(0, 3)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm mb-5 transition-colors hover:opacity-80"
          style={{ color: '#4E5969' }}
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1D2129' }}>
            养老金计发模拟器
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#86909C' }}>
            根据个人缴费情况，科学测算退休后养老金待遇水平
          </p>
        </div>

        <div className="grid grid-cols-1 lg:gap-6 lg:flex lg:flex-row">
          <div className="lg:w-[48%] shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-4">
              <PensionForm
                identity={identity}
                employeeForm={employeeForm}
                flexibleForm={flexibleForm}
                residentForm={residentForm}
                onIdentityChange={setIdentity}
                onEmployeeFormChange={setEmployeeForm}
                onFlexibleFormChange={setFlexibleForm}
                onResidentFormChange={setResidentForm}
                onCalculate={handleCalculate}
                onReset={handleReset}
              />
            </div>
          </div>

          <div className="lg:w-[52%] shrink-0 mt-6 lg:mt-0 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
              <PensionResult result={result} />
            </div>

            {result && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <PensionComparisonChart data={comparisonData} />
                  <OptimizationTips tips={tips} />
                </div>

                <HistoryRecords records={recentHistory} onLoad={handleLoadRecord} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
