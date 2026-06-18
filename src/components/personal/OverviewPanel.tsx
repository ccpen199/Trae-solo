import { User, MapPin, Calendar, Clock, FileText, Wallet, Shield, Heart, Briefcase, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'

const stats = [
  { label: '参保年限', value: '20年3个月', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
  { label: '待办事项', value: '2项', icon: Clock, color: 'text-danger', bg: 'bg-danger/10' },
  { label: '在办业务', value: '1项', icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
  { label: '本月待遇', value: '3200元', icon: Wallet, color: 'text-success', bg: 'bg-success/10' },
]

const insuranceStatus = [
  { type: '养老保险', status: '正常参保', icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
  { type: '医疗保险', status: '正常参保', icon: Heart, color: 'text-success', bg: 'bg-success/10' },
  { type: '失业保险', status: '正常参保', icon: Briefcase, color: 'text-warning', bg: 'bg-warning/10' },
]

const recentApplications = [
  { id: '1', title: '失业补贴申领', status: '审核中', date: '2026-06-15', statusColor: 'text-warning' },
  { id: '2', title: '医保个人账户查询', status: '已完成', date: '2026-06-10', statusColor: 'text-success' },
  { id: '3', title: '养老金资格认证', status: '已完成', date: '2026-06-05', statusColor: 'text-success' },
]

const policyRecommendations = [
  { id: '1', title: '关于2026年度企业职工基本养老保险缴费基数调整的通知', tag: '养老' },
  { id: '2', title: '职工基本医疗保险门诊共济保障机制实施细则', tag: '医疗' },
  { id: '3', title: '失业保险金申领条件及发放标准说明', tag: '失业' },
]

export default function OverviewPanel() {
  const { user } = useStore()

  const displayUser = user || {
    name: '张三',
    identityType: '企业职工',
    insuredLocation: '浙江省杭州市',
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">{displayUser.name}</div>
            <div className="flex items-center gap-3 mt-2 text-white/80">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">{displayUser.identityType}</span>
              <span className="flex items-center gap-1 text-sm">
                <MapPin size={14} />
                {displayUser.insuredLocation}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={24} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold text-gray-900">参保状态概览</h3>
          </div>
          <button className="text-sm text-primary flex items-center gap-1 hover:underline">
            查看详情
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {insuranceStatus.map((item) => (
            <div key={item.type} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <span className="font-medium text-gray-900">{item.type}</span>
              </div>
              <div className="text-sm text-success font-medium">{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">最近申请记录</h3>
            </div>
            <button className="text-sm text-primary flex items-center gap-1 hover:underline">
              更多
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentApplications.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.date}</div>
                </div>
                <span className={`text-xs font-medium ${item.statusColor}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">政策推荐</h3>
            </div>
            <button className="text-sm text-primary flex items-center gap-1 hover:underline">
              更多
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {policyRecommendations.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex-shrink-0">{item.tag}</span>
                <span className="text-sm text-gray-700 line-clamp-2">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
