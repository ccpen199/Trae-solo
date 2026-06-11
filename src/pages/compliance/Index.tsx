import { Shield, MessageSquareWarning, Banknote, MapPin, AlertTriangle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { speechAnalysisData, amlData, geofenceAlerts } from '@/data/mockData'

const totalConversations = speechAnalysisData.conversations.length
const violations = speechAnalysisData.violations.length
const highRiskCount = speechAnalysisData.violations.filter(v => v.severity === 'danger').length
const complianceRate = Math.round(((totalConversations - speechAnalysisData.conversations.filter(c => c.riskLevel === 'danger').length) / totalConversations) * 100)

const recentAlerts = [
  { id: 1, type: 'danger', message: '王五涉嫌拉人头话术，已触发高风险告警', time: '10分钟前', icon: <MessageSquareWarning size={16} /> },
  { id: 2, type: 'warning', message: '张三存在医疗功效宣称，需及时纠正', time: '2小时前', icon: <AlertTriangle size={16} /> },
  { id: 3, type: 'danger', message: '检测到王五大额提现异常，风险评分88', time: '3小时前', icon: <Banknote size={16} /> },
  { id: 4, type: 'warning', message: '赵明华进入军事管理区附近，触发地理围栏', time: '昨日 16:45', icon: <MapPin size={16} /> },
  { id: 5, type: 'warning', message: '张三跨区域活动，距授权区域580km', time: '昨日 14:32', icon: <MapPin size={16} /> },
]

const subModules = [
  { title: '话术分析', desc: 'AI智能检测违规话术与虚假宣传', icon: <MessageSquareWarning size={24} />, path: '/compliance/speech', color: 'bg-emerald-50 text-emerald-600' },
  { title: '反洗钱检查', desc: '大额交易监控与异常资金检测', icon: <Banknote size={24} />, path: '/compliance/aml', color: 'bg-amber-50 text-amber-600' },
  { title: '地理围栏', desc: '经销商活动范围监控与越界告警', icon: <MapPin size={24} />, path: '/compliance/geofence', color: 'bg-blue-50 text-blue-600' },
]

export default function ComplianceIndex() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="合规中心" subtitle="全方位合规监控与风险管理" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stagger-1 animate-fade-in-up">
          <StatCard
            title="分析对话总数"
            value={totalConversations}
            icon={<MessageSquareWarning size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
        </div>
        <div className="stagger-2 animate-fade-in-up">
          <StatCard
            title="违规发现数"
            value={violations}
            change={-15.3}
            icon={<AlertTriangle size={20} />}
            iconBg="bg-red-50 text-red-600"
          />
        </div>
        <div className="stagger-3 animate-fade-in-up">
          <StatCard
            title="高风险数量"
            value={highRiskCount}
            icon={<Shield size={20} />}
            iconBg="bg-amber-50 text-amber-600"
          />
        </div>
        <div className="stagger-4 animate-fade-in-up">
          <StatCard
            title="合规率"
            value={complianceRate}
            suffix="%"
            change={2.1}
            icon={<Shield size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-fade-in-up stagger-3">
          <h2 className="section-title">最近告警</h2>
          <div className="space-y-3">
            {recentAlerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.type === 'danger'
                    ? 'border-red-200 bg-red-50/50 animate-pulse-border'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >
                <div className={`mt-0.5 ${alert.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                </div>
                {alert.type === 'danger' && (
                  <span className="badge-danger shrink-0">高风险</span>
                )}
                {alert.type === 'warning' && (
                  <span className="badge-warning shrink-0">警告</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-fade-in-up stagger-4">
          <h2 className="section-title">子模块</h2>
          <div className="space-y-3">
            {subModules.map(mod => (
              <Link
                key={mod.path}
                to={mod.path}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color}`}>
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{mod.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
