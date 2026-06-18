import { FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react'

const applications = [
  { id: '1', title: '失业补贴申领', type: '失业保险', status: '审核中', date: '2026-06-15', statusColor: 'text-warning', statusBg: 'bg-warning/10' },
  { id: '2', title: '医保个人账户查询', type: '医疗保险', status: '已完成', date: '2026-06-10', statusColor: 'text-success', statusBg: 'bg-success/10' },
  { id: '3', title: '养老金资格认证', type: '养老保险', status: '已完成', date: '2026-06-05', statusColor: 'text-success', statusBg: 'bg-success/10' },
  { id: '4', title: '社保转移申请', type: '养老保险', status: '已驳回', date: '2026-05-28', statusColor: 'text-danger', statusBg: 'bg-danger/10' },
  { id: '5', title: '生育保险报销', type: '生育保险', status: '已完成', date: '2026-05-20', statusColor: 'text-success', statusBg: 'bg-success/10' },
]

const statusCounts = [
  { label: '全部', count: 5, icon: FileText, color: 'text-primary' },
  { label: '审核中', count: 1, icon: Clock, color: 'text-warning' },
  { label: '已完成', count: 3, icon: CheckCircle, color: 'text-success' },
  { label: '已驳回', count: 1, icon: XCircle, color: 'text-danger' },
]

export default function ApplicationsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">我的申请</h2>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="搜索申请..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statusCounts.map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <item.icon size={24} className={item.color} />
              <div>
                <div className="text-xl font-bold text-gray-900">{item.count}</div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {applications.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText size={20} className="text-primary" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{item.type} · {item.date}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.statusBg} ${item.statusColor}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
