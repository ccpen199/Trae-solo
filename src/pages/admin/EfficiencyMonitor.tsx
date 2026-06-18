import EnhancedMonitorStatsCards from '@/components/efficiency-monitor/EnhancedMonitorStatsCards'
import MultiDimensionAnalysis from '@/components/efficiency-monitor/MultiDimensionAnalysis'
import DurationDistribution from '@/components/efficiency-monitor/DurationDistribution'
import RejectClustering from '@/components/efficiency-monitor/RejectClustering'
import SatisfactionTracking from '@/components/efficiency-monitor/SatisfactionTracking'

export default function EfficiencyMonitor() {
  return (
    <div>
      <EnhancedMonitorStatsCards />

      <MultiDimensionAnalysis />

      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-6">
          <DurationDistribution />
        </div>
        <div className="col-span-6">
          <RejectClustering />
        </div>
      </div>

      <SatisfactionTracking />
    </div>
  )
}
