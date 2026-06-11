import { AlertTriangle, MapPin, TrendingUp, Shield } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { saturationData } from '@/data/mockData'

const alertConfig = {
  normal: { label: '正常', badge: 'badge-safe', barColor: 'bg-emerald-500' },
  warning: { label: '预警', badge: 'badge-warning', barColor: 'bg-amber-500' },
  critical: { label: '严重', badge: 'badge-danger', barColor: 'bg-red-500' },
}

const criticalRegions = saturationData.filter((r) => r.alert === 'critical')
const warningRegions = saturationData.filter((r) => r.alert === 'warning')

const suggestions = [
  { region: '上海', suggestion: '建议拓展周边城市（如嘉定、松江）建立新网点，分流核心区域压力' },
  { region: '温州', suggestion: '建议向台州、丽水等临近城市扩展，开发下沉市场' },
  { region: '杭州', suggestion: '建议加强临安、富阳等郊区覆盖，提升市场渗透率' },
  { region: '苏州', suggestion: '建议开发吴江、常熟等县级市场，分散区域竞争' },
]

export default function Saturation() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="饱和度预警" subtitle="区域市场饱和度实时监控与预警" />

      {(criticalRegions.length > 0 || warningRegions.length > 0) && (
        <div className="mb-6 space-y-3">
          {criticalRegions.map((r) => (
            <div
              key={r.region}
              className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3 animate-pulse-border"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  {r.region}区域饱和度达{r.saturation}%，已进入严重预警状态
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  当前经销商{r.dealers}家，剩余潜力仅{r.potential}%，建议尽快扩展新市场
                </p>
              </div>
              <span className={alertConfig.critical.badge}>{alertConfig.critical.label}</span>
            </div>
          ))}
          {warningRegions.map((r) => (
            <div
              key={r.region}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  {r.region}区域饱和度{r.saturation}%，需关注市场容量
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  当前经销商{r.dealers}家，剩余潜力{r.potential}%
                </p>
              </div>
              <span className={alertConfig.warning.badge}>{alertConfig.warning.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-800">区域饱和度总览</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-5 font-medium text-gray-600">区域</th>
                <th className="text-left py-3 px-5 font-medium text-gray-600">饱和度</th>
                <th className="text-left py-3 px-5 font-medium text-gray-600">经销商数</th>
                <th className="text-left py-3 px-5 font-medium text-gray-600">剩余潜力</th>
                <th className="text-left py-3 px-5 font-medium text-gray-600">预警等级</th>
              </tr>
            </thead>
            <tbody>
              {saturationData.map((item) => {
                const config = alertConfig[item.alert]
                return (
                  <tr key={item.region} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{item.region}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${config.barColor}`}
                            style={{ width: `${item.saturation}%` }}
                          />
                        </div>
                        <span className="text-gray-700 font-medium w-10">{item.saturation}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-600">{item.dealers}家</td>
                    <td className="py-3 px-5">
                      <span className={`font-medium ${item.potential < 20 ? 'text-red-600' : item.potential < 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.potential}%
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={config.badge}>{config.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-800">市场扩展建议</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => (
            <div key={item.region} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-emerald-500" />
                <span className="text-sm font-semibold text-gray-800">{item.region}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
