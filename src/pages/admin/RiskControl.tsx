import { useState } from 'react'
import StatsCards from '@/components/risk/StatsCards'
import AlertList from '@/components/risk/AlertList'
import RuleManager from '@/components/risk/RuleManager'
import ProcessModal from '@/components/risk/ProcessModal'
import { mockAlerts, mockRules, type RiskAlert } from '@/components/risk/data'

export default function RiskControl() {
  const [alerts, setAlerts] = useState<RiskAlert[]>(mockAlerts)
  const [rules, setRules] = useState(mockRules)
  const [processingAlert, setProcessingAlert] = useState<RiskAlert | null>(null)

  const handleProcess = (alert: RiskAlert) => {
    setProcessingAlert(alert)
  }

  const handleIgnore = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ignored' as const } : a))
    )
  }

  const handleConfirmProcess = (id: string, _result: string, _note: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'processed' as const } : a))
    )
    setProcessingAlert(null)
  }

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <div className="-m-6">
      <div className="p-6">
        <StatsCards />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8">
            <AlertList alerts={alerts} onProcess={handleProcess} onIgnore={handleIgnore} />
          </div>
          <div className="col-span-4">
            <RuleManager rules={rules} onToggle={handleToggleRule} />
          </div>
        </div>
      </div>

      {processingAlert && (
        <ProcessModal
          alert={processingAlert}
          onClose={() => setProcessingAlert(null)}
          onConfirm={handleConfirmProcess}
        />
      )}
    </div>
  )
}
