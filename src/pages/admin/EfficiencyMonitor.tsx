import MonitorStatsCards from '@/components/efficiency-monitor/MonitorStatsCards'
import TrendChart from '@/components/efficiency-monitor/TrendChart'
import BusinessPieChart from '@/components/efficiency-monitor/BusinessPieChart'
import RejectAnalysis from '@/components/efficiency-monitor/RejectAnalysis'

export default function EfficiencyMonitor() {
  return (
    <div>
      <MonitorStatsCards />

      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-7">
          <TrendChart />
        </div>
        <div className="col-span-5">
          <BusinessPieChart />
        </div>
      </div>

      <RejectAnalysis />
    </div>
  )
}
