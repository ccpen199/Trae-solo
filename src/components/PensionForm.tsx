import PensionIdentityTabs from './pension/PensionIdentityTabs'
import EmployeeForm from './pension/EmployeeForm'
import FlexibleForm from './pension/FlexibleForm'
import ResidentForm from './pension/ResidentForm'
import type { PensionIdentity, EmployeeFormData, FlexibleFormData, ResidentFormData } from './pension/types'

interface PensionFormProps {
  identity: PensionIdentity
  employeeForm: EmployeeFormData
  flexibleForm: FlexibleFormData
  residentForm: ResidentFormData
  onIdentityChange: (identity: PensionIdentity) => void
  onEmployeeFormChange: (data: EmployeeFormData) => void
  onFlexibleFormChange: (data: FlexibleFormData) => void
  onResidentFormChange: (data: ResidentFormData) => void
  onCalculate: () => void
  onReset: () => void
}

export default function PensionForm({
  identity,
  employeeForm,
  flexibleForm,
  residentForm,
  onIdentityChange,
  onEmployeeFormChange,
  onFlexibleFormChange,
  onResidentFormChange,
  onCalculate,
  onReset,
}: PensionFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#165DFF' }}>养老金计发模拟器</h1>
        <p className="mt-1 text-sm" style={{ color: '#86909C' }}>输入缴费参数，自动测算您的养老金待遇</p>
      </div>

      <PensionIdentityTabs activeIdentity={identity} onChange={onIdentityChange} />

      {identity === 'employee' && <EmployeeForm form={employeeForm} onChange={onEmployeeFormChange} />}
      {identity === 'flexible' && <FlexibleForm form={flexibleForm} onChange={onFlexibleFormChange} />}
      {identity === 'resident' && <ResidentForm form={residentForm} onChange={onResidentFormChange} />}

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
